"""Synthetic dataset for the Dueflow fraud investigator.

All records are fictional. Three seeded cases:
  INV-101  suspicious  : bank account changed, no approved request, amount ~3x normal
  INV-102  legitimate  : bank account changed, but an approved + callback-verified request exists
  INV-103  duplicate   : invoice number differs by one character from an already-paid invoice
Everything else is a normal invoice.
"""
from datetime import date, timedelta

today = date.today()


def d(days_ago: int) -> date:
    return today - timedelta(days=days_ago)


VENDORS = {
    "V-APEX": {"name": "Apex Components", "is_msme": True, "bank_account": "HDFC-50100123456789"},
    "V-BRIGHT": {"name": "Bright Packaging", "is_msme": True, "bank_account": "ICICI-001234567890"},
    "V-METRO": {"name": "Metro Supplies", "is_msme": True, "bank_account": "SBI-30123456789"},
    "V-NORTH": {"name": "Northstar Services", "is_msme": False, "bank_account": "AXIS-917020012345"},
}

# External registry (the tool that can fail in the demo)
VENDOR_REGISTRY = {
    "V-APEX": {"gst_active": True, "msme_registered": True},
    "V-BRIGHT": {"gst_active": True, "msme_registered": True},
    "V-METRO": {"gst_active": True, "msme_registered": True},
    "V-NORTH": {"gst_active": True, "msme_registered": False},
}

PURCHASE_ORDERS = {
    "PO-7001": {"vendor_id": "V-APEX", "amount": 90000},
    "PO-7002": {"vendor_id": "V-METRO", "amount": 56000},
    "PO-7003": {"vendor_id": "V-BRIGHT", "amount": 65000},
    "PO-7004": {"vendor_id": "V-NORTH", "amount": 40000},
}

# Approved vendor bank-change requests (the paper trail that makes a change legitimate)
BANK_CHANGE_REQUESTS = [
    {
        "id": "BCR-1",
        "vendor_id": "V-METRO",
        "new_bank_account": "KOTAK-7712345678",
        "approved": True,
        "callback_verified": True,
        "approved_on": d(20),
    },
]

# Past payments (history used for baselines and duplicate checks)
PAYMENTS = [
    {"invoice_id": "INV-001", "vendor_id": "V-APEX", "amount": 82000, "paid_on": d(120)},
    {"invoice_id": "INV-002", "vendor_id": "V-APEX", "amount": 88000, "paid_on": d(75)},
    {"invoice_id": "INV-003", "vendor_id": "V-APEX", "amount": 85000, "paid_on": d(30)},
    {"invoice_id": "INV-010", "vendor_id": "V-METRO", "amount": 54000, "paid_on": d(90)},
    {"invoice_id": "INV-011", "vendor_id": "V-METRO", "amount": 55000, "paid_on": d(45)},
    {"invoice_id": "INV-090", "vendor_id": "V-BRIGHT", "amount": 65000, "paid_on": d(6)},
    {"invoice_id": "INV-020", "vendor_id": "V-NORTH", "amount": 41000, "paid_on": d(60)},
]

INVOICES = [
    # --- seeded cases ---
    {"id": "INV-101", "invoice_no": "AC-2210", "vendor_id": "V-APEX", "amount": 285000,
     "invoice_date": d(3), "po_id": "PO-7001", "bank_account": "YESB-99887766554", "status": "pending"},
    {"id": "INV-102", "invoice_no": "MS-0457", "vendor_id": "V-METRO", "amount": 56000,
     "invoice_date": d(4), "po_id": "PO-7002", "bank_account": "KOTAK-7712345678", "status": "pending"},
    {"id": "INV-103", "invoice_no": "BP-2041-A", "vendor_id": "V-BRIGHT", "amount": 65000,
     "invoice_date": d(2), "po_id": "PO-7003", "bank_account": "ICICI-001234567890", "status": "pending"},
    # --- already paid original of the duplicate ---
    {"id": "INV-090", "invoice_no": "BP-2041", "vendor_id": "V-BRIGHT", "amount": 65000,
     "invoice_date": d(12), "po_id": "PO-7003", "bank_account": "ICICI-001234567890", "status": "paid"},
    # --- normal invoice (control) ---
    {"id": "INV-104", "invoice_no": "NS-118", "vendor_id": "V-NORTH", "amount": 40000,
     "invoice_date": d(5), "po_id": "PO-7004", "bank_account": "AXIS-917020012345", "status": "pending"},
]