"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, CheckCircle, Sparkles } from "lucide-react";
import { EUAIActAssessmentInput, ANNEX_III_DOMAINS } from "@/types/assessment";

interface Props {
  assessment: EUAIActAssessmentInput;
}

type ClassificationLevel = "prohibited" | "high_risk" | "gpai" | "limited_risk" | "minimal_risk";

function getClassification(assessment: EUAIActAssessmentInput): ClassificationLevel {
  const c = assessment.preliminary_classification;
  if (c.likely_prohibited) return "prohibited";
  if (c.likely_high_risk) return "high_risk";
  if (c.likely_gpai) return "gpai";
  if (c.likely_limited_risk) return "limited_risk";
  return "minimal_risk";
}

const CLASSIFICATION_CONFIG: Record<
  ClassificationLevel,
  {
    label: string;
    badgeClass: string;
    iconClass: string;
    icon: React.ComponentType<{ className?: string }>;
    headline: string;
    nextSteps: string[];
  }
> = {
  prohibited: {
    label: "Potentially Prohibited",
    badgeClass: "bg-red-100 text-red-700 border-red-300",
    iconClass: "text-red-500",
    icon: AlertCircle,
    headline: "One or more aspects of your AI system may fall under prohibited uses in the EU AI Act.",
    nextSteps: [
      "Seek specialist legal advice before proceeding — prohibited AI carries significant penalties.",
      "Review Article 5 of the EU AI Act in detail with your legal team.",
      "Consider whether your use case can be redesigned to avoid prohibited elements.",
    ],
  },
  high_risk: {
    label: "Likely High Risk",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-300",
    iconClass: "text-amber-500",
    icon: AlertTriangle,
    headline: "Your AI system likely falls into a high-risk category under Annex III of the EU AI Act.",
    nextSteps: [
      "Register your system in the EU AI Act database before market placement.",
      "Conduct a conformity assessment and maintain technical documentation.",
      "Implement human oversight mechanisms and establish a risk management system.",
    ],
  },
  gpai: {
    label: "General Purpose AI",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-300",
    iconClass: "text-purple-500",
    icon: Sparkles,
    headline: "Your system is a general-purpose AI model with specific obligations under the EU AI Act.",
    nextSteps: [
      "Prepare and maintain technical documentation for your GPAI model.",
      "Implement a copyright policy and publish a summary of training data.",
      "If the model is systemic risk (>10²⁵ FLOPs training compute), additional obligations apply.",
    ],
  },
  limited_risk: {
    label: "Limited Risk",
    badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-300",
    iconClass: "text-yellow-500",
    icon: Info,
    headline: "Your AI system has transparency obligations under the EU AI Act.",
    nextSteps: [
      "Ensure users are informed when they are interacting with an AI (e.g. chatbots).",
      "Label AI-generated content (images, audio, video, text) as artificially generated.",
      "Maintain basic documentation of your AI system's capabilities and limitations.",
    ],
  },
  minimal_risk: {
    label: "Minimal Risk",
    badgeClass: "bg-green-100 text-green-700 border-green-300",
    iconClass: "text-green-500",
    icon: CheckCircle,
    headline: "Your AI system appears to fall into the minimal risk category.",
    nextSteps: [
      "No mandatory obligations under the EU AI Act, but voluntary codes of conduct are encouraged.",
      "Keep basic documentation in case your system's use expands into higher-risk areas.",
      "Monitor for updates — the EU AI Act is being actively implemented through 2027.",
    ],
  },
};

function generateBulletPoints(assessment: EUAIActAssessmentInput): string[] {
  const points: string[] = [];
  const { deployment, ai_system, risk_flags, company } = assessment;

  if (deployment.domain && ANNEX_III_DOMAINS.includes(deployment.domain)) {
    points.push(
      `Your domain (${deployment.domain.replace(/_/g, " ")}) is listed in Annex III as high-risk.`
    );
  }

  if (risk_flags.geography.includes("no_eu_exposure")) {
    points.push("You indicated no EU exposure — the EU AI Act may not apply to your system.");
  } else if (risk_flags.geography.length > 0) {
    points.push("Your system has EU exposure, so the EU AI Act is likely to apply.");
  }

  if (ai_system.human_oversight === "full") {
    points.push("Full human oversight is a positive compliance factor.");
  } else if (ai_system.human_oversight === "none") {
    points.push("Fully automated decision-making increases regulatory scrutiny.");
  }

  if (risk_flags.vulnerable_populations) {
    points.push("Involvement of vulnerable populations (children, elderly) increases obligations.");
  }

  if (deployment.role === "deployer" || deployment.role === "both") {
    points.push(
      "As a deployer of third-party AI, you have obligations around transparency and monitoring."
    );
  }

  if (risk_flags.prohibited_flags.length > 0) {
    points.push(
      `Flags raised for: ${risk_flags.prohibited_flags.map((f) => f.replace(/_/g, " ")).join(", ")}.`
    );
  }

  if (company.employee_range === "1-10" || company.employee_range === "11-50") {
    points.push("As a small company, some obligations may be lighter — but core rules still apply.");
  }

  return points.slice(0, 5);
}

export default function ResultSummary({ assessment }: Props) {
  const level = getClassification(assessment);
  const config = CLASSIFICATION_CONFIG[level];
  const Icon = config.icon;
  const bullets = generateBulletPoints(assessment);

  return (
    <div className="space-y-6">
      {/* Classification badge */}
      <div className="flex items-center gap-3">
        <Icon className={`h-6 w-6 ${config.iconClass}`} />
        <Badge className={`text-sm px-3 py-1 border ${config.badgeClass}`} variant="outline">
          {config.label}
        </Badge>
        <span className="text-xs text-slate-400">
          Confidence: {assessment.preliminary_classification.confidence}
        </span>
      </div>

      <p className="text-slate-700 leading-relaxed">{config.headline}</p>

      {/* Key findings */}
      {bullets.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Key findings</p>
          <ul className="space-y-2">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
        <p className="text-sm font-medium text-slate-700">Recommended next steps</p>
        <ol className="space-y-2">
          {config.nextSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <p className="text-xs text-slate-400">
        This assessment is indicative only and does not constitute legal advice. The EU AI Act is complex — consult a qualified legal professional for binding guidance.
      </p>
    </div>
  );
}
