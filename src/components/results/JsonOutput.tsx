"use client";

import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EUAIActAssessmentInput } from "@/types/assessment";

interface Props {
  assessment: EUAIActAssessmentInput;
}

export default function JsonOutput({ assessment }: Props) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(assessment, null, 2);

  function handleCopy() {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `euai-assessment-${assessment.company.name.toLowerCase().replace(/\s+/g, "-") || "unknown"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Structured assessment data</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </div>
      <div className="bg-slate-900 rounded-lg overflow-auto max-h-[400px]">
        <pre className="text-xs text-slate-300 p-4 leading-relaxed">{json}</pre>
      </div>
    </div>
  );
}
