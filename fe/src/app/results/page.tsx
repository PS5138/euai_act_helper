"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EUAIActAssessmentInput } from "@/types/assessment";
import ResultSummary from "@/components/results/ResultSummary";
import JsonOutput from "@/components/results/JsonOutput";
import { Button } from "@/components/ui/button";
import { RotateCcw, Pencil } from "lucide-react";

export default function ResultsPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<EUAIActAssessmentInput | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("euai_assessment");
    if (!stored) {
      router.replace("/assess");
      return;
    }
    try {
      setAssessment(JSON.parse(stored));
    } catch {
      router.replace("/assess");
    }
  }, [router]);

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              EU AI Act
            </span>
            <span className="text-sm text-slate-500">Assessment Results</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/assess")}
              className="gap-1.5 text-xs"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit answers
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                sessionStorage.removeItem("euai_assessment");
                router.push("/assess");
              }}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Start over
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Your EU AI Act Assessment
          </h1>
          <p className="text-slate-500 mt-1">
            Based on your answers for{" "}
            <span className="font-medium text-slate-700">{assessment.company.name}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left — human summary */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-6">
            <ResultSummary assessment={assessment} />
          </div>

          {/* Right — JSON output */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <JsonOutput assessment={assessment} />
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-3">
                Share this structured data with your compliance advisor or use it with the full risk assessment tool.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                Generate Full Risk Assessment
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
