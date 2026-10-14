"""Investigation loop: plan -> investigate -> evaluate -> recover -> recommend (-> human review).

Exact comparisons, verdict and approval enforcement are deterministic.
The LLM only chooses the next tool and (optionally) phrases the explanation.
"""
import time

from app import data, llm, planner, tools

MAX_STEPS = 10
MAX_RETRIES = 2
RETRY_BACKOFF_S = 0.4
STAGE = {
    "get_invoice": "ingest", "get_vendor_history": "ingest",
    "detect_bank_change": "classify", "find_duplicates": "classify",
    "match_purchase_order": "classify", "check_amount_anomaly": "classify",
    "verify_vendor_registry": "classify",
}


def _tool_input(name, invoice):
    return {"vendor_id": invoice["vendor_id"]} if name in ("get_vendor_history", "verify_vendor_registry") \
        else {"invoice_id": invoice["id"]}


def _call(name, arg):
    fn = tools.TOOLS[name]
    return fn(arg["vendor_id"]) if "vendor_id" in arg else fn(arg["invoice_id"])


def _verdict(flags, matches, failed_tools):
    """Deterministic decision. Returns (verdict, risk, action)."""
    unverified = "BANK_ACCOUNT_CHANGED" in flags and (
        "NO_CHANGE_REQUEST_ON_FILE" in flags or "CHANGE_REQUEST_NOT_VERIFIED" in flags)
    amount_issue = bool({"AMOUNT_ANOMALY", "AMOUNT_EXCEEDS_PO"} & flags)
    if "POSSIBLE_DUPLICATE" in flags and any(m["status"] == "paid" or m["same_po"] for m in matches):
        return ("block_duplicate", "high",
                "Do not pay. Compare with the earlier invoice and confirm with the vendor whether this is a resubmission.")
    if unverified:
        return ("hold_for_verification", "high" if amount_issue else "medium",
                "Hold payment. Verify the new bank details with the supplier through an independently sourced phone number, not contact details on the invoice.")
    if "BANK_ACCOUNT_CHANGED" in flags and amount_issue:
        return ("manual_review", "medium", "Bank change is documented, but the amount needs a human check against the PO.")
    if flags & {"AMOUNT_ANOMALY", "AMOUNT_EXCEEDS_PO", "PO_NOT_FOUND", "PO_VENDOR_MISMATCH", "POSSIBLE_DUPLICATE"}:
        return ("manual_review", "medium", "Route to a reviewer: the evidence is inconclusive.")
    if failed_tools:
        return ("manual_review", "medium", "A required check could not be completed; do not auto-clear.")
    return ("clear", "low", "No red flags found. Safe to include in the payment batch after normal approval.")


FINDING_TEXT = {
    "BANK_ACCOUNT_CHANGED": "Bank account on the invoice differs from the vendor master record.",
    "NO_CHANGE_REQUEST_ON_FILE": "No approved bank-change request exists for this vendor and account.",
    "CHANGE_REQUEST_NOT_VERIFIED": "A change request exists but was not verified.",
    "AMOUNT_EXCEEDS_PO": "Invoice amount is materially above the purchase order.",
    "AMOUNT_ANOMALY": "Invoice amount is at least twice the vendor's historical average.",
    "POSSIBLE_DUPLICATE": "A near-identical invoice from this vendor already exists.",
    "PO_NOT_FOUND": "No purchase order found for this invoice.",
    "PO_VENDOR_MISMATCH": "The purchase order belongs to a different vendor.",
    "GST_INACTIVE": "Vendor's GST registration is not active in the registry.",
}


def _narrative(verdict, risk, findings, uncertainties, action, tokens_box, llm_down=False):
    template = (
        f"Verdict: {verdict.replace('_', ' ')} (risk: {risk}). "
        + (" ".join(f["detail"] for f in findings) if findings else "No anomalies were found. ")
        + (" Uncertainty: " + "; ".join(uncertainties) + "." if uncertainties else "")
        + ("" if verdict == "clear" else " These are indicators, not proof of fraud.") + " " + action
    )
    prompt = (
        "Write a 3-4 sentence investigation summary for a finance approver. Use ONLY the facts "
        "given. Do not accuse anyone; say 'suspicious' or 'unverified', never 'fraudster'.\n"
        f"Verdict: {verdict}; risk: {risk}\nFindings: {[f['detail'] for f in findings]}\n"
        f"Uncertainties: {uncertainties}\nRecommended action: {action}"
    )
    try:
        if llm_down:
            raise llm.LLMUnavailable("skipped: LLM unavailable earlier in this run")
        text, tokens = llm.chat(prompt, max_tokens=300)
        tokens_box[0] += tokens
        text = text.split("</think>")[-1].strip()
        if len(text) < 40:
            raise ValueError("too short")
        return text, "llm"
    except Exception:
        return template, "template"


