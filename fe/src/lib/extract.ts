import { AssessmentDraft, GeographyFlag } from "@/types/assessment";
import { detectCapabilities, detectDomain } from "./detect";

interface ScrapedData {
  title: string;
  siteName: string;
  ogTitle: string;
  description: string;
  bodyText: string;
  url: string;
}

// ─── Company name ─────────────────────────────────────────────────────────────

function extractCompanyName(data: ScrapedData): string {
  // Prefer og:site_name, then strip " | ..." suffixes from title
  if (data.siteName) return data.siteName;
  const name = data.ogTitle || data.title;
  // Strip common suffixes: "Acme - Home", "Acme | AI Platform"
  return name.replace(/\s*[|\-–—]\s*.+$/, "").trim();
}

// ─── End users (B2B vs B2C) ───────────────────────────────────────────────────

const B2B_SIGNALS = [
  "enterprise", "for teams", "for businesses", "for companies", "for organizations",
  "b2b", "saas", "api access", "sales team", "workforce", "your company",
  "for your business", "platform for", "used by companies", "trusted by teams",
  "per seat", "per user/month", "annual plan", "custom pricing", "talk to sales",
  "book a demo", "request a demo", "contact sales",
];

const B2C_SIGNALS = [
  "sign up free", "it's free", "free forever", "for individuals", "personal plan",
  "b2c", "download the app", "get started for free", "create your account",
  "job seekers", "job seeker", "for you", "your career", "your job search",
  "candidates", "find your next job", "get hired",
];

function detectEndUsers(
  text: string
): "businesses" | "consumers" | "mixed" | undefined {
  const lower = text.toLowerCase();
  const b2bScore = B2B_SIGNALS.filter((s) => lower.includes(s)).length;
  const b2cScore = B2C_SIGNALS.filter((s) => lower.includes(s)).length;
  if (b2bScore > 0 && b2cScore > 0) return "mixed";
  if (b2bScore > b2cScore) return "businesses";
  if (b2cScore > b2bScore) return "consumers";
  return undefined;
}

// ─── Geography ────────────────────────────────────────────────────────────────

const EU_COUNTRY_NAMES = [
  "germany", "france", "spain", "italy", "netherlands", "sweden", "finland",
  "denmark", "austria", "belgium", "poland", "czech republic", "romania",
  "portugal", "greece", "hungary", "ireland", "croatia", "slovakia",
  "bulgaria", "slovenia", "estonia", "latvia", "lithuania", "luxembourg",
  "malta", "cyprus",
];

function detectGeography(text: string): GeographyFlag[] {
  const lower = text.toLowerCase();
  const flags = new Set<GeographyFlag>();

  const euSignals = [
    "gdpr", "european union", " eu ", "eu-based", "eu customers",
    "eu users", "europe", "european",
    ...EU_COUNTRY_NAMES,
  ];

  if (euSignals.some((s) => lower.includes(s))) {
    flags.add("targets_eu_users");
  }
  if (lower.includes("gdpr") || lower.includes("data protection")) {
    flags.add("processes_eu_data");
  }

  return Array.from(flags);
}

// ─── Role hint ────────────────────────────────────────────────────────────────

function detectRole(text: string): "provider" | "deployer" | undefined {
  const lower = text.toLowerCase();
  const providerSignals = [
    "our ai", "we built", "we developed", "our model", "our algorithm",
    "proprietary ai", "our machine learning", "we train", "we fine-tuned",
  ];
  const deployerSignals = [
    "powered by openai", "powered by gpt", "uses claude", "built on",
    "azure ai", "google ai", "anthropic", "openai api",
  ];
  const isProvider = providerSignals.some((s) => lower.includes(s));
  const isDeployer = deployerSignals.some((s) => lower.includes(s));
  if (isProvider && !isDeployer) return "provider";
  if (isDeployer && !isProvider) return "deployer";
  return undefined;
}

// ─── Main extract function ────────────────────────────────────────────────────

export function extractDraftFromScrape(data: ScrapedData): {
  draft: Partial<AssessmentDraft>;
  confidence: Record<string, boolean>;
} {
  const allText = [data.description, data.bodyText].join(" ");
  const shortText = [data.description, data.bodyText.slice(0, 2000)].join(" ");

  const companyName = extractCompanyName(data);
  const companyDescription = data.description || data.ogTitle || "";
  const domain = detectDomain(allText);
  const capabilities = detectCapabilities(allText);
  const endUsers = detectEndUsers(shortText);
  const geography = detectGeography(allText);
  const role = detectRole(shortText);

  const draft: Partial<AssessmentDraft> = {
    company: {
      ...(companyName ? { name: companyName } : {}),
      ...(companyDescription ? { description: companyDescription } : {}),
    },
    ai_system: {
      ...(companyDescription ? { description: companyDescription } : {}),
      ...(capabilities.length > 0 ? { capabilities } : {}),
    },
    deployment: {
      ...(domain ? { domain } : {}),
      ...(endUsers ? { end_users: endUsers } : {}),
      ...(role ? { role } : {}),
    },
    risk_flags: {
      prohibited_flags: [],
      high_risk_indicators: [],
      geography,
      consequential_decisions: false,
      vulnerable_populations: false,
      transparency_obligations: false,
    },
  };

  return {
    draft,
    confidence: {
      companyName: !!companyName,
      description: !!companyDescription,
      domain: !!domain,
      capabilities: capabilities.length > 0,
      endUsers: !!endUsers,
      geography: geography.length > 0,
      role: !!role,
    },
  };
}
