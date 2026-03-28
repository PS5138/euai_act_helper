"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EUAIActAssessmentInput } from "@/types/assessment";
import { mapAssessmentToRequest } from "@/lib/mapToBackend";
import ResultSummary from "@/components/results/ResultSummary";
import JsonOutput from "@/components/results/JsonOutput";
import FullReport, { ComplianceReport } from "@/components/results/FullReport";
import { Button } from "@/components/ui/button";
import { RotateCcw, Pencil, Sparkles, Loader2, AlertCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ReportState = "idle" | "loading" | "done" | "error";

export default function ResultsPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<EUAIActAssessmentInput | null>(null);
  const [reportState, setReportState] = useState<ReportState>("idle");
  const [fullReport, setFullReport] = useState<ComplianceReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

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

  async function generateFullReport() {
    if (!assessment) return;
    setReportState("loading");
    setReportError(null);

    try {
      const body = mapAssessmentToRequest(assessment);
      const res = await fetch(`${API_URL}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Server error ${res.status}: ${detail}`);
      }

      const data: ComplianceReport = await res.json();
      setFullReport(data);
      setReportState("done");
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Unknown error");
      setReportState("error");
    }
  }

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
          {/* Left — client-side summary (always visible) */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-6">
            <ResultSummary assessment={assessment} />
          </div>

          {/* Right — JSON or full report */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            {reportState === "idle" && (
              <>
                <JsonOutput assessment={assessment} />
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-3">
                    Get a full analysis from Claude — specific obligations, article references, and actionable next steps.
                  </p>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    size="sm"
                    onClick={generateFullReport}
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Full Risk Assessment
                  </Button>
                </div>
              </>
            )}

            {reportState === "loading" && (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                <div>
                  <p className="font-medium text-slate-800">Analysing with Claude…</p>
                  <p className="text-sm text-slate-500 mt-1">
                    This takes about 30 seconds. Claude is researching the specific EU AI Act articles that apply to your system.
                  </p>
                </div>
              </div>
            )}

            {reportState === "done" && fullReport && (
              <FullReport report={fullReport} />
            )}

            {reportState === "error" && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <div>
                  <p className="font-medium text-slate-800">Something went wrong</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">{reportError}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateFullReport}
                >
                  Try again
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
