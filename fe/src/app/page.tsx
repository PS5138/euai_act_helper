"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Globe, Loader2, AlertCircle } from "lucide-react";
import { extractDraftFromScrape } from "@/lib/extract";
import { AssessmentDraft } from "@/types/assessment";

const INITIAL_DRAFT: AssessmentDraft = {
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
        setError(data.error ?? "Something went wrong fetching that URL.");
        setLoading(false);
        return;
      }

      const { draft, confidence } = extractDraftFromScrape(data);

      // Merge extracted draft over initial empty draft
      const merged: AssessmentDraft = {
        company: { ...INITIAL_DRAFT.company, ...draft.company },
        ai_system: { ...INITIAL_DRAFT.ai_system, ...draft.ai_system },
        deployment: { ...INITIAL_DRAFT.deployment, ...draft.deployment },
        risk_flags: { ...INITIAL_DRAFT.risk_flags, ...draft.risk_flags },
      };

      sessionStorage.setItem("euai_prefill", JSON.stringify({ draft: merged, confidence, prefilled: true }));
      router.push("/assess");
    } catch {
      setError("Could not reach that URL. Try filling in the form manually.");
      setLoading(false);
    }
  }

  function handleManual() {
    sessionStorage.removeItem("euai_prefill");
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
            Enter your company website and we'll pre-fill your assessment automatically — then you review and confirm.
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
                  Fetching…
                </>
              ) : (
                <>
                  Analyse
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

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
          We only fetch your public homepage. No data is stored.
        </p>
      </div>
    </div>
  );
}
