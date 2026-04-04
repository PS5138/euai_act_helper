"use client";

import {
  Briefcase,
  Building2,
  Car,
  CreditCard,
  Fingerprint,
  Globe,
  GraduationCap,
  Heart,
  HelpCircle,
  Palette,
  Scale,
  Shield,
  Zap,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  ANNEX_III_DOMAINS,
  Domain,
  EUAIActAssessmentInput,
} from "../../types/assessment";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

type DeploymentData = Partial<EUAIActAssessmentInput["deployment"]>;

interface Props {
  data: DeploymentData;
  onChange: (update: DeploymentData) => void;
  errors: Record<string, string>;
}

const DOMAIN_OPTIONS: {
  value: Domain;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  contextNote?: string;
}[] = [
  {
    value: "biometrics_identity",
    label: "Biometrics & Identity",
    description: "Face recognition, fingerprinting, voice ID",
    icon: Fingerprint,
    contextNote:
      "Biometric identification systems are listed as high-risk in Annex III. Real-time biometric surveillance in public spaces may be prohibited.",
  },
  {
    value: "critical_infrastructure",
    label: "Critical Infrastructure",
    description: "Energy, water, transport, digital networks",
    icon: Zap,
    contextNote:
      "AI used in critical infrastructure safety components is high-risk under Annex III.",
  },
  {
    value: "education",
    label: "Education & Training",
    description: "Learning platforms, admissions, grading",
    icon: GraduationCap,
    contextNote:
      "AI that determines access to education or assesses students is high-risk under Annex III.",
  },
  {
    value: "employment",
    label: "Employment & HR",
    description: "Recruitment, performance, workforce management",
    icon: Briefcase,
    contextNote:
      "HR and recruitment AI is listed as high-risk in Annex III when used for hiring, promotion, or performance monitoring.",
  },
  {
    value: "essential_services",
    label: "Financial & Essential Services",
    description: "Credit, insurance, housing, benefits",
    icon: CreditCard,
    contextNote:
      "AI used for creditworthiness assessment or insurance pricing affecting individuals is high-risk under Annex III.",
  },
  {
    value: "healthcare",
    label: "Healthcare & Wellness",
    description: "Diagnostics, treatment, patient management",
    icon: Heart,
    contextNote:
      "Medical AI devices may fall under both the EU AI Act and the Medical Device Regulation.",
  },
  {
    value: "law_enforcement",
    label: "Law Enforcement",
    description: "Policing, crime prediction, evidence analysis",
    icon: Shield,
    contextNote:
      "Law enforcement AI is high-risk under Annex III. Predictive policing based on individual profiling may be prohibited.",
  },
  {
    value: "migration_asylum",
    label: "Migration & Immigration",
    description: "Border control, visa assessment, asylum",
    icon: Globe,
    contextNote:
      "AI used in migration management and asylum processing is high-risk under Annex III.",
  },
  {
    value: "justice_democracy",
    label: "Justice & Democracy",
    description: "Courts, electoral processes, legal decisions",
    icon: Scale,
    contextNote:
      "AI assisting judicial decisions or influencing elections is high-risk under Annex III.",
  },
  {
    value: "transportation",
    label: "Transportation",
    description: "Autonomous vehicles, traffic, logistics",
    icon: Car,
  },
  {
    value: "general_business",
    label: "Business Operations",
    description: "CRM, analytics, internal tooling, productivity",
    icon: Building2,
  },
  {
    value: "creative_entertainment",
    label: "Creative & Media",
    description: "Content creation, gaming, entertainment",
    icon: Palette,
  },
  {
    value: "other",
    label: "Other",
    description: "Doesn't fit the above categories",
    icon: HelpCircle,
  },
];

export default function Step4Domain({ data, onChange, errors }: Props) {
  const selectedDomain = DOMAIN_OPTIONS.find((d) => d.value === data.domain);
  const isHighRisk = data.domain
    ? ANNEX_III_DOMAINS.includes(data.domain)
    : false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          What domain does your AI operate in?
        </h2>
        <p className="mt-1 text-slate-500">
          The EU AI Act places different obligations depending on where AI is
          used.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {DOMAIN_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const annex = ANNEX_III_DOMAINS.includes(opt.value);
          const selected = data.domain === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ domain: opt.value })}
              className={cn(
                "border-2 rounded-lg p-3 text-left cursor-pointer transition-all relative",
                selected
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300 bg-white",
              )}
            >
              {annex && (
                <span className="absolute top-2 right-2 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                  High Risk
                </span>
              )}
              <Icon
                className={cn(
                  "h-5 w-5 mb-2",
                  selected ? "text-blue-600" : "text-slate-400",
                )}
              />
              <p
                className={cn(
                  "text-sm font-medium",
                  selected ? "text-blue-900" : "text-slate-800",
                )}
              >
                {opt.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-tight">
                {opt.description}
              </p>
            </button>
          );
        })}
      </div>
      {errors.domain && <p className="text-xs text-red-500">{errors.domain}</p>}

      {selectedDomain?.contextNote && (
        <div
          className={cn(
            "rounded-lg p-4 border text-sm",
            isHighRisk
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-blue-50 border-blue-200 text-blue-800",
          )}
        >
          <div className="flex items-start gap-2">
            <Badge
              className={cn(
                "text-xs flex-shrink-0 mt-0.5",
                isHighRisk
                  ? "bg-amber-100 text-amber-700 border-amber-300"
                  : "bg-blue-100 text-blue-700 border-blue-300",
              )}
              variant="outline"
            >
              {isHighRisk ? "Annex III" : "Note"}
            </Badge>
            <p>{selectedDomain.contextNote}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          Describe your specific use case within this domain{" "}
          <span className="text-slate-400 font-normal">(optional)</span>
        </Label>
        <Textarea
          placeholder="e.g. We analyse CV data to shortlist candidates for engineering roles at mid-sized tech companies..."
          value={data.domain_detail ?? ""}
          onChange={(e) => onChange({ domain_detail: e.target.value })}
          className="bg-white min-h-[80px] resize-none"
        />
      </div>
    </div>
  );
}
