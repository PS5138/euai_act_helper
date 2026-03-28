"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EUAIActAssessmentInput, HighRiskIndicator } from "@/types/assessment";

type DeploymentData = Partial<EUAIActAssessmentInput["deployment"]>;
type RiskFlagData = Partial<EUAIActAssessmentInput["risk_flags"]>;
type AISystemData = Partial<EUAIActAssessmentInput["ai_system"]>;

interface Props {
  deployment: DeploymentData;
  riskFlags: RiskFlagData;
  aiSystem: AISystemData;
  onDeploymentChange: (update: DeploymentData) => void;
  onRiskFlagsChange: (update: RiskFlagData) => void;
  onAISystemChange: (update: AISystemData) => void;
  errors: Record<string, string>;
}

const END_USER_OPTIONS: { value: EUAIActAssessmentInput["deployment"]["end_users"]; label: string; sub: string }[] = [
  { value: "businesses", label: "Businesses", sub: "B2B — other companies are your customers" },
  { value: "consumers", label: "Consumers", sub: "B2C — individual members of the public" },
  { value: "public_authorities", label: "Public authorities", sub: "Government bodies, law enforcement, regulators" },
  { value: "mixed", label: "Mixed", sub: "A combination of the above" },
];

const AFFECTED_PERSONS_OPTIONS: { value: EUAIActAssessmentInput["deployment"]["affected_persons"]; label: string }[] = [
  { value: "none", label: "None — internal tooling only" },
  { value: "<1k", label: "Fewer than 1,000 people" },
  { value: "1k-100k", label: "1,000 to 100,000 people" },
  { value: "100k-1m", label: "100,000 to 1 million people" },
  { value: "1m+", label: "Over 1 million people" },
];

const OVERSIGHT_OPTIONS: { value: EUAIActAssessmentInput["ai_system"]["human_oversight"]; label: string; sub: string }[] = [
  { value: "full", label: "Full review", sub: "A human always reviews and approves before any action is taken" },
  { value: "partial", label: "Partial oversight", sub: "A human can override but may not always do so" },
  { value: "none", label: "Fully automated", sub: "Decisions are made and acted on without human review" },
];

const DECISION_TYPES: { value: HighRiskIndicator; label: string }[] = [
  { value: "makes_consequential_decisions", label: "Hiring, promotion, or firing decisions" },
  { value: "affects_access_to_services", label: "Access to credit, loans, or insurance" },
  { value: "used_by_authorities", label: "Access to healthcare or social benefits" },
  { value: "monitors_workers", label: "Employee monitoring or performance scoring" },
  { value: "used_in_education_assessment", label: "Educational grading or progression" },
  { value: "processes_biometric_data", label: "Criminal risk scoring or profiling" },
  { value: "operates_critical_infrastructure", label: "Operates safety-critical infrastructure" },
];

export default function Step5Impact({
  deployment,
  riskFlags,
  aiSystem,
  onDeploymentChange,
  onRiskFlagsChange,
  onAISystemChange,
  errors,
}: Props) {
  const consequential = riskFlags.consequential_decisions ?? false;
  const highRiskIndicators = riskFlags.high_risk_indicators ?? [];

  function toggleIndicator(indicator: HighRiskIndicator) {
    const next = highRiskIndicators.includes(indicator)
      ? highRiskIndicators.filter((i) => i !== indicator)
      : [...highRiskIndicators, indicator];
    onRiskFlagsChange({ high_risk_indicators: next });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Who is affected and how?</h2>
        <p className="mt-1 text-slate-500">
          Help us understand the impact your AI system has on people.
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">Who are your end users?</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {END_USER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onDeploymentChange({ end_users: opt.value })}
              className={cn(
                "border-2 rounded-lg p-3 text-left cursor-pointer transition-all",
                deployment.end_users === opt.value
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0",
                  deployment.end_users === opt.value ? "border-blue-600 bg-blue-600" : "border-slate-300"
                )} />
                <div>
                  <p className="text-sm font-medium text-slate-900">{opt.label}</p>
                  <p className="text-xs text-slate-500">{opt.sub}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        {errors.end_users && <p className="text-xs text-red-500">{errors.end_users}</p>}
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">
          Approximately how many people could be affected by this AI system?
        </Label>
        <div className="space-y-2">
          {AFFECTED_PERSONS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onDeploymentChange({ affected_persons: opt.value })}
              className={cn(
                "w-full border-2 rounded-lg px-4 py-3 text-left cursor-pointer transition-all flex items-center gap-3",
                deployment.affected_persons === opt.value
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              )}
            >
              <div className={cn(
                "h-4 w-4 rounded-full border-2 flex-shrink-0",
                deployment.affected_persons === opt.value ? "border-blue-600 bg-blue-600" : "border-slate-300"
              )} />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">
          Does this AI make or influence decisions about specific individuals?
        </Label>
        <div className="flex gap-3">
          {[
            { value: true, label: "Yes" },
            { value: false, label: "No" },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onRiskFlagsChange({ consequential_decisions: opt.value })}
              className={cn(
                "border-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all",
                consequential === opt.value
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {consequential && (
          <div className="space-y-2 pt-1">
            <p className="text-sm text-slate-600">
              What type of decisions?{" "}
              <span className="text-slate-400">(select all that apply)</span>
            </p>
            <div className="space-y-2">
              {DECISION_TYPES.map((dt) => (
                <label key={dt.value} className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={highRiskIndicators.includes(dt.value)}
                    onCheckedChange={() => toggleIndicator(dt.value)}
                  />
                  <span className="text-sm text-slate-700">{dt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">
          How much human review happens before decisions take effect?
        </Label>
        <div className="space-y-2">
          {OVERSIGHT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onAISystemChange({ human_oversight: opt.value, automated_decision_making: opt.value === "none" })}
              className={cn(
                "w-full border-2 rounded-lg p-3 text-left cursor-pointer transition-all",
                aiSystem.human_oversight === opt.value
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0",
                  aiSystem.human_oversight === opt.value ? "border-blue-600 bg-blue-600" : "border-slate-300"
                )} />
                <div>
                  <p className="text-sm font-medium text-slate-900">{opt.label}</p>
                  <p className="text-xs text-slate-500">{opt.sub}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">Additional context</Label>
        <div className="space-y-2">
          {[
            { key: "vulnerable_populations" as const, label: "Involves children, elderly, or other vulnerable groups" },
            { key: "transparency_obligations" as const, label: "Involves AI-generated content or a chatbot users interact with directly" },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={riskFlags[item.key] ?? false}
                onCheckedChange={(checked) =>
                  onRiskFlagsChange({ [item.key]: checked === true })
                }
              />
              <span className="text-sm text-slate-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
