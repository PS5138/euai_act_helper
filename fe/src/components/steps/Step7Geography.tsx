"use client";

import { cn } from "../../lib/utils";
import {
  DeploymentStage,
  EUAIActAssessmentInput,
  GeographyFlag,
} from "../../types/assessment";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

type RiskFlagData = Partial<EUAIActAssessmentInput["risk_flags"]>;

interface Props {
  riskFlags: RiskFlagData;
  deploymentStage: DeploymentStage | undefined;
  onRiskFlagsChange: (update: RiskFlagData) => void;
  onDeploymentStageChange: (stage: DeploymentStage) => void;
  errors: Record<string, string>;
}

const GEOGRAPHY_OPTIONS: {
  value: GeographyFlag;
  label: string;
  sub: string;
}[] = [
  {
    value: "targets_eu_users",
    label: "We target users or customers in the EU",
    sub: "Our product or service is marketed to EU residents",
  },
  {
    value: "processes_eu_data",
    label: "Our AI processes personal data of EU residents",
    sub: "Even if we're not based in the EU",
  },
  {
    value: "incorporated_in_eu",
    label: "We are incorporated or have offices in the EU",
    sub: "Our company has a legal presence in an EU member state",
  },
  {
    value: "outputs_felt_in_eu",
    label: "Our AI's outputs are used or felt within the EU",
    sub: "e.g. decisions made by our AI affect EU citizens",
  },
  {
    value: "no_eu_exposure",
    label: "None of the above — we have no EU exposure",
    sub: "Our AI operates entirely outside the EU",
  },
];

const STAGE_OPTIONS: { value: DeploymentStage; label: string; sub: string }[] =
  [
    {
      value: "concept",
      label: "Concept / planning",
      sub: "Not yet in development",
    },
    {
      value: "in_development",
      label: "In development",
      sub: "Being built, not yet deployed",
    },
    {
      value: "deployed_internally",
      label: "Deployed internally",
      sub: "Used within our company only",
    },
    {
      value: "deployed_to_customers",
      label: "Deployed to customers",
      sub: "Live with real users",
    },
    {
      value: "scaled",
      label: "Scaled / widely deployed",
      sub: "Large-scale production use",
    },
  ];

export default function Step7Geography({
  riskFlags,
  deploymentStage,
  onRiskFlagsChange,
  onDeploymentStageChange,
  errors,
}: Props) {
  const geography = riskFlags.geography ?? [];

  function toggleGeography(flag: GeographyFlag) {
    if (flag === "no_eu_exposure") {
      // Exclusive — deselects all others
      const alreadySelected = geography.includes("no_eu_exposure");
      onRiskFlagsChange({
        geography: alreadySelected ? [] : ["no_eu_exposure"],
      });
      return;
    }
    // Deselect "no_eu_exposure" when selecting anything else
    const withoutNone = geography.filter((g) => g !== "no_eu_exposure");
    const next = withoutNone.includes(flag)
      ? withoutNone.filter((g) => g !== flag)
      : [...withoutNone, flag];
    onRiskFlagsChange({ geography: next });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Almost done!</h2>
        <p className="mt-1 text-slate-500">
          Just a couple of questions about where you operate.
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">
          Where do you operate or plan to operate?{" "}
          <span className="text-slate-400 font-normal">
            (select all that apply)
          </span>
        </Label>
        <div className="space-y-2">
          {GEOGRAPHY_OPTIONS.map((opt) => {
            const selected = geography.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  selected
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 bg-white",
                )}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => toggleGeography(opt.value)}
                  className="mt-0.5 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {opt.label}
                  </p>
                  <p className="text-xs text-slate-500">{opt.sub}</p>
                </div>
              </label>
            );
          })}
        </div>
        {errors.geography && (
          <p className="text-xs text-red-500">{errors.geography}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">
          What stage is your AI system at?
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onDeploymentStageChange(opt.value)}
              className={cn(
                "border-2 rounded-lg p-3 text-left cursor-pointer transition-all",
                deploymentStage === opt.value
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300 bg-white",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0",
                    deploymentStage === opt.value
                      ? "border-blue-600 bg-blue-600"
                      : "border-slate-300",
                  )}
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {opt.label}
                  </p>
                  <p className="text-xs text-slate-500">{opt.sub}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
