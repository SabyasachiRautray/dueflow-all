import pytest
from app import tools


def test_case_a_suspicious_bank_change():
    r = tools.detect_bank_change("INV-101")
    assert r["data"]["changed"] is True
    assert "NO_CHANGE_REQUEST_ON_FILE" in r["flags"]
    assert "AMOUNT_EXCEEDS_PO" in tools.match_purchase_order("INV-101")["flags"]
    assert "AMOUNT_ANOMALY" in tools.check_amount_anomaly("INV-101")["flags"]


def test_case_b_legit_bank_change_is_not_flagged_as_unverified():
    r = tools.detect_bank_change("INV-102")
    assert r["data"]["changed"] is True
    assert r["data"]["change_request_verified"] is True
    assert "NO_CHANGE_REQUEST_ON_FILE" not in r["flags"]
    assert tools.match_purchase_order("INV-102")["flags"] == []
    assert tools.check_amount_anomaly("INV-102")["flags"] == []


def test_case_c_duplicate_detected():
    r = tools.find_duplicates("INV-103")
    assert "POSSIBLE_DUPLICATE" in r["flags"]
    assert r["data"]["matches"][0]["invoice_id"] == "INV-090"


def test_normal_invoice_is_clean():
    for fn in (tools.detect_bank_change, tools.match_purchase_order, tools.find_duplicates):
        assert fn("INV-104")["flags"] == []


def test_registry_failure_is_raised_and_recoverable():
    tools.FAILURE_MODE["verify_vendor_registry"] = True
    try:
        with pytest.raises(tools.TransientToolError):
            tools.verify_vendor_registry("V-APEX")
    finally:
        tools.FAILURE_MODE["verify_vendor_registry"] = False
    assert tools.verify_vendor_registry("V-APEX")["ok"] is True


def test_missing_invoice_returns_error_not_crash():
    assert tools.get_invoice("INV-999")["ok"] is False