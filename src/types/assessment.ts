export type Role = "provider" | "deployer" | "both" | "unsure";

export type Domain =
  | "biometrics_identity"
  | "critical_infrastructure"
  | "education"
  | "employment"
  | "essential_services"
  | "law_enforcement"
  | "migration_asylum"
  | "justice_democracy"
  | "healthcare"
  | "transportation"
  | "general_business"
  | "creative_entertainment"
  | "other";

export type AICapability =
  | "natural_language_generation"
  | "image_video_generation"
  | "decision_making"
  | "scoring_ranking"
  | "biometric_recognition"
  | "emotion_detection"
  | "translation"
  | "classification"
  | "recommendation"
  | "prediction"
  | "other";

export type ProhibitedFlag =
  | "social_scoring"
  | "realtime_biometric_surveillance"
  | "subliminal_manipulation"
  | "emotion_recognition_workplace_education"
  | "predictive_policing_individual";

export type HighRiskIndicator =
  | "makes_consequential_decisions"
  | "affects_access_to_services"
  | "used_by_authorities"
  | "processes_biometric_data"
  | "monitors_workers"
  | "used_in_education_assessment"
  | "operates_critical_infrastructure";

export type GeographyFlag =
  | "targets_eu_users"
  | "processes_eu_data"
  | "incorporated_in_eu"
  | "outputs_felt_in_eu"
  | "no_eu_exposure";

export type DeploymentStage =
  | "concept"
  | "in_development"
  | "deployed_internally"
  | "deployed_to_customers"
  | "scaled";

export interface EUAIActAssessmentInput {
  metadata: {
    generated_at: string;
    schema_version: "1.0";
  };
  company: {
    name: string;
    description: string;
    employee_range: "1-10" | "11-50" | "51-250" | "251-1000" | "1000+";
    is_public_body: boolean;
  };
  ai_system: {
    name?: string;
    description: string;
    capabilities: AICapability[];
    is_gpai: boolean;
    gpai_downstream_uses?: string;
    human_oversight: "full" | "partial" | "none";
    automated_decision_making: boolean;
  };
  deployment: {
    role: Role;
    third_party_ai?: string;
    domain: Domain;
    domain_detail?: string;
    end_users: "businesses" | "consumers" | "public_authorities" | "mixed";
    affected_persons: "none" | "<1k" | "1k-100k" | "100k-1m" | "1m+";
  };
  risk_flags: {
    prohibited_flags: ProhibitedFlag[];
    high_risk_indicators: HighRiskIndicator[];
    geography: GeographyFlag[];
    consequential_decisions: boolean;
    vulnerable_populations: boolean;
    transparency_obligations: boolean;
  };
  preliminary_classification: {
    likely_prohibited: boolean;
    likely_high_risk: boolean;
    likely_gpai: boolean;
    likely_limited_risk: boolean;
    confidence: "low" | "medium" | "high";
    notes: string[];
  };
}

// Partial assessment built up as user completes steps
export interface AssessmentDraft {
  company: Partial<EUAIActAssessmentInput["company"]>;
  ai_system: Partial<EUAIActAssessmentInput["ai_system"]>;
  deployment: Partial<EUAIActAssessmentInput["deployment"]>;
  risk_flags: Partial<EUAIActAssessmentInput["risk_flags"]>;
}

export const ANNEX_III_DOMAINS: Domain[] = [
  "biometrics_identity",
  "critical_infrastructure",
  "education",
  "employment",
  "essential_services",
  "law_enforcement",
  "migration_asylum",
  "justice_democracy",
];
