from app.tools import (
    get_invoices,
    verify_vendor,
    calculate_deadline,
    prepare_payment_batch,
)


def run_dueflow_agent(goal: str, budget: float):
    """
    First working agent version:
    plan -> call tools -> evaluate results -> prepare batch.
    """

    steps = []
    errors = []
    candidates = []
    needs_review = []

    # Step 1: Plan
    steps.append({
        "step": 1,
        "action": "plan",
        "status": "completed",
        "detail": "Analyze invoices, verify vendors, calculate deadlines, "
                  "prioritize eligible payments, and prepare an approval batch.",
    })

    # Step 2: Read the ledger
    try:
        invoices = get_invoices()

        steps.append({
            "step": 2,
            "action": "get_invoices",
            "status": "completed",
            "detail": f"Retrieved {len(invoices)} invoices.",
        })
    except Exception as exc:
        return {
            "status": "failed",
            "goal": goal,
            "steps": steps,
            "error": str(exc),
        }

    # Step 3: Investigate and calculate
    for invoice in invoices:
        try:
            verification = verify_vendor(invoice)
            deadline = calculate_deadline(invoice)

            result = {
                **invoice,
                "verification": verification,
                "deadline_info": deadline,
            }

            if not verification["verified"]:
                needs_review.append({
                    "invoice_id": invoice["id"],
                    "reason": verification["reason"],
                })
                continue

            if invoice["disputed"]:
                needs_review.append({
                    "invoice_id": invoice["id"],
                    "reason": "Invoice is disputed.",
                })
                continue

            candidates.append(result)

        except Exception as exc:
            errors.append({
                "invoice_id": invoice["id"],
                "error": str(exc),
            })

    steps.append({
        "step": 3,
        "action": "investigate_and_calculate",
        "status": "completed",
        "detail": (
            f"Evaluated {len(invoices)} invoices; "
            f"{len(candidates)} eligible for prioritization; "
            f"{len(needs_review)} require review."
        ),
    })

    # Step 4: Prioritize by deadline urgency
    candidates.sort(
        key=lambda invoice: (
            invoice["deadline_info"]["days_remaining"]
            if invoice["deadline_info"]["applicable"]
            else 10**9,
            invoice["invoice_date"],
        )
    )

    steps.append({
        "step": 4,
        "action": "prioritize",
        "status": "completed",
        "detail": "Ranked verified, undisputed invoices by deadline urgency.",
    })

    # Step 5: Prepare an approval-only batch
    ranked_ids = [invoice["id"] for invoice in candidates]

    batch = prepare_payment_batch(ranked_ids, budget)

    steps.append({
        "step": 5,
        "action": "prepare_payment_batch",
        "status": "awaiting_approval",
        "detail": "Prepared a proposed batch. No payments were executed.",
    })

    return {
        "status": "awaiting_approval",
        "goal": goal,
        "budget": budget,
        "steps": steps,
        "ranked_invoices": [
            {
                "invoice_id": invoice["id"],
                "vendor": invoice["vendor"],
                "amount": invoice["amount"],
                "days_remaining": (
                    invoice["deadline_info"]["days_remaining"]
                ),
                "deadline": invoice["deadline_info"]["deadline"],
            }
            for invoice in candidates
        ],
        "needs_review": needs_review,
        "errors": errors,
        "proposed_batch": batch,
        "human_approval_required": True,
    }