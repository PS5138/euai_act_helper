"""
EU AI Act Compliance Helper — API

Run locally:  uvicorn api:app --reload --port 8000
Docs:         http://localhost:8000/docs

Tom's frontend calls:
    POST https://<your-domain>/report
    Body: ClassificationRequest JSON
    Response: ComplianceReport JSON
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import ClassificationRequest, ComplianceReport, TierConfig
from output_engine import generate_report, TIER_CONFIG, DISCLAIMER

app = FastAPI(
    title="EU AI Act Compliance Helper — Output API",
    description="Takes a classification result and generates a compliance report using Claude.",
    version="0.1.0",
)

# CORS — allow Tom's frontend to call this API from the browser.
# Replace "*" with his actual Vercel domain before going live.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: lock down to Tom's Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Health check."""
    return {"status": "ok", "service": "eu-ai-act-output-api"}


@app.post("/report", response_model=ComplianceReport)
def create_report(request: ClassificationRequest):
    """
    Generate a compliance report.

    Tom's frontend POSTs the classification result here.
    Returns a structured report with tier info, obligations,
    and practical guidance.
    """
    try:
        result = request.model_dump()
        # Convert enums to strings for the prompt templates
        result = {k: v.value if hasattr(v, "value") else v for k, v in result.items()}
        report = generate_report(result)
        return ComplianceReport(
            tier=report["tier"],
            tier_config=TierConfig(**report["tier_config"]),
            main_report=report["main_report"],
            gpai_report=report["gpai_report"],
            disclaimer=report["disclaimer"],
            input_summary=report["input_summary"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
