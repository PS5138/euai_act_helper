import {
  EUAIActAssessmentInput,
  AssessmentDraft,
  ANNEX_III_DOMAINS,
} from "@/types/assessment";

export function preClassify(
  draft: AssessmentDraft
): EUAIActAssessmentInput["preliminary_classification"] {
  const notes: string[] = [];

  const prohibitedFlags = draft.risk_flags?.prohibited_flags ?? [];
  const highRiskIndicators = draft.risk_flags?.high_risk_indicators ?? [];
  const domain = draft.deployment?.domain;
  const capabilities = draft.ai_system?.capabilities ?? [];
  const isGPAI = draft.ai_system?.is_gpai ?? false;
  const consequentialDecisions = draft.risk_flags?.consequential_decisions ?? false;
  const transparencyObligations = draft.risk_flags?.transparency_obligations ?? false;
  const geography = draft.risk_flags?.geography ?? [];

  // Prohibited check (highest priority)
  const likelyProhibited = prohibitedFlags.length > 0;
  if (likelyProhibited) {
    notes.push(
      `Potential prohibited AI use detected: ${prohibitedFlags
        .map((f) => f.replace(/_/g, " "))
        .join(", ")}`
    );
  }

  // GPAI check
  const likelyGPAI = isGPAI;
  if (likelyGPAI) {
    notes.push("This system appears to be a general-purpose AI model (GPAI) with specific obligations under the Act.");
  }

  // High risk: Annex III domain + consequential decisions or indicators
  const inAnnexIIIDomain = domain ? ANNEX_III_DOMAINS.includes(domain) : false;
  const likelyHighRisk =
    !likelyProhibited &&
    inAnnexIIIDomain &&
    (consequentialDecisions || highRiskIndicators.length >= 1);

  if (likelyHighRisk) {
    notes.push(
      `Your domain (${domain?.replace(/_/g, " ")}) is listed in Annex III of the EU AI Act as high-risk.`
    );
    if (consequentialDecisions) {
      notes.push("Your system makes consequential decisions affecting individuals, a key high-risk indicator.");
    }
  }

  // Limited risk: NLG, image generation, or explicit transparency flag
  const likelyLimitedRisk =
    !likelyProhibited &&
    !likelyHighRisk &&
    (capabilities.includes("natural_language_generation") ||
      capabilities.includes("image_video_generation") ||
      transparencyObligations);

  if (likelyLimitedRisk) {
    notes.push("Your system likely has transparency obligations (e.g. disclosing AI-generated content or chatbot identity).");
  }

  // EU exposure note
  if (geography.includes("no_eu_exposure")) {
    notes.push("You indicated no EU exposure — the EU AI Act may not apply to your system.");
  } else if (geography.length > 0) {
    notes.push("Your system has EU exposure and the EU AI Act is likely to apply.");
  }

  // Confidence: higher when more data is present
  const filledFields = [
    draft.company?.name,
    draft.ai_system?.description,
    domain,
    draft.deployment?.role,
  ].filter(Boolean).length;

  const confidence: "low" | "medium" | "high" =
    filledFields >= 3 ? "high" : filledFields >= 2 ? "medium" : "low";

  return {
    likely_prohibited: likelyProhibited,
    likely_high_risk: likelyHighRisk,
    likely_gpai: likelyGPAI,
    likely_limited_risk: likelyLimitedRisk,
    confidence,
    notes,
  };
}

export function buildFinalAssessment(
  draft: AssessmentDraft
): EUAIActAssessmentInput {
  const classification = preClassify(draft);

  return {
    metadata: {
      generated_at: new Date().toISOString(),
      schema_version: "1.0",
    },
    company: {
      name: draft.company?.name ?? "",
      description: draft.company?.description ?? "",
      employee_range: draft.company?.employee_range ?? "1-10",
    },
    ai_system: {
      name: draft.ai_system?.name,
      description: draft.ai_system?.description ?? "",
      capabilities: draft.ai_system?.capabilities ?? [],
      is_gpai: draft.ai_system?.is_gpai ?? false,
      gpai_downstream_uses: draft.ai_system?.gpai_downstream_uses,
      human_oversight: draft.ai_system?.human_oversight ?? "partial",
      automated_decision_making: draft.ai_system?.automated_decision_making ?? false,
    },
    deployment: {
      role: draft.deployment?.role ?? "unsure",
      third_party_ai: draft.deployment?.third_party_ai,
      domain: draft.deployment?.domain ?? "other",
      domain_detail: draft.deployment?.domain_detail,
      end_users: draft.deployment?.end_users ?? "businesses",
      affected_persons: draft.deployment?.affected_persons ?? "none",
    },
    risk_flags: {
      prohibited_flags: draft.risk_flags?.prohibited_flags ?? [],
      high_risk_indicators: draft.risk_flags?.high_risk_indicators ?? [],
      geography: draft.risk_flags?.geography ?? [],
      consequential_decisions: draft.risk_flags?.consequential_decisions ?? false,
      vulnerable_populations: draft.risk_flags?.vulnerable_populations ?? false,
      transparency_obligations: draft.risk_flags?.transparency_obligations ?? false,
    },
    preliminary_classification: classification,
  };
}
