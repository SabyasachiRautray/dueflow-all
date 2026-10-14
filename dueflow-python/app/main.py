from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app import data
from app.agent import investigate

app = FastAPI(title="Dueflow Fraud Investigator", version="0.2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class InvestigateRequest(BaseModel):
    invoice_id: str
    simulate_registry_failure: bool = False


@app.get("/health")
def health():
    return {"status": "ok", "agent": "Dueflow Fraud Investigator"}


@app.get("/cases")
def cases():
    return [{"invoice_id": i["id"], "invoice_no": i["invoice_no"], "vendor_id": i["vendor_id"],
             "amount": i["amount"], "status": i["status"]} for i in data.INVOICES if i["status"] == "pending"]


@app.post("/investigate")
def run(req: InvestigateRequest):
    return investigate(req.invoice_id, req.simulate_registry_failure)