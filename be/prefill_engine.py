"""
EU AI Act Compliance Helper — Company Research / Pre-fill Engine

Given a company domain, uses Claude with web search to research the company
and return a structured AssessmentDraft (using FE field names/values) so the
FE can pre-populate the wizard or go straight to the results page.
"""

import json
import os
import re

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

WEB_SEARCH_TOOL = {"type": "web_search_20250305", "name": "web_search"}
MAX_PAUSE_TURN_RETRIES = 5

PREFILL_PROMPT = """You are a research assistant helping to pre-fill an EU AI Act compliance assessment.

Your task: research the company at the domain "{domain}" and extract structured information about them and their AI products/services.

## Research steps
Use web search to find:
1. The company's main website (homepage + About/Product pages)
2. Their LinkedIn company page (for size, industry, description)
3. Their Crunchbase or similar profile (for funding, size, sector)
4. Any press coverage or product announcements describing their AI system

## Output format
Return ONLY a valid JSON object — no markdown, no explanation, no code fences. The JSON must match this exact structure:

{{
  "company": {{
    "name": "string or null",
    "description": "1-3 sentence plain-English description of what the company does, or null",
    "employee_range": "one of: 1-10, 11-50, 51-250, 251-1000, 1000+ — or null if unknown",
    "is_public_body": true/false/null
  }},
  "ai_system": {{
    "description": "1-3 sentence description of their AI product/system, or null",
    "capabilities": ["array of capability strings from the allowed list below — only include if clearly evidenced"],
    "is_gpai": true/false/null,
    "human_oversight": "full, partial, or none — or null if unknown",
    "automated_decision_making": true/false/null
  }},
  "deployment": {{
    "role": "provider, deployer, both, or unsure — or null",
    "domain": "one domain string from the allowed list below — or null",
    "end_users": "businesses, consumers, public_authorities, or mixed — or null",
    "third_party_ai": "name of third-party AI provider if known (e.g. OpenAI, Google), or null"
  }},
  "risk_flags": {{
    "geography": ["array of geography strings from the allowed list below"],
    "consequential_decisions": true/false/null,
    "high_risk_indicators": ["array from allowed list below"],
    "prohibited_flags": [],
    "vulnerable_populations": null,
    "transparency_obligations": null
  }},
  "source_summary": "1-2 sentences describing what you found and from which sources"
}}

where "is_gpai" refers to general-purpose AI.

## Allowed values

capabilities (only use these exact strings):
natural_language_generation, image_video_generation, decision_making, scoring_ranking,
biometric_recognition, emotion_detection, translation, classification, recommendation,
prediction, other

domain (only use these exact strings):
biometrics_identity, critical_infrastructure, education, employment, essential_services,
law_enforcement, migration_asylum, justice_democracy, healthcare, transportation,
general_business, creative_entertainment, financial_services, other

geography (only use these exact strings):
targets_eu_users, processes_eu_data, incorporated_in_eu, outputs_felt_in_eu, no_eu_exposure

high_risk_indicators (only use these exact strings):
makes_consequential_decisions, affects_access_to_services, used_by_authorities,
processes_biometric_data, monitors_workers, used_in_education_assessment,
operates_critical_infrastructure

## Rules
- Use ONLY the exact strings listed above for enum fields.
- Set fields to null (not empty string) when you cannot determine them from public sources.
- For prohibited_flags and vulnerable_populations: always return [] and null respectively — these require human judgement and should never be pre-filled.
- For transparency_obligations: always return null — this is a legal conclusion.
- Only include geography flags that are clearly evidenced (e.g. "incorporated_in_eu" only if the company is demonstrably EU-based).
- is_gpai should be true only if this company is a foundation-model or general-purpose AI provider (e.g. builds LLMs, image generation models, etc.).
- Return ONLY the JSON object. No other text.
"""


def extract_json(text: str) -> dict:
    """Extract JSON object from Claude's response, handling any surrounding text."""
    # Try direct parse first
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Try to find a JSON object in the text
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from Claude response: {text[:200]}")


def research_company(domain: str) -> dict:
    """
    Research a company by domain and return a dict matching AssessmentDraft shape.
    All fields are optional — the FE merges this over empty defaults.
    """
    # Strip protocol and path — just the bare domain
    clean = re.sub(r'^https?://', '', domain.strip())
    clean = clean.split('/')[0].strip()

    client = Anthropic()
    prompt = PREFILL_PROMPT.format(domain=clean)

    messages = [{"role": "user", "content": prompt}]
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        tools=[WEB_SEARCH_TOOL],
        messages=messages,
    )

    for _ in range(MAX_PAUSE_TURN_RETRIES):
        if message.stop_reason != "pause_turn":
            break
        messages.append({"role": "assistant", "content": message.content})
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            tools=[WEB_SEARCH_TOOL],
            messages=messages,
        )
    else:
        raise RuntimeError("Claude paused too many times during company research.")

    text_parts = [
        block.text for block in message.content if block.type == "text"
    ]
    raw_text = "\n".join(text_parts).strip()

    if not raw_text:
        raise RuntimeError("Claude returned no text for company research.")

    return extract_json(raw_text)
