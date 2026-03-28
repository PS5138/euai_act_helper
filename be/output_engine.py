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

WEB_SEARCH_TOOL = {"type": "web_search_20250305", "name": "web_search"}
MAX_PAUSE_TURN_RETRIES = 3
ROLE_GUIDANCE = {
    "provider": (
        "Treat them as the organisation that develops or places the AI system "
        "or model on the market. Focus on provider obligations such as design "
        "choices, documentation, conformity work, instructions for use, and "
        "steps needed before release or supply."
    ),
    "deployer": (
        "Treat them as the organisation using the AI system in practice. Focus "
        "on deployment duties such as human oversight, operational controls, "
        "monitoring, disclosures to affected people, and following provider "
        "instructions. Do not assign every provider obligation to them."
    ),
    "both": (
        "Treat them as both provider and deployer. Clearly separate the "
        "obligations that arise because they build or supply the system from "
        "the obligations that arise because they use it in practice."
    ),
    "importer": (
        "Treat them as an importer bringing the AI system into the EU market. "
        "Focus on importer checks before making the system available, such as "
        "verifying the provider and required documentation or markings, not "
        "supplying systems they know are non-compliant, cooperating on "
        "corrective action, and explaining when importer conduct could trigger "
        "provider-like responsibility."
    ),
    "distributor": (
        "Treat them as a distributor making the AI system available further "
        "down the supply chain. Focus on distributor checks before onward "
        "supply, such as verifying required instructions or markings are "
        "present, not supplying systems they know are non-compliant, "
        "cooperating on corrective action, and explaining when distributor "
        "conduct could trigger provider-like responsibility."
    ),
}

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


def extract_text(message) -> str:
    """Collect all text blocks from an Anthropic message response."""
    text_parts = []
    for block in message.content:
        if block.type == "text":
            text_parts.append(block.text)
    return "\n".join(text_parts).strip()


def build_role_guidance(role: str) -> str:
    """Return role-specific instructions for the report prompt."""
    return ROLE_GUIDANCE.get(
        role,
        (
            "Use the stated role carefully and only describe obligations that "
            "fit that role."
        ),
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
        "role_guidance": build_role_guidance(result.get("role", "Unknown")),
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
        role_guidance=build_role_guidance(result.get("role", "Unknown")),
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

    messages = [{"role": "user", "content": enhanced_prompt}]
    message = client.messages.create(
        model=model,
        max_tokens=8000,
        tools=[WEB_SEARCH_TOOL],
        messages=messages,
    )

    for _ in range(MAX_PAUSE_TURN_RETRIES):
        if message.stop_reason != "pause_turn":
            break

        messages.append({"role": "assistant", "content": message.content})
        message = client.messages.create(
            model=model,
            max_tokens=8000,
            tools=[WEB_SEARCH_TOOL],
            messages=messages,
        )
    else:
        raise RuntimeError(
            "Claude paused too many times while searching the web for legal sources."
        )

    text = extract_text(message)
    if not text:
        raise RuntimeError("Claude returned no text content for the compliance report.")

    return text


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
