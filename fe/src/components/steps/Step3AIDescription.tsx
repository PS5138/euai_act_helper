"use client";

import { Info, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { detectCapabilities } from "../../lib/detect";
import { cn } from "../../lib/utils";
import { AICapability, EUAIActAssessmentInput } from "../../types/assessment";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type AISystemData = Partial<EUAIActAssessmentInput["ai_system"]>;

interface Props {
  data: AISystemData;
  onChange: (update: AISystemData) => void;
  errors: Record<string, string>;
  prefilled?: boolean;
}

const CAPABILITY_OPTIONS: { value: AICapability; label: string }[] = [
  { value: "natural_language_generation", label: "Generates text or code" },
  { value: "image_video_generation", label: "Creates images, video or audio" },
  { value: "decision_making", label: "Makes or suggests decisions" },
  { value: "scoring_ranking", label: "Scores, ranks or rates" },
  {
    value: "biometric_recognition",
    label: "Recognises faces, voices or identities",
  },
  { value: "emotion_detection", label: "Detects emotions or mental states" },
  { value: "classification", label: "Classifies or categorises" },
  { value: "recommendation", label: "Recommends content or products" },
  { value: "prediction", label: "Predicts future outcomes" },
  { value: "translation", label: "Translates languages" },
];

export default function Step3AIDescription({
  data,
  onChange,
  errors,
  prefilled,
}: Props) {
  const capabilities = data.capabilities ?? [];

  // Re-run auto-tagging whenever description changes — merge with manually selected
  // biome-ignore lint/correctness/useExhaustiveDependencies: ok
  useEffect(() => {
    if (!data.description) return;
    const detected = detectCapabilities(data.description);
    const merged = Array.from(
      new Set([...(data.capabilities ?? []), ...detected]),
    );
    if (merged.length !== (data.capabilities ?? []).length) {
      onChange({ capabilities: merged });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.description, data.capabilities]);

  function toggleCapability(cap: AICapability) {
    const next = capabilities.includes(cap)
      ? capabilities.filter((c) => c !== cap)
      : [...capabilities, cap];
    onChange({ capabilities: next });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Describe your AI system
        </h2>
        <p className="mt-1 text-slate-500">
          Tell us about the AI product or feature you want assessed.
        </p>
      </div>

      {prefilled && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            Pre-filled from your company description — edit or expand as needed.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          AI system name{" "}
          <span className="text-slate-400 font-normal">(optional)</span>
        </Label>
        <Input
          placeholder="e.g. RecruitBot, Triage AI, SmartLens..."
          value={data.name ?? ""}
          onChange={(e) => onChange({ name: e.target.value })}
          className="bg-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          What does this AI system do?
        </Label>
        <p className="text-xs text-slate-500">
          Describe it plainly — what problem does it solve and how?
        </p>
        <div className="relative">
          <Textarea
            placeholder="e.g. Scans CVs to rank job candidates for open roles and suggests an interview shortlist to the hiring manager."
            value={data.description ?? ""}
            onChange={(e) =>
              onChange({ description: e.target.value.slice(0, 600) })
            }
            className={cn(
              "bg-white min-h-[110px] resize-none",
              errors.description && "border-red-400",
            )}
          />
          <span className="absolute bottom-2 right-3 text-xs text-slate-400">
            {(data.description ?? "").length}/600
          </span>
        </div>
        {errors.description && (
          <p className="text-xs text-red-500">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium text-slate-700">
            What can it do?
          </Label>
          <span className="text-xs text-slate-400">
            Auto-suggested from your description — tap to adjust
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CAPABILITY_OPTIONS.map((opt) => {
            const selected = capabilities.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleCapability(opt.value)}
                className={cn(
                  "text-sm px-3 py-1.5 rounded-full border transition-all",
                  selected
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                {selected ? "✓ " : ""}
                {opt.label}
              </button>
            );
          })}
        </div>
        {errors.capabilities && (
          <p className="text-xs text-red-500">{errors.capabilities}</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium text-slate-700">
            Is this a general-purpose AI model (GPAI)?
          </Label>
          <Tooltip>
            <TooltipTrigger className="text-slate-400 hover:text-slate-600">
              <Info className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-xs">
                A GPAI model can perform many different tasks and is made
                available to others to build on — like GPT-4, Claude, Llama, or
                Stable Diffusion. If you're building the foundation model itself
                (not just using one), answer Yes.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex gap-3">
          {[
            { value: true, label: "Yes" },
            { value: false, label: "No" },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange({ is_gpai: opt.value })}
              className={cn(
                "border-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all",
                data.is_gpai === opt.value
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {data.is_gpai && (
          <div className="space-y-2 pt-2">
            <Label className="text-sm font-medium text-slate-700">
              What are the likely downstream uses?{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              placeholder="e.g. Customer service chatbots, document summarisation, code generation..."
              value={data.gpai_downstream_uses ?? ""}
              onChange={(e) =>
                onChange({ gpai_downstream_uses: e.target.value })
              }
              className="bg-white min-h-[80px] resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
