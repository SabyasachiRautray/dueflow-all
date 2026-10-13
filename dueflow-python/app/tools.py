from datetime import date
from app.data import INVOICES


def get_invoices():
    """Tool 1: Retrieve the invoice ledger."""
    return [invoice.copy() for invoice in INVOICES]


def verify_vendor(invoice):
    """Tool 2: Check whether vendor verification is available."""
    if not invoice["vendor_verified"]:
        return {
            "verified": False,
            "reason": "Vendor MSME status requires verification",
        }

    return {
        "verified": True,
        "reason": "Demo verification record available",
    }


def calculate_deadline(invoice):
    """
    Tool 3: Demonstration deadline calculation.

    This simplified rule is only for the hackathon prototype.
    Real statutory applicability must be validated separately.
    """
    if not invoice["is_msme"]:
        return {
            "applicable": False,
            "deadline": None,
            "days_remaining": None,
        }

    deadline = (invoice["invoice_date"]).fromordinal(
        invoice["invoice_date"].toordinal() + 45
    )

    days_remaining = (deadline - date.today()).days

    return {
        "applicable": True,
        "deadline": deadline.isoformat(),
        "days_remaining": days_remaining,
    }


def prepare_payment_batch(invoice_ids, budget):
    """
    Tool 4: Prepare a proposed batch.
    This does not initiate real payments.
    """
    invoices = get_invoices()
    by_id = {invoice["id"]: invoice for invoice in invoices}

    selected = []
    total = 0

    for invoice_id in invoice_ids:
        invoice = by_id.get(invoice_id)

        if invoice is None:
            continue

        if not invoice["vendor_verified"] or invoice["disputed"]:
            continue

        if total + invoice["amount"] <= budget:
            selected.append({
                "invoice_id": invoice["id"],
                "vendor": invoice["vendor"],
                "amount": invoice["amount"],
            })
            total += invoice["amount"]

    return {
        "status": "awaiting_approval",
        "payments": selected,
        "total": total,
        "remaining_budget": budget - total,
        "executed": False,
    }