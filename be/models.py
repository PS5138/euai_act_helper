"""
Pydantic models for the EU AI Act Output API.

These define the shape of what Tom's frontend sends (ClassificationRequest)
and what we send back (ComplianceReport). FastAPI uses these to auto-validate
incoming JSON and generate docs.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class Tier(str, Enum):
    PROHIBITED = "PROHIBITED"
    HIGH_RISK = "HIGH_RISK"
    LIMITED = "LIMITED"
    MINIMAL = "MINIMAL"
    EXCLUDED = "EXCLUDED"


class Domain(str, Enum):
    BIOMETRICS = "biometrics"
    CRITICAL_INFRASTRUCTURE = "critical_infrastructure"
    EDUCATION = "education"
    EMPLOYMENT = "employment"
    ESSENTIAL_SERVICES = "essential_services"
    LAW_ENFORCEMENT = "law_enforcement"
    MIGRATION = "migration"
    JUSTICE = "justice"
    HEALTHCARE = "healthcare"
    FINANCIAL_SERVICES = "financial_services"
    GENERAL_CONSUMER = "general_consumer"
    INTERNAL_TOOL = "internal_tool"
    OTHER = "other"


class Role(str, Enum):
    PROVIDER = "provider"
    DEPLOYER = "deployer"
    BOTH = "both"
    IMPORTER = "importer"
    DISTRIBUTOR = "distributor"


class Autonomy(str, Enum):
    FULLY_AUTOMATED = "fully_automated"
    HUMAN_DECIDES = "human_decides"
    HUMAN_SOMETIMES = "human_sometimes"
    INFORMATIONAL = "informational"


class AffectedGroup(str, Enum):
    GENERAL_PUBLIC = "general_public"
    EMPLOYEES = "employees"
    STUDENTS = "students"
    PATIENTS = "patients"
    APPLICANTS = "applicants"
    INTERNAL_STAFF = "internal_staff"


class ClassificationRequest(BaseModel):
    """What Tom's frontend sends."""
    org_name: str = Field(..., min_length=1, max_length=200)
    domain: Domain
    description: str = Field(..., min_length=10, max_length=2000)
    role: Role
    autonomy: Autonomy
    affected_group: AffectedGroup
    feature_flags: list[str] = Field(default_factory=list)
    is_public_body: bool = False
    is_gpai: bool = False
    tier: Tier

    class Config:
        json_schema_extra = {
            "example": {
                "org_name": "Acme Health Ltd",
                "domain": "healthcare",
                "description": "AI system that triages patient symptoms in A&E and recommends priority levels to nurses.",
                "role": "provider",
                "autonomy": "human_sometimes",
                "affected_group": "patients",
                "feature_flags": ["direct_interaction"],
                "is_public_body": False,
                "is_gpai": False,
                "tier": "HIGH_RISK",
            }
        }


class TierConfig(BaseModel):
    """Display metadata for the tier."""
    label: str
    colour: str
    summary: str


class ComplianceReport(BaseModel):
    """What your API returns to Tom's frontend."""
    tier: Tier
    tier_config: TierConfig
    main_report: str           # markdown from Claude
    gpai_report: Optional[str] = None  # markdown from Claude if GPAI
    disclaimer: str
    input_summary: dict        # echo back the inputs for display
