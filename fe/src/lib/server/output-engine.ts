/**
 * EU AI Act Output Engine
 * TypeScript port of be/output_engine.py
 */

import Anthropic from "@anthropic-ai/sdk";
import { PROMPT_MAP, GPAI_TEMPLATE, ANNEX_III_TEXT } from "./prompts";

const WEB_SEARCH_TOOL = { type: "web_search_20250305", name: "web_search" } as const;
const MAX_PAUSE_TURN_RETRIES = 3;

const ROLE_GUIDANCE: Record<string, string> = {
  provider:
    "Treat them as the organisation that develops or places the AI system " +
    "or model on the market. Focus on provider obligations such as design " +
    "choices, documentation, conformity work, instructions for use, and " +
    "steps needed before release or supply.",
  deployer:
    "Treat them as the organisation using the AI system in practice. Focus " +
    "on deployment duties such as human oversight, operational controls, " +
    "monitoring, disclosures to affected people, and following provider " +
    "instructions. Do not assign every provider obligation to them.",
  both:
    "Treat them as both provider and deployer. Clearly separate the " +
    "obligations that arise because they build or supply the system from " +
    "the obligations that arise because they use it in practice.",
  importer:
    "Treat them as an importer bringing the AI system into the EU market. " +
    "Focus on importer checks before making the system available, such as " +
    "verifying the provider and required documentation or markings, not " +
    "supplying systems they know are non-compliant, cooperating on " +
    "corrective action, and explaining when importer conduct could trigger " +
    "provider-like responsibility.",
  distributor:
    "Treat them as a distributor making the AI system available further " +
    "down the supply chain. Focus on distributor checks before onward " +
    "supply, such as verifying required instructions or markings are " +
    "present, not supplying systems they know are non-compliant, " +
    "cooperating on corrective action, and explaining when distributor " +
    "conduct could trigger provider-like responsibility.",
};

export const TIER_CONFIG: Record<string, { label: string; colour: string; summary: string }> = {
  PROHIBITED: {
    label: "Prohibited",
    colour: "red",
    summary: "This AI practice is banned under Article 5 of the EU AI Act.",
  },
  HIGH_RISK: {
    label: "High-risk",
    colour: "orange",
    summary: "This system is subject to extensive compliance requirements.",
  },
  LIMITED: {
    label: "Limited risk",
    colour: "yellow",
    summary: "This system has transparency obligations under Article 50.",
  },
  MINIMAL: {
    label: "Minimal risk",
    colour: "green",
    summary: "No mandatory obligations. Voluntary best practices encouraged.",
  },
  EXCLUDED: {
    label: "Excluded",
    colour: "grey",
    summary: "This system appears to be outside the scope of the EU AI Act.",
  },
};

export const DISCLAIMER =
  "This analysis is for informational purposes only and does not constitute " +
  "legal advice. The EU AI Act is complex and its interpretation may vary " +
  "by jurisdiction and circumstance. Please consult qualified legal counsel " +
  "for compliance decisions.";

function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function buildRoleGuidance(role: string): string {
  return (
    ROLE_GUIDANCE[role] ??
    "Use the stated role carefully and only describe obligations that fit that role."
  );
}

function interpolate(template: string, vars: Record<string, string | boolean>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

function buildPrompt(result: Record<string, unknown>): string {
  const tier = result.tier as string;
  const template = PROMPT_MAP[tier];
  if (!template) throw new Error(`Unknown tier: ${tier}`);

  const featureFlags = Array.isArray(result.feature_flags)
    ? (result.feature_flags as string[]).join(", ") || "None"
    : "None";

  const vars: Record<string, string | boolean> = {
    org_name: String(result.org_name ?? "Unknown"),
    domain: String(result.domain ?? "Unknown"),
    description: String(result.description ?? "Not provided"),
    role: String(result.role ?? "Unknown"),
    autonomy: String(result.autonomy ?? "Unknown"),
    affected_group: String(result.affected_group ?? "Unknown"),
    feature_flags: featureFlags,
    is_public_body: Boolean(result.is_public_body),
    role_guidance: buildRoleGuidance(String(result.role ?? "")),
  };

  if (tier === "HIGH_RISK") {
    vars.annex_iii_text = ANNEX_III_TEXT;
  }

  return interpolate(template, vars);
}

function buildGpaiPrompt(result: Record<string, unknown>): string {
  const vars: Record<string, string | boolean> = {
    org_name: String(result.org_name ?? "Unknown"),
    role: String(result.role ?? "Unknown"),
    description: String(result.description ?? "Not provided"),
    role_guidance: buildRoleGuidance(String(result.role ?? "")),
  };
  return interpolate(GPAI_TEMPLATE, vars);
}

async function callClaude(prompt: string): Promise<string> {
  const client = new Anthropic();

  const enhancedPrompt =
    prompt +
    "\n\nIMPORTANT: Use your web search capability to look up the specific " +
    "articles and provisions of the EU AI Act (Regulation (EU) 2024/1689) " +
    "that apply to this system. Cite specific article numbers and their " +
    "actual text where relevant.";

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: enhancedPrompt },
  ];

  let message = await client.messages.create({
    model: "claude-sonnet-4-5-20251001",
    max_tokens: 8000,
    tools: [WEB_SEARCH_TOOL],
    messages,
  });

  for (let i = 0; i < MAX_PAUSE_TURN_RETRIES; i++) {
    if (message.stop_reason !== "pause_turn") break;

    messages.push({ role: "assistant", content: message.content });
    message = await client.messages.create({
      model: "claude-sonnet-4-5-20251001",
      max_tokens: 8000,
      tools: [WEB_SEARCH_TOOL],
      messages,
    });

    if (i === MAX_PAUSE_TURN_RETRIES - 1) {
      throw new Error(
        "Claude paused too many times while searching the web for legal sources."
      );
    }
  }

  const text = extractText(message);
  if (!text) {
    throw new Error("Claude returned no text content for the compliance report.");
  }
  return text;
}

export interface ClassificationRequest {
  org_name: string;
  domain: string;
  description: string;
  role: string;
  autonomy: string;
  affected_group: string;
  feature_flags: string[];
  is_public_body: boolean;
  is_gpai: boolean;
  tier: string;
}

export interface ComplianceReportData {
  tier: string;
  tier_config: { label: string; colour: string; summary: string };
  main_report: string;
  gpai_report: string | null;
  disclaimer: string;
  input_summary: Record<string, unknown>;
}

export async function generateReport(
  result: Record<string, unknown>
): Promise<ComplianceReportData> {
  const tier = result.tier as string;

  const mainPrompt = buildPrompt(result);
  const mainReport = await callClaude(mainPrompt);

  let gpaiReport: string | null = null;
  if (result.is_gpai) {
    const gpaiPrompt = buildGpaiPrompt(result);
    gpaiReport = await callClaude(gpaiPrompt);
  }

  return {
    tier,
    tier_config: TIER_CONFIG[tier],
    main_report: mainReport,
    gpai_report: gpaiReport,
    disclaimer: DISCLAIMER,
    input_summary: result,
  };
}
