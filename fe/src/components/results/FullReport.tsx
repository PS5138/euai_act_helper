"use client";

import ReactMarkdown from "react-markdown";

interface TierConfig {
  label: string;
  colour: string;
  summary: string;
}

export interface ComplianceReport {
  tier: string;
  tier_config: TierConfig;
  main_report: string;
  gpai_report: string | null;
  disclaimer: string;
  input_summary: Record<string, unknown>;
}

const TIER_BADGE_CLASS: Record<string, string> = {
  PROHIBITED: "bg-red-100 text-red-700 border-red-300",
  HIGH_RISK: "bg-amber-100 text-amber-700 border-amber-300",
  LIMITED: "bg-yellow-100 text-yellow-700 border-yellow-300",
  MINIMAL: "bg-green-100 text-green-700 border-green-300",
  EXCLUDED: "bg-slate-100 text-slate-700 border-slate-300",
};

interface Props {
  report: ComplianceReport;
}

export default function FullReport({ report }: Props) {
  const badgeClass =
    TIER_BADGE_CLASS[report.tier] ?? "bg-slate-100 text-slate-700 border-slate-300";

  return (
    <div className="space-y-5">
      {/* Tier badge + summary */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
            {report.tier_config.label}
          </span>
          <span className="text-xs text-slate-400">Full assessment</span>
        </div>
        <p className="text-sm text-slate-600">{report.tier_config.summary}</p>
      </div>

      {/* Main report */}
      <div className="prose-report text-sm text-slate-700 leading-relaxed space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-lg font-bold text-slate-900 mt-4 mb-1">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-semibold text-slate-900 mt-4 mb-1">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-slate-800 mt-3 mb-1">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-sm text-slate-700 mb-2">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-1 mb-2 ml-2">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-1 mb-2 ml-2">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-sm text-slate-700">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-slate-900">{children}</strong>
            ),
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {children}
              </a>
            ),
          }}
        >
          {report.main_report}
        </ReactMarkdown>
      </div>

      {/* GPAI add-on */}
      {report.gpai_report && (
        <div className="border-t border-slate-200 pt-4 space-y-2">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
            General-Purpose AI obligations
          </p>
          <div className="text-sm text-slate-700 leading-relaxed max-h-[30vh] overflow-y-auto pr-1">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-sm font-semibold text-slate-900 mt-3 mb-1">{children}</h2>
                ),
                p: ({ children }) => <p className="mb-2">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 ml-2">{children}</ul>,
                li: ({ children }) => <li>{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              }}
            >
              {report.gpai_report}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
        {report.disclaimer}
      </p>
    </div>
  );
}
