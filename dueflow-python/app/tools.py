"""Deterministic investigation tools.

Every tool returns the same envelope:
  {"tool": str, "ok": bool, "flags": [str], "data": dict}
Exact comparisons live here, NOT in the LLM.
"""
from difflib import SequenceMatcher
from statistics import mean

from app import data

# Demo switch: when True, the registry tool raises a transient error.
FAILURE_MODE = {"verify_vendor_registry": False}


class TransientToolError(Exception):
    """A retryable failure (timeout, 503, ...)."""


def _result(tool, ok=True, flags=None, **payload):
    return {"tool": tool, "ok": ok, "flags": flags or [], "data": payload}


def _find_invoice(invoice_id):
    for inv in data.INVOICES:
        if inv["id"] == invoice_id:
            return inv
    return None


def get_invoice(invoice_id):
    inv = _find_invoice(invoice_id)
    if inv is None:
        return _result("get_invoice", ok=False, flags=["INVOICE_NOT_FOUND"], invoice_id=invoice_id)
    return _result("get_invoice", invoice={**inv, "invoice_date": inv["invoice_date"].isoformat()})


def get_vendor_history(vendor_id):
    vendor = data.VENDORS.get(vendor_id)
    if vendor is None:
        return _result("get_vendor_history", ok=False, flags=["VENDOR_NOT_FOUND"], vendor_id=vendor_id)
    pays = [p for p in data.PAYMENTS if p["vendor_id"] == vendor_id]
    amounts = [p["amount"] for p in pays]
    return _result(
        "get_vendor_history",
        vendor=vendor,
        payment_count=len(pays),
        average_payment=round(mean(amounts)) if amounts else None,
        bank_change_requests=[
            {**r, "approved_on": r["approved_on"].isoformat()}
            for r in data.BANK_CHANGE_REQUESTS if r["vendor_id"] == vendor_id
        ],
    )


def detect_bank_change(invoice_id):
    inv = _find_invoice(invoice_id)
    if inv is None:
        return _result("detect_bank_change", ok=False, flags=["INVOICE_NOT_FOUND"])
    master = data.VENDORS[inv["vendor_id"]]["bank_account"]
    on_invoice = inv["bank_account"]
    if on_invoice == master:
        return _result("detect_bank_change", changed=False, master_account=master, invoice_account=on_invoice)

    approved = next(
        (r for r in data.BANK_CHANGE_REQUESTS
         if r["vendor_id"] == inv["vendor_id"] and r["new_bank_account"] == on_invoice),
        None,
    )
    flags = ["BANK_ACCOUNT_CHANGED"]
    if approved is None:
        flags.append("NO_CHANGE_REQUEST_ON_FILE")
    elif not (approved["approved"] and approved["callback_verified"]):
        flags.append("CHANGE_REQUEST_NOT_VERIFIED")
    return _result(
        "detect_bank_change", flags=flags, changed=True,
        master_account=master, invoice_account=on_invoice,
        change_request_id=approved["id"] if approved else None,
        change_request_verified=bool(approved and approved["approved"] and approved["callback_verified"]),
    )


def match_purchase_order(invoice_id):
    inv = _find_invoice(invoice_id)
    if inv is None:
        return _result("match_purchase_order", ok=False, flags=["INVOICE_NOT_FOUND"])
    po = data.PURCHASE_ORDERS.get(inv["po_id"])
    if po is None:
        return _result("match_purchase_order", ok=False, flags=["PO_NOT_FOUND"], po_id=inv["po_id"])
    flags = []
    if po["vendor_id"] != inv["vendor_id"]:
        flags.append("PO_VENDOR_MISMATCH")
    delta_pct = round((inv["amount"] - po["amount"]) / po["amount"] * 100, 1)
    if abs(delta_pct) > 5:
        flags.append("AMOUNT_EXCEEDS_PO" if delta_pct > 0 else "AMOUNT_BELOW_PO")
    return _result("match_purchase_order", flags=flags, po_id=inv["po_id"],
                   po_amount=po["amount"], invoice_amount=inv["amount"], delta_pct=delta_pct)


def find_duplicates(invoice_id):
    inv = _find_invoice(invoice_id)
    if inv is None:
        return _result("find_duplicates", ok=False, flags=["INVOICE_NOT_FOUND"])
    matches = []
    for other in data.INVOICES:
        if other["id"] == inv["id"] or other["vendor_id"] != inv["vendor_id"]:
            continue
        similarity = SequenceMatcher(None, inv["invoice_no"], other["invoice_no"]).ratio()
        same_amount = abs(other["amount"] - inv["amount"]) / inv["amount"] <= 0.01
        same_po = other["po_id"] == inv["po_id"]
        if similarity >= 0.85 and same_amount:
            matches.append({"invoice_id": other["id"], "invoice_no": other["invoice_no"],
                            "status": other["status"], "similarity": round(similarity, 2),
                            "same_po": same_po})
    flags = ["POSSIBLE_DUPLICATE"] if matches else []
    return _result("find_duplicates", flags=flags, matches=matches)


def check_amount_anomaly(invoice_id):
    inv = _find_invoice(invoice_id)
    if inv is None:
        return _result("check_amount_anomaly", ok=False, flags=["INVOICE_NOT_FOUND"])
    pays = [p["amount"] for p in data.PAYMENTS if p["vendor_id"] == inv["vendor_id"]]
    if len(pays) < 2:
        return _result("check_amount_anomaly", flags=["INSUFFICIENT_HISTORY"], baseline=None)
    baseline = mean(pays)
    ratio = round(inv["amount"] / baseline, 2)
    flags = ["AMOUNT_ANOMALY"] if ratio >= 2 else []
    return _result("check_amount_anomaly", flags=flags, baseline=round(baseline), amount=inv["amount"], ratio=ratio)


def verify_vendor_registry(vendor_id):
    """Simulated external registry lookup. Can fail transiently when the demo switch is on."""
    if FAILURE_MODE["verify_vendor_registry"]:
        raise TransientToolError("Vendor registry timed out (simulated)")
    record = data.VENDOR_REGISTRY.get(vendor_id)
    if record is None:
        return _result("verify_vendor_registry", ok=False, flags=["VENDOR_NOT_IN_REGISTRY"])
    flags = [] if record["gst_active"] else ["GST_INACTIVE"]
    return _result("verify_vendor_registry", flags=flags, **record)


TOOLS = {
    "get_invoice": get_invoice,
    "get_vendor_history": get_vendor_history,
    "detect_bank_change": detect_bank_change,
    "match_purchase_order": match_purchase_order,
    "find_duplicates": find_duplicates,
    "check_amount_anomaly": check_amount_anomaly,
    "verify_vendor_registry": verify_vendor_registry,
}