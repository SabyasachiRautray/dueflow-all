"""Chooses the next investigation tool.

The LLM proposes; the backend validates. If the LLM is down, returns junk, picks an
illegal/repeated tool, or tries to finish early, the deterministic rule planner decides.
"""
import json
import re

from app import llm

TOOL_DESCRIPTIONS = {
    "get_vendor_history": "vendor master record, payment history, bank-change requests",
    "detect_bank_change": "compare invoice bank account with vendor master and change requests",
    "find_duplicates": "look for near-duplicate invoices from the same vendor",
    "match_purchase_order": "compare invoice with its purchase order",
    "check_amount_anomaly": "compare amount with the vendor's payment history",
    "verify_vendor_registry": "external registry lookup of vendor GST/MSME status (can fail)",
}
ALL_TOOLS = list(TOOL_DESCRIPTIONS)


def rule_next(state):
    """Deterministic planner. Returns (tool_or_'finish', reason)."""
    done, flags = state["done"], state["flags"]
    for tool, why in (
        ("get_vendor_history", "Need the vendor's baseline before judging anything."),
        ("detect_bank_change", "Always check the payment destination against the vendor master."),
        ("find_duplicates", "Rule out a repeated or lightly altered invoice."),
        ("match_purchase_order", "Confirm the invoice is backed by a purchase order and amount."),
    ):
        if tool not in done:
            return tool, why
    unverified_change = "BANK_ACCOUNT_CHANGED" in flags and (
        "NO_CHANGE_REQUEST_ON_FILE" in flags or "CHANGE_REQUEST_NOT_VERIFIED" in flags)
    po_issue = bool({"AMOUNT_EXCEEDS_PO", "PO_NOT_FOUND", "PO_VENDOR_MISMATCH"} & flags)
    if (unverified_change or po_issue) and "check_amount_anomaly" not in done:
        return "check_amount_anomaly", "Unverified change or PO problem: compare amount with history."
    if unverified_change and "verify_vendor_registry" not in done:
        return "verify_vendor_registry", "Unverified bank change: look for external corroboration."
    return "finish", "Enough evidence gathered for a recommendation."


def _parse(text):
    matches = re.findall(r'\{[^{}]*"next_tool"[^{}]*\}', text, flags=re.S)
    if not matches:
        raise ValueError("no JSON with next_tool")
    return json.loads(matches[-1])


def next_action(state):
    """Return dict: tool, reason, source ('llm'|'rules'), tokens, note."""
    rule_tool, rule_reason = rule_next(state)
    remaining = [t for t in ALL_TOOLS if t not in state["done"]]
    prompt = (
        "You are a payment-fraud investigator choosing the next tool. "
        "Anomalies are suspicious, NOT proof of fraud.\n"
        f"Invoice: {json.dumps(state['invoice_summary'])}\n"
        f"Tools already run: {sorted(state['done'])}\n"
        f"Flags so far: {sorted(state['flags'])}\n"
        "Remaining tools: " + json.dumps({t: TOOL_DESCRIPTIONS[t] for t in remaining}) + "\n"
        'Reply with ONLY JSON: {"next_tool": "<tool name or finish>", "reason": "<one sentence>"}'
    )
    if state.get("llm_down"):
        return {"tool": rule_tool, "reason": rule_reason, "source": "rules", "tokens": 0,
                "note": "LLM unavailable earlier in this run; used rule planner"}
    try:
        text, tokens = llm.chat(prompt)
        out = _parse(text)
        tool, reason = out["next_tool"], str(out.get("reason", ""))[:300]
    except Exception as exc:
        if isinstance(exc, llm.LLMUnavailable):
            state["llm_down"] = True  # circuit breaker: stop paying the timeout on every step
        return {"tool": rule_tool, "reason": rule_reason, "source": "rules", "tokens": 0,
                "note": f"LLM planner unavailable ({type(exc).__name__}); used rule planner"}

    if tool == "finish" and rule_tool != "finish":
        return {"tool": rule_tool, "reason": rule_reason, "source": "rules", "tokens": tokens,
                "note": "LLM tried to finish early; backend coverage guard required more evidence"}
    if tool != "finish" and (tool not in ALL_TOOLS or tool in state["done"]):
        return {"tool": rule_tool, "reason": rule_reason, "source": "rules", "tokens": tokens,
                "note": f"LLM proposed invalid or repeated tool '{tool}'; used rule planner"}
    return {"tool": tool, "reason": reason or rule_reason, "source": "llm", "tokens": tokens, "note": None}