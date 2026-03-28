"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Globe, Loader2, AlertCircle } from "lucide-react";
import { buildFinalAssessment } from "@/lib/classify";
import { AssessmentDraft } from "@/types/assessment";

const EMPTY_DRAFT: AssessmentDraft = {
  company: {},
  ai_system: {},
  deployment: {},
  risk_flags: {
    prohibited_flags: [],
    high_risk_indicators: [],
    geography: [],
    consequential_decisions: false,
    vulnerable_populations: false,
    transparency_obligations: false,
  },
};

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyse(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/prefill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try filling in the form manually.");
        setLoading(false);
        return;
      }

      // Merge the LLM-returned prefill data over empty defaults
      const draft: AssessmentDraft = {
        company: { ...EMPTY_DRAFT.company, ...(data.company ?? {}) },
        ai_system: { ...EMPTY_DRAFT.ai_system, ...(data.ai_system ?? {}) },
        deployment: { ...EMPTY_DRAFT.deployment, ...(data.deployment ?? {}) },
        risk_flags: { ...EMPTY_DRAFT.risk_flags, ...(data.risk_flags ?? {}) },
      };

      // Build the full assessment (adds preliminary_classification)
      const assessment = buildFinalAssessment(draft);

      // Store for both results page and wizard edit mode
      sessionStorage.setItem("euai_assessment", JSON.stringify(assessment));
      sessionStorage.setItem(
        "euai_prefill_meta",
        JSON.stringify({ source_summary: data.source_summary ?? "" })
      );

      router.push("/results");
    } catch {
      setError("Could not reach the analysis service. Try filling in the form manually.");
      setLoading(false);
    }
  }

  function handleManual() {
    sessionStorage.removeItem("euai_assessment");
    sessionStorage.removeItem("euai_prefill_meta");
    router.push("/assess");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xl text-center space-y-8">

        {/* Badge */}
        <div className="flex justify-center">
          <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
            EU AI Act Compliance Helper
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            Know your EU AI Act<br />obligations in minutes
          </h1>
          <p className="text-lg text-slate-500">
            Enter your company website and we'll analyse your AI Act obligations automatically.
          </p>
        </div>

        {/* URL input */}
        <form onSubmit={handleAnalyse} className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="yourcompany.com"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(""); }}
                className="pl-9 bg-white h-11 text-base"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-5 gap-2 shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analysing…
                </>
              ) : (
                <>
                  Analyse
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {loading && (
            <p className="text-sm text-slate-500 text-left">
              Researching your company with AI — this takes about 15 seconds…
            </p>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-left">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </form>

        {/* Manual fallback */}
        <button
          type="button"
          onClick={handleManual}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          or fill in the form manually →
        </button>

        {/* Trust note */}
        <p className="text-xs text-slate-400">
          We use AI web search to research your company. No data is stored.
        </p>
      </div>
    </div>
  );
}
