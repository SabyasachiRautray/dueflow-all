from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.agent import run_dueflow_agent

app = FastAPI(
    title="Dueflow Agent API",
    description="Autonomous MSME invoice workflow prototype",
    version="0.1.0",
)


class AgentRequest(BaseModel):
    goal: str = Field(min_length=5)
    budget: float = Field(gt=0)


@app.get("/health")
def health():
    return {"status": "ok", "agent": "Dueflow"}


@app.post("/agent/run")
def run_agent(request: AgentRequest):
    try:
        return run_dueflow_agent(
            goal=request.goal,
            budget=request.budget,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Agent execution failed: {str(exc)}",
        ) from exc