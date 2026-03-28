"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AssessmentDraft, DeploymentStage } from "@/types/assessment";
import { buildFinalAssessment } from "@/lib/classify";
import { detectCapabilities, detectDomain } from "@/lib/detect";
import ProgressBar from "./ProgressBar";
import StepNavigation from "./StepNavigation";
import Step1Company from "@/components/steps/Step1Company";
import Step2Role from "@/components/steps/Step2Role";
import Step3AIDescription from "@/components/steps/Step3AIDescription";
import Step4Domain from "@/components/steps/Step4Domain";
import Step5Impact from "@/components/steps/Step5Impact";
import Step6ProhibitedFlags from "@/components/steps/Step6ProhibitedFlags";
import Step7Geography from "@/components/steps/Step7Geography";

const STEP_TITLES = [
  "Company Info",
  "Your Role",
  "AI System",
  "Domain",
  "Impact",
  "Risk Check",
  "Geography",
];

const TOTAL_STEPS = STEP_TITLES.length;

const INITIAL_DRAFT: AssessmentDraft = {
  company: {},
  ai_system: {},
  deployment: {},
  risk_flags: {
    prohibited_flags: [],
    high_risk_indicators: [],
    geography: [],
    consequential_decisions: false,
    vulnerable_populations: false,
    transparency_obligations: false,
  },
};

function validate(step: number, draft: AssessmentDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 1) {
    if (!draft.company.name?.trim()) errors.name = "Please enter your company name.";
    if (!draft.company.description?.trim()) errors.description = "Please describe your company.";
    if (!draft.company.employee_range) errors.employee_range = "Please select a company size.";
  }
  if (step === 2) {
    if (!draft.deployment.role) errors.role = "Please select your role.";
  }
  if (step === 3) {
    if (!draft.ai_system.description?.trim()) errors.description = "Please describe your AI system.";
  }
  if (step === 4) {
    if (!draft.deployment.domain) errors.domain = "Please select a domain.";
  }
  return errors;
}

export default function WizardShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<AssessmentDraft>(INITIAL_DRAFT);
  const [deploymentStage, setDeploymentStage] = useState<DeploymentStage | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [aiDescriptionPrefilled, setAIDescriptionPrefilled] = useState(false);
  const [prefillConfidence, setPrefillConfidence] = useState<Record<string, boolean>>({});

  // Load existing assessment (edit mode from results page) or legacy prefill data
  useEffect(() => {
    if (isEditMode) {
      const stored = sessionStorage.getItem("euai_assessment");
      if (!stored) { router.replace("/"); return; }
      try {
        const assessment = JSON.parse(stored);
        // Map EUAIActAssessmentInput back to AssessmentDraft
        setDraft({
          company: assessment.company,
          ai_system: assessment.ai_system,
          deployment: assessment.deployment,
          risk_flags: assessment.risk_flags,
        });
        setAIDescriptionPrefilled(true);
        setPrefillConfidence({ description: true });
      } catch {
        router.replace("/");
      }
      return;
    }

    // Legacy: prefill from old euai_prefill key (manual wizard entry point)
    const stored = sessionStorage.getItem("euai_prefill");
    if (!stored) return;
    try {
      const { draft: prefilled, confidence } = JSON.parse(stored);
      setDraft(prefilled);
      setPrefillConfidence(confidence ?? {});
      setAIDescriptionPrefilled(true);
      sessionStorage.removeItem("euai_prefill");
    } catch {
      // ignore malformed data
    }
  }, [isEditMode, router]);

  function updateCompany(update: Partial<AssessmentDraft["company"]>) {
    setDraft((d) => ({ ...d, company: { ...d.company, ...update } }));
  }
  function updateAISystem(update: Partial<AssessmentDraft["ai_system"]>) {
    setDraft((d) => ({ ...d, ai_system: { ...d.ai_system, ...update } }));
  }
  function updateDeployment(update: Partial<AssessmentDraft["deployment"]>) {
    setDraft((d) => ({ ...d, deployment: { ...d.deployment, ...update } }));
  }
  function updateRiskFlags(update: Partial<AssessmentDraft["risk_flags"]>) {
    setDraft((d) => ({ ...d, risk_flags: { ...d.risk_flags, ...update } }));
  }

  function handleNext() {
    const stepErrors = validate(step, draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});

    // When leaving Step 1, use company description to pre-fill AI system + domain
    // (only if not already pre-filled from the URL scan)
    if (step === 1 && !prefillConfidence.description) {
      const companyText = draft.company.description ?? "";
      setDraft((d) => {
        const needsPrefill = !d.ai_system.description?.trim();
        const description = needsPrefill ? companyText : d.ai_system.description!;
        const detected = detectCapabilities(description);
        const merged = Array.from(new Set([...(d.ai_system.capabilities ?? []), ...detected]));
        const domain = d.deployment.domain ?? detectDomain(companyText) ?? undefined;
        if (needsPrefill) setAIDescriptionPrefilled(true);
        return {
          ...d,
          ai_system: { ...d.ai_system, description, capabilities: merged },
          deployment: { ...d.deployment, domain },
        };
      });
    }

    if (step === TOTAL_STEPS) {
      const assessment = buildFinalAssessment(draft);
      sessionStorage.setItem("euai_assessment", JSON.stringify(assessment));
      router.push("/results");
      return;
    }

    setDirection("forward");
    setStep((s) => s + 1);
  }

  function handleBack() {
    setErrors({});
    setDirection("back");
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                EU AI Act
              </span>
              <span className="text-sm text-slate-500">
                {isEditMode ? "Edit Answers" : "Compliance Helper"}
              </span>
            </div>
            {isEditMode && (
              <button
                type="button"
                onClick={() => router.push("/results")}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                ← Back to results
              </button>
            )}
          </div>
          <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} stepTitles={STEP_TITLES} />
        </div>
      </header>

      {/* Step content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div key={`step-${step}-${direction}`} className="animate-in fade-in-0 slide-in-from-right-4 duration-200">
            {step === 1 && (
              <Step1Company data={draft.company} onChange={updateCompany} errors={errors} />
            )}
            {step === 2 && (
              <Step2Role data={draft.deployment} onChange={updateDeployment} errors={errors} />
            )}
            {step === 3 && (
              <Step3AIDescription data={draft.ai_system} onChange={updateAISystem} errors={errors} prefilled={aiDescriptionPrefilled} />
            )}
            {step === 4 && (
              <Step4Domain data={draft.deployment} onChange={updateDeployment} errors={errors} />
            )}
            {step === 5 && (
              <Step5Impact
                deployment={draft.deployment}
                riskFlags={draft.risk_flags}
                aiSystem={draft.ai_system}
                onDeploymentChange={updateDeployment}
                onRiskFlagsChange={updateRiskFlags}
                onAISystemChange={updateAISystem}
                errors={errors}
              />
            )}
            {step === 6 && (
              <Step6ProhibitedFlags data={draft.risk_flags} onChange={updateRiskFlags} errors={errors} />
            )}
            {step === 7 && (
              <Step7Geography
                riskFlags={draft.risk_flags}
                deploymentStage={deploymentStage}
                onRiskFlagsChange={updateRiskFlags}
                onDeploymentStageChange={setDeploymentStage}
                errors={errors}
              />
            )}
          </div>

          <StepNavigation
            onBack={handleBack}
            onNext={handleNext}
            isFirst={step === 1}
            isLast={step === TOTAL_STEPS}
          />
        </div>
      </main>
    </div>
  );
}
