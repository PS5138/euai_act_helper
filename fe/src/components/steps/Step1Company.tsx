"use client";

import { cn } from "../../lib/utils";
import { EUAIActAssessmentInput } from "../../types/assessment";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

type CompanyData = Partial<EUAIActAssessmentInput["company"]>;

interface Props {
  data: CompanyData;
  onChange: (update: CompanyData) => void;
  errors: Record<string, string>;
}

const SIZE_OPTIONS: {
  value: EUAIActAssessmentInput["company"]["employee_range"];
  label: string;
  sub: string;
}[] = [
  { value: "1-10", label: "1–10", sub: "Solo / micro" },
  { value: "11-50", label: "11–50", sub: "Startup" },
  { value: "51-250", label: "51–250", sub: "Scale-up" },
  { value: "251-1000", label: "251–1,000", sub: "Mid-size" },
  { value: "1000+", label: "1,000+", sub: "Enterprise" },
];

export default function Step1Company({ data, onChange, errors }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Tell us about your company
        </h2>
        <p className="mt-1 text-slate-500">
          We'll use this to tailor your EU AI Act assessment.
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="company-name"
          className="text-sm font-medium text-slate-700"
        >
          Company name
        </Label>
        <Input
          id="company-name"
          placeholder="e.g. Acme AI Ltd"
          value={data.name ?? ""}
          onChange={(e) => onChange({ name: e.target.value })}
          className={cn("bg-white", errors.name && "border-red-400")}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="company-description"
          className="text-sm font-medium text-slate-700"
        >
          What does your company do?
        </Label>
        <p className="text-xs text-slate-500">
          Describe in 1–3 sentences. No jargon needed.
        </p>
        <div className="relative">
          <Textarea
            id="company-description"
            placeholder="e.g. We build software that helps hospitals automate patient triage using AI-driven priority scoring."
            value={data.description ?? ""}
            onChange={(e) =>
              onChange({ description: e.target.value.slice(0, 400) })
            }
            className={cn(
              "bg-white min-h-[100px] resize-none",
              errors.description && "border-red-400",
            )}
          />
          <span className="absolute bottom-2 right-3 text-xs text-slate-400">
            {(data.description ?? "").length}/400
          </span>
        </div>
        {errors.description && (
          <p className="text-xs text-red-500">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          Company size
        </Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ employee_range: opt.value })}
              className={cn(
                "border-2 rounded-lg p-3 text-center cursor-pointer transition-all",
                data.employee_range === opt.value
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300 bg-white",
              )}
            >
              <p className="font-semibold text-slate-900 text-sm">
                {opt.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
            </button>
          ))}
        </div>
        {errors.employee_range && (
          <p className="text-xs text-red-500">{errors.employee_range}</p>
        )}
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <Checkbox
          checked={data.is_public_body ?? false}
          onCheckedChange={(checked) => onChange({ is_public_body: checked === true })}
        />
        <span className="text-sm text-slate-700">
          We are a public body (government agency, regulator, law enforcement, or publicly-funded institution)
        </span>
      </label>
    </div>
  );
}
