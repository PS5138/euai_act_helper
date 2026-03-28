"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

interface StepNavigationProps {
  onBack: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function StepNavigation({
  onBack,
  onNext,
  isFirst,
  isLast,
}: StepNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200">
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        disabled={isFirst}
        className="gap-2 text-slate-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <Button
        type="button"
        onClick={onNext}
        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6"
      >
        {isLast ? (
          <>
            <CheckCircle className="h-4 w-4" />
            View my assessment
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
