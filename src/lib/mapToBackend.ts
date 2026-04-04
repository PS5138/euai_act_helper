/**
 * Maps FE EUAIActAssessmentInput to the BE ClassificationRequest shape.
 *
 * BE schema (be/models.py) is canonical. This file bridges the two.
 */

import { EUAIActAssessmentInput } from "@/types/assessment";

// BE Domain enum values differ from FE's Domain type
const DOMAIN_MAP: Record<string, string> = {
  biometrics_identity: "biometrics",
  migration_asylum: "migration",
  justice_democracy: "justice",
  general_business: "general_consumer",
  creative_entertainment: "general_consumer",
  transportation: "essential_services",
  // pass-through (same in both schemas)
  critical_infrastructure: "critical_infrastructure",
  education: "education",
  employment: "employment",
  essential_services: "essential_services",
  law_enforcement: "law_enforcement",
  healthcare: "healthcare",
  financial_services: "financial_services",
  internal_tool: "internal_tool",
  other: "other",
};

// BE Autonomy enum derived from FE's human_oversight + automated_decision_making
function mapAutonomy(
  oversight: string | undefined,
  automated: boolean | undefined,
): string {
  if (oversight === "none") return automated ? "fully_automated" : "informational";
  if (oversight === "full") return "human_decides";
  return "human_sometimes"; // partial
}

// BE AffectedGroup: inferred from domain (best signal) then end_users
function mapAffectedGroup(domain: string, endUsers: string | undefined): string {
  if (domain === "employment") return "employees";
  if (domain === "education") return "students";
  if (domain === "healthcare") return "patients";
  if (domain === "migration_asylum" || domain === "justice_democracy" || domain === "law_enforcement") return "general_public";
  if (endUsers === "public_authorities") return "general_public";
  if (endUsers === "consumers") return "general_public";
  // B2B systems typically affect the employees of those businesses
  if (endUsers === "businesses") return "employees";
  return "general_public";
}

// feature_flags: map FE capabilities + risk indicators to BE string flags
const CAPABILITY_FLAG_MAP: Record<string, string> = {
  natural_language_generation: "nlg_output",
  image_video_generation: "generative_media",
  decision_making: "automated_decisions",
  scoring_ranking: "scoring_ranking",
  biometric_recognition: "biometric_processing",
  emotion_detection: "emotion_recognition",
  classification: "classification",
  recommendation: "recommendation",
  prediction: "prediction",
  translation: "translation",
};

function mapFeatureFlags(assessment: EUAIActAssessmentInput): string[] {
  const flags = new Set<string>();

  for (const cap of assessment.ai_system.capabilities) {
    const flag = CAPABILITY_FLAG_MAP[cap];
    if (flag) flags.add(flag);
  }

  const rf = assessment.risk_flags;
  if (rf.consequential_decisions) flags.add("consequential_decisions");
  if (rf.vulnerable_populations) flags.add("vulnerable_populations");
  if (rf.transparency_obligations) flags.add("direct_interaction");

  for (const f of rf.prohibited_flags) flags.add(f);

  return Array.from(flags);
}

// Tier: derived from preliminary_classification
function mapTier(
  prelim: EUAIActAssessmentInput["preliminary_classification"],
): string {
  if (prelim.likely_prohibited) return "PROHIBITED";
  if (prelim.likely_high_risk) return "HIGH_RISK";
  if (prelim.likely_limited_risk) return "LIMITED";
  return "MINIMAL";
}

// Enrich description with all the extra FE context that BE doesn't have fields for
function buildEnrichedDescription(assessment: EUAIActAssessmentInput): string {
  const parts: string[] = [assessment.ai_system.description];

  const { deployment, risk_flags, ai_system } = assessment;

  if (deployment.domain_detail) {
    parts.push(`Use case detail: ${deployment.domain_detail}`);
  }
  if (deployment.third_party_ai) {
    parts.push(`Third-party AI provider: ${deployment.third_party_ai}`);
  }
  if (deployment.affected_persons && deployment.affected_persons !== "none") {
    parts.push(`Approximate number of people affected: ${deployment.affected_persons}`);
  }
  if (risk_flags.geography.length > 0 && !risk_flags.geography.includes("no_eu_exposure")) {
    parts.push(`EU exposure: ${risk_flags.geography.join(", ")}`);
  }
  if (risk_flags.high_risk_indicators.length > 0) {
    parts.push(`High-risk indicators identified: ${risk_flags.high_risk_indicators.join(", ")}`);
  }
  if (risk_flags.prohibited_flags.length > 0) {
    parts.push(`Potentially prohibited practices flagged: ${risk_flags.prohibited_flags.join(", ")}`);
  }
  if (ai_system.gpai_downstream_uses) {
    parts.push(`GPAI downstream uses: ${ai_system.gpai_downstream_uses}`);
  }
  if (ai_system.capabilities.length > 0) {
    parts.push(`AI capabilities: ${ai_system.capabilities.join(", ")}`);
  }

  return parts.filter(Boolean).join("\n\n");
}

export interface BackendRequest {
  org_name: string;
  domain: string;
  description: string;
  role: string;
  autonomy: string;
  affected_group: string;
  feature_flags: string[];
  is_public_body: boolean;
  is_gpai: boolean;
  tier: string;
}

export function mapAssessmentToRequest(
  assessment: EUAIActAssessmentInput,
): BackendRequest {
  const domain = assessment.deployment.domain;
  const role = assessment.deployment.role === "unsure" ? "deployer" : assessment.deployment.role;

  return {
    org_name: assessment.company.name,
    domain: DOMAIN_MAP[domain] ?? "other",
    description: buildEnrichedDescription(assessment),
    role,
    autonomy: mapAutonomy(
      assessment.ai_system.human_oversight,
      assessment.ai_system.automated_decision_making,
    ),
    affected_group: mapAffectedGroup(domain, assessment.deployment.end_users),
    feature_flags: mapFeatureFlags(assessment),
    is_public_body: assessment.company.is_public_body,
    is_gpai: assessment.ai_system.is_gpai,
    tier: mapTier(assessment.preliminary_classification),
  };
}
