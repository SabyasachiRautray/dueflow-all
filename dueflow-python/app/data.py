from datetime import date, timedelta

today = date.today()

INVOICES = [
    {
        "id": "INV-001",
        "vendor": "Apex Components",
        "amount": 85000,
        "is_msme": True,
        "vendor_verified": True,
        "invoice_date": today - timedelta(days=38),
        "disputed": False,
    },
    {
        "id": "INV-002",
        "vendor": "Bright Packaging",
        "amount": 65000,
        "is_msme": True,
        "vendor_verified": False,
        "invoice_date": today - timedelta(days=25),
        "disputed": False,
    },
    {
        "id": "INV-003",
        "vendor": "Metro Supplies",
        "amount": 55000,
        "is_msme": True,
        "vendor_verified": True,
        "invoice_date": today - timedelta(days=42),
        "disputed": False,
    },
    {
        "id": "INV-004",
        "vendor": "Northstar Services",
        "amount": 40000,
        "is_msme": False,
        "vendor_verified": True,
        "invoice_date": today - timedelta(days=15),
        "disputed": False,
    },
    {
        "id": "INV-005",
        "vendor": "Orion Industrial",
        "amount": 30000,
        "is_msme": True,
        "vendor_verified": True,
        "invoice_date": today - timedelta(days=20),
        "disputed": True,
    },
]