def investigate(invoice_id: str, simulate_registry_failure: bool = False):
    steps, state = [], {"done": set(), "flags": set(), "invoice_summary": {}}
    results, failed_tools, uncertainties, tokens_box = {}, [], [], [0]
    planner_stats = {"llm": 0, "rules": 0}

    def add(stage, tool, inp, out, reasoning, status, retry=0, error=None, ms=0, tokens=0):
        steps.append({"step_no": len(steps) + 1, "stage": stage, "tool_name": tool, "input_json": inp,
                      "output_json": out, "reasoning": reasoning, "status": status,
                      "retry_count": retry, "error": error, "duration_ms": ms, "tokens_used": tokens})

    prev = tools.FAILURE_MODE["verify_vendor_registry"]
    tools.FAILURE_MODE["verify_vendor_registry"] = simulate_registry_failure
    try:
        t0 = time.perf_counter()
        first = tools.get_invoice(invoice_id)
        ms = int((time.perf_counter() - t0) * 1000)
        if not first["ok"]:
            add("ingest", "get_invoice", {"invoice_id": invoice_id}, first, "Invoice lookup failed.", "failed", error="INVOICE_NOT_FOUND", ms=ms)
            return {"invoice_id": invoice_id, "verdict": "manual_review", "risk_level": "unknown", "confidence": "low",
                    "findings": [], "uncertainties": ["Invoice not found; nothing to investigate."],
                    "recommended_action": "Check the invoice ID.", "narrative": "Invoice not found.",
                    "requires_human_approval": True, "steps": steps, "planner": planner_stats}
        invoice = first["data"]["invoice"]
        state["invoice_summary"] = {k: invoice[k] for k in ("id", "invoice_no", "vendor_id", "amount", "po_id")}
        add("ingest", "get_invoice", {"invoice_id": invoice_id}, first,
            "Loaded the invoice that triggered the investigation.", "success", ms=ms)

        while len(steps) < MAX_STEPS:
            choice = planner.next_action(state)
            planner_stats[choice["source"]] += 1
            tokens_box[0] += choice["tokens"]
            if choice["tool"] == "finish":
                break
            name, arg = choice["tool"], _tool_input(choice["tool"], invoice)
            reasoning = f"[{choice['source']}] {choice['reason']}" + (f" ({choice['note']})" if choice["note"] else "")

            attempt = 0
            while True:
                t0 = time.perf_counter()
                try:
                    res = _call(name, arg)
                    ms = int((time.perf_counter() - t0) * 1000)
                    add(STAGE[name], name, arg, res, reasoning, "success", retry=attempt, ms=ms,
                        tokens=choice["tokens"] if attempt == 0 else 0)
                    results[name] = res
                    state["flags"] |= set(res["flags"])
                    break
                except tools.TransientToolError as exc:
                    ms = int((time.perf_counter() - t0) * 1000)
                    if attempt < MAX_RETRIES:
                        attempt += 1
                        add(STAGE[name], name, arg, None, reasoning, "retry", retry=attempt, error=str(exc), ms=ms)
                        time.sleep(RETRY_BACKOFF_S * attempt)
                        continue
                    add(STAGE[name], name, arg, None,
                        "Retries exhausted; continuing without this evidence and lowering confidence.",
                        "failed", retry=attempt, error=str(exc), ms=ms)
                    failed_tools.append(name)
                    uncertainties.append(f"{name} was unavailable after {MAX_RETRIES} retries, so external corroboration is missing")
                    break
            state["done"].add(name)

        # Record optional checks that were intentionally not run
        for name in ("check_amount_anomaly", "verify_vendor_registry"):
            if name not in state["done"]:
                why = ("Bank change is backed by a verified change request."
                       if "BANK_ACCOUNT_CHANGED" in state["flags"] else "No bank change or PO problem detected.")
                add(STAGE[name], name, _tool_input(name, invoice), None, f"Not needed: {why}", "skipped")

        flags = state["flags"]
        matches = results.get("find_duplicates", {}).get("data", {}).get("matches", [])
        verdict, risk, action = _verdict(flags, matches, failed_tools)
        findings = [{"flag": f, "detail": FINDING_TEXT[f]} for f in sorted(flags) if f in FINDING_TEXT]
        if "BANK_ACCOUNT_CHANGED" in flags and not ({"NO_CHANGE_REQUEST_ON_FILE", "CHANGE_REQUEST_NOT_VERIFIED"} & flags):
            findings.append({"flag": "CHANGE_VERIFIED", "detail": "The bank change is backed by an approved, callback-verified request."})
        confidence = "high" if not failed_tools else ("medium" if verdict != "manual_review" else "low")
        narrative, narrative_source = _narrative(verdict, risk, findings, uncertainties, action, tokens_box, state.get("llm_down", False))
        add("plan", "generate_report", {"verdict": verdict}, {"narrative_source": narrative_source},
            "Verdict computed by deterministic rules; narrative phrased from the evidence only.", "success", tokens=0)
        return {
            "invoice_id": invoice_id, "verdict": verdict, "risk_level": risk, "confidence": confidence,
            "findings": findings, "uncertainties": uncertainties, "recommended_action": action,
            "narrative": narrative, "narrative_source": narrative_source,
            "requires_human_approval": True, "payment_executed": False,
            "total_tokens": tokens_box[0], "steps": steps, "planner": planner_stats,
        }
    finally:
        tools.FAILURE_MODE["verify_vendor_registry"] = prev