"use client";

import { cn } from "@/lib/utils";
import { Info, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EUAIActAssessmentInput, ProhibitedFlag } from "@/types/assessment";

type RiskFlagData = Partial<EUAIActAssessmentInput["risk_flags"]>;

interface Props {
  data: RiskFlagData;
  onChange: (update: RiskFlagData) => void;
  errors: Record<string, string>;
}

type Answer = "yes" | "no" | "unsure" | null;

const FLAGS: {
  key: ProhibitedFlag;
  question: string;
  article: string;
  tooltip: string;
}[] = [
  {
    key: "social_scoring",
    question:
      "Does your AI assign scores or classifications to people based on their social behaviour, personal characteristics, or socioeconomic status — for purposes unrelated to why the data was originally collected?",
    article: "Article 5(1)(c)",
    tooltip:
      "This relates to 'social scoring' by public authorities or private entities, which is prohibited. For example, scoring citizens on trustworthiness to deny them services.",
  },
  {
    key: "realtime_biometric_surveillance",
    question:
      "Does your AI use real-time remote biometric identification (e.g. facial recognition) in publicly accessible spaces?",
    article: "Article 5(1)(d)",
    tooltip:
      "Real-time biometric identification in public is prohibited with very narrow exceptions for law enforcement in specific serious crime scenarios.",
  },
  {
    key: "emotion_recognition_workplace_education",
    question:
      "Does your AI detect or infer emotions of people in workplace or educational settings?",
    article: "Article 5(1)(f)",
    tooltip:
      "Emotion recognition systems in workplaces and schools are prohibited, with narrow exceptions for medical or safety purposes.",
  },
  {
    key: "subliminal_manipulation",
    question:
      "Does your AI use techniques that operate below a person's awareness to manipulate their behaviour in ways that could harm them?",
    article: "Article 5(1)(a)",
    tooltip:
      "Subliminal manipulation — influencing people without their awareness in harmful ways — is prohibited regardless of who deploys it.",
  },
  {
    key: "predictive_policing_individual",
    question:
      "Does your AI make individual-level predictions about whether a specific person will commit a crime, based on profiling or personality traits?",
    article: "Article 5(1)(d)",
    tooltip:
      "Predictive policing based on profiling individuals (rather than analysing objective facts) is prohibited.",
  },
];

export default function Step6ProhibitedFlags({ data, onChange, errors }: Props) {
  const prohibitedFlags = data.prohibited_flags ?? [];

  // Track per-question answers (yes/no/unsure) locally via flags list
  function getAnswer(key: ProhibitedFlag): Answer {
    if (prohibitedFlags.includes(key)) return "yes";
    // We store "no" and "unsure" implicitly — absence = unanswered or no
    return null;
  }

  function setAnswer(key: ProhibitedFlag, answer: "yes" | "no" | "unsure") {
    let next: ProhibitedFlag[];
    if (answer === "yes") {
      next = prohibitedFlags.includes(key) ? prohibitedFlags : [...prohibitedFlags, key];
    } else {
      next = prohibitedFlags.filter((f) => f !== key);
    }
    onChange({ prohibited_flags: next });
  }

  const hasYes = prohibitedFlags.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">A few more questions</h2>
        <p className="mt-1 text-slate-500">
          These help us give you a complete picture of your position under the EU AI Act.
        </p>
      </div>

      {hasYes && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Heads up</p>
            <p className="text-sm text-amber-700 mt-0.5">
              One or more of your answers may indicate AI use that is potentially prohibited under the EU AI Act. This will be flagged in your full assessment — we recommend seeking legal advice.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {FLAGS.map((flag) => {
          const answer = getAnswer(flag.key);
          return (
            <div
              key={flag.key}
              className="border border-slate-200 rounded-lg p-4 bg-white space-y-3"
            >
              <div className="flex items-start gap-2">
                <p className="text-sm text-slate-800 flex-1">{flag.question}</p>
                <Tooltip>
                  <TooltipTrigger className="text-slate-400 hover:text-slate-600 flex-shrink-0 mt-0.5">
                    <Info className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-xs font-medium mb-1 text-blue-300">{flag.article}</p>
                    <p className="text-xs">{flag.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex gap-2">
                {(["yes", "no", "unsure"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswer(flag.key, opt)}
                    className={cn(
                      "text-sm px-4 py-1.5 rounded-full border transition-all",
                      answer === opt
                        ? opt === "yes"
                          ? "border-amber-500 bg-amber-50 text-amber-700 font-medium"
                          : "border-blue-600 bg-blue-50 text-blue-700 font-medium"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                  >
                    {opt === "yes" ? "Yes" : opt === "no" ? "No" : "Not sure"}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
