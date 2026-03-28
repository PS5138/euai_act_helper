"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EUAIActAssessmentInput, Role } from "@/types/assessment";

type DeploymentData = Partial<EUAIActAssessmentInput["deployment"]>;

interface Props {
  data: DeploymentData;
  onChange: (update: DeploymentData) => void;
  errors: Record<string, string>;
}

const ROLE_OPTIONS: { value: Role; label: string; sub: string; example: string }[] = [
  {
    value: "provider",
    label: "We build AI",
    sub: "Provider",
    example: "We train, fine-tune, or develop our own AI models or AI-powered products.",
  },
  {
    value: "deployer",
    label: "We use AI tools",
    sub: "Deployer",
    example: "We integrate third-party AI (OpenAI, Azure AI, Google Gemini, etc.) into our products or workflows.",
  },
  {
    value: "both",
    label: "Both",
    sub: "Provider & Deployer",
    example: "We build some AI capabilities and also integrate external AI services.",
  },
  {
    value: "unsure",
    label: "Not sure",
    sub: "Help me decide",
    example: "I'm not certain which category applies to us.",
  },
];

export default function Step2Role({ data, onChange, errors }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-slate-900">What's your role with AI?</h2>
          <Tooltip>
            <TooltipTrigger className="text-slate-400 hover:text-slate-600">
              <Info className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-sm font-medium mb-1">Provider vs Deployer</p>
              <p className="text-xs text-slate-300">
                <strong>Provider:</strong> Spotify building their own recommendation model.<br />
                <strong>Deployer:</strong> Spotify using a third-party recommendation engine via API.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                This distinction matters under the EU AI Act — providers and deployers have different obligations.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="mt-1 text-slate-500">
          This affects which EU AI Act obligations apply to you.
        </p>
      </div>

      <div className="space-y-3">
        {ROLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ role: opt.value })}
            className={cn(
              "w-full border-2 rounded-lg p-4 text-left cursor-pointer transition-all",
              data.role === opt.value
                ? "border-blue-600 bg-blue-50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0",
                  data.role === opt.value
                    ? "border-blue-600 bg-blue-600"
                    : "border-slate-300"
                )}
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{opt.label}</p>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {opt.sub}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{opt.example}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}

      {(data.role === "deployer" || data.role === "both") && (
        <div className="space-y-2 pt-2">
          <Label className="text-sm font-medium text-slate-700">
            Which AI tools or vendors do you use?{" "}
            <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <Textarea
            placeholder="e.g. OpenAI GPT-4, Google Vertex AI, Azure Cognitive Services..."
            value={data.third_party_ai ?? ""}
            onChange={(e) => onChange({ third_party_ai: e.target.value })}
            className="bg-white min-h-[80px] resize-none"
          />
        </div>
      )}
    </div>
  );
}
