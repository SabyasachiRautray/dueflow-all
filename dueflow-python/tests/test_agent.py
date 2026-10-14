from app import agent, planner, llm


def names(r, status=None):
    return [s["tool_name"] for s in r["steps"] if status is None or s["status"] == status]


def test_case_a_holds_and_explores_more_tools():
    r = agent.investigate("INV-101")
    assert r["verdict"] == "hold_for_verification" and r["risk_level"] == "high"
    assert "verify_vendor_registry" in names(r, "success") and "check_amount_anomaly" in names(r, "success")
    assert r["requires_human_approval"] and r["payment_executed"] is False
    assert "not proof of fraud" in r["narrative"] or r["narrative_source"] == "llm"


def test_case_b_is_cleared_with_shorter_path():
    r = agent.investigate("INV-102")
    assert r["verdict"] == "clear"
    assert {"verify_vendor_registry", "check_amount_anomaly"} <= set(names(r, "skipped"))
    assert any(f["flag"] == "CHANGE_VERIFIED" for f in r["findings"])


def test_case_c_blocks_duplicate():
    r = agent.investigate("INV-103")
    assert r["verdict"] == "block_duplicate"


def test_normal_invoice_clear():
    assert agent.investigate("INV-104")["verdict"] == "clear"


def test_registry_failure_retries_then_recovers_safely():
    r = agent.investigate("INV-101", simulate_registry_failure=True)
    reg = [s for s in r["steps"] if s["tool_name"] == "verify_vendor_registry"]
    assert [s["status"] for s in reg] == ["retry", "retry", "failed"]
    assert r["verdict"] == "hold_for_verification" and r["confidence"] == "medium"
    assert r["uncertainties"]


def test_failure_flag_is_reset_after_run():
    agent.investigate("INV-101", simulate_registry_failure=True)
    assert agent.investigate("INV-101")["confidence"] == "high"


def test_unknown_invoice_does_not_crash():
    r = agent.investigate("INV-999")
    assert r["verdict"] == "manual_review" and r["steps"][0]["status"] == "failed"


def test_llm_cannot_finish_early(monkeypatch):
    monkeypatch.setattr(llm, "chat", lambda p, max_tokens=500: ('{"next_tool": "finish", "reason": "done"}', 10))
    r = agent.investigate("INV-101")
    assert r["verdict"] == "hold_for_verification"
    assert len(names(r, "success")) >= 6


def test_llm_garbage_falls_back_to_rules(monkeypatch):
    monkeypatch.setattr(llm, "chat", lambda p, max_tokens=500: ("I think you should call a tool", 5))
    assert agent.investigate("INV-103")["verdict"] == "block_duplicate"


def test_llm_valid_choice_is_used(monkeypatch):
    monkeypatch.setattr(llm, "chat", lambda p, max_tokens=500: ('{"next_tool": "detect_bank_change", "reason": "start with bank"}', 12))
    r = agent.investigate("INV-101")
    assert r["planner"]["llm"] >= 1
    assert names(r)[1] == "detect_bank_change"


def test_llm_outage_costs_one_call_not_one_per_step(monkeypatch):
    calls = []

    def boom(prompt, max_tokens=500):
        calls.append(1)
        raise llm.LLMUnavailable("down")

    monkeypatch.setattr(llm, "chat", boom)
    r = agent.investigate("INV-101")
    assert len(calls) == 1
    assert r["verdict"] == "hold_for_verification" and r["narrative_source"] == "template"