"""
EU AI Act Output Engine

Core logic shared by both the API (api.py) and the playground (playground.py).
Takes a classification result dict and produces a compliance report via Claude.

Usage:
    from output_engine import generate_report
    report = generate_report(classification_result)
"""

import os
from anthropic import Anthropic
from dotenv import load_dotenv
from prompts import PROMPT_MAP, GPAI_TEMPLATE, ANNEX_III_TEXT

load_dotenv()

TIER_CONFIG = {
    "PROHIBITED": {
        "label": "Prohibited",
        "colour": "red",
        "summary": "This AI practice is banned under Article 5 of the EU AI Act.",
    },
    "HIGH_RISK": {
        "label": "High-risk",
        "colour": "orange",
        "summary": "This system is subject to extensive compliance requirements.",
    },
    "LIMITED": {
        "label": "Limited risk",
        "colour": "yellow",
        "summary": "This system has transparency obligations under Article 50.",
    },
    "MINIMAL": {
        "label": "Minimal risk",
        "colour": "green",
        "summary": "No mandatory obligations. Voluntary best practices encouraged.",
    },
    "EXCLUDED": {
        "label": "Excluded",
        "colour": "grey",
        "summary": "This system appears to be outside the scope of the EU AI Act.",
    },
}

DISCLAIMER = (
    "This analysis is for informational purposes only and does not constitute "
    "legal advice. The EU AI Act is complex and its interpretation may vary "
    "by jurisdiction and circumstance. Please consult qualified legal counsel "
    "for compliance decisions."
)


def build_prompt(result: dict) -> str:
    """Select the right template and inject all context."""
    tier = result["tier"]
    template = PROMPT_MAP[tier]

    kwargs = {
        "org_name": result.get("org_name", "Unknown"),
        "domain": result.get("domain", "Unknown"),
        "description": result.get("description", "Not provided"),
        "role": result.get("role", "Unknown"),
        "autonomy": result.get("autonomy", "Unknown"),
        "affected_group": result.get("affected_group", "Unknown"),
        "feature_flags": ", ".join(result.get("feature_flags", [])) or "None",
        "is_public_body": result.get("is_public_body", False),
    }

    if tier == "HIGH_RISK":
        kwargs["annex_iii_text"] = ANNEX_III_TEXT

    return template.format(**kwargs)


def build_gpai_prompt(result: dict) -> str:
    """Build the GPAI add-on prompt if applicable."""
    return GPAI_TEMPLATE.format(
        org_name=result.get("org_name", "Unknown"),
        role=result.get("role", "Unknown"),
        description=result.get("description", "Not provided"),
    )


def call_claude(prompt: str, model: str = "claude-sonnet-4-20250514") -> str:
    """Make a Claude API call with web search enabled."""
    client = Anthropic()

    enhanced_prompt = (
        prompt
        + "\n\nIMPORTANT: Use your web search capability to look up the specific "
        "articles and provisions of the EU AI Act (Regulation (EU) 2024/1689) "
        "that apply to this system. Cite specific article numbers and their "
        "actual text where relevant."
    )

    message = client.messages.create(
        model=model,
        max_tokens=8000,
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
        messages=[{"role": "user", "content": enhanced_prompt}],
    )

    text_parts = []
    for block in message.content:
        if block.type == "text":
            text_parts.append(block.text)
    return "\n".join(text_parts)


def generate_report(result: dict) -> dict:
    """
    Main entry point. Takes a classification result dict,
    calls Claude with the appropriate prompt, and returns
    a structured report.
    """
    tier = result["tier"]

    main_prompt = build_prompt(result)
    main_report = call_claude(main_prompt)

    gpai_report = None
    if result.get("is_gpai", False):
        gpai_prompt = build_gpai_prompt(result)
        gpai_report = call_claude(gpai_prompt)

    return {
        "tier": tier,
        "tier_config": TIER_CONFIG[tier],
        "main_report": main_report,
        "gpai_report": gpai_report,
        "disclaimer": DISCLAIMER,
        "input_summary": result,
    }
