// ─────────────────────────────────────────────────────────────
// CampusFix smart triage engine (rule-based heuristics, not a model)
// Handles: category suggestion, severity signals, duplicate
// detection and the explainable Campus Impact Score (S+A+R+T).
// ─────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "Electrical Safety",
  "Electrical / Fixtures",
  "Plumbing / Water",
  "Network / Wi-Fi",
  "Furniture / Fittings",
  "Cleaning / Hygiene",
  "Other",
] as const;

export const BUILDINGS = [
  "Block A — Academics",
  "Block B — Classrooms",
  "Block C — Labs",
  "Library",
  "Hostel — North",
  "Hostel — South",
  "Sports Complex",
  "Cafeteria",
] as const;

export type Severity = "low" | "moderate" | "high" | "critical";

export interface TriageResult {
  category: string;
  severity: Severity;
  reason: string;
  matchedKeywords: string[];
}

interface Rule {
  keywords: string[];
  category: string;
  severity: Severity;
  note: string;
}

const RULES: Rule[] = [
  {
    keywords: ["spark", "shock", "exposed wire", "bare wire", "short circuit", "burning smell", "smoke", "live wire", "electric shock"],
    category: "Electrical Safety",
    severity: "critical",
    note: "Safety-hazard terms detected — flagged as an electrical safety concern.",
  },
  {
    keywords: ["leak near socket", "water near socket", "leaking near", "seepage near"],
    category: "Electrical Safety",
    severity: "critical",
    note: "Water close to electrical equipment — combined hazard flagged for review.",
  },
  {
    keywords: ["leak", "leaking", "water", "pipe", "drip", "tap", "overflow", "flush", "seepage", "washroom flood"],
    category: "Plumbing / Water",
    severity: "high",
    note: "Water-related terms detected — routed to plumbing.",
  },
  {
    keywords: ["fan", "projector", "light", "tube", "bulb", "switch", "socket", "ac ", "air condition", "power"],
    category: "Electrical / Fixtures",
    severity: "moderate",
    note: "Fixture/equipment terms detected — routed to electrical maintenance.",
  },
  {
    keywords: ["wifi", "wi-fi", "internet", "network", "router", "lan", "connection"],
    category: "Network / Wi-Fi",
    severity: "moderate",
    note: "Connectivity terms detected — routed to the network team.",
  },
  {
    keywords: ["chair", "desk", "bench", "door", "window", "hinge", "table", "cupboard", "lock"],
    category: "Furniture / Fittings",
    severity: "low",
    note: "Furniture/fitting terms detected — routine repair.",
  },
  {
    keywords: ["garbage", "dirty", "smell", "clean", "dustbin", "pest", "mosquito", "hygiene"],
    category: "Cleaning / Hygiene",
    severity: "moderate",
    note: "Hygiene terms detected — routed to housekeeping.",
  },
];

export function triage(title: string, description: string): TriageResult {
  const text = `${title} ${description}`.toLowerCase();
  const matched: { rule: Rule; hits: string[] }[] = [];
  for (const rule of RULES) {
    const hits = rule.keywords.filter((k) => text.includes(k));
    if (hits.length > 0) matched.push({ rule, hits });
  }
  if (matched.length === 0) {
    return {
      category: "Other",
      severity: "moderate",
      reason: "No specific keywords matched — a staff member will review and classify this report.",
      matchedKeywords: [],
    };
  }
  const rank: Record<Severity, number> = { low: 0, moderate: 1, high: 2, critical: 3 };
  matched.sort((a, b) => rank[b.rule.severity] - rank[a.rule.severity] || b.hits.length - a.hits.length);
  const top = matched[0];
  return {
    category: top.rule.category,
    severity: top.rule.severity,
    reason: top.rule.note,
    matchedKeywords: top.hits,
  };
}

// ── Duplicate detection ──────────────────────────────────────

const STOPWORDS = new Set(
  "the a an is are was were in on at of to and or not no it this that has have been very with for from room block my our there their working stopped stop".split(" ")
);

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

export interface DupCandidate {
  id: number;
  code: string;
  title: string;
  description: string;
  building: string;
  room: string;
  category: string;
  status: string;
  createdAt: Date | string;
}

export interface DuplicateMatch {
  ticket: DupCandidate;
  similarity: number; // 0-100
  why: string[];
}

export function findDuplicates(
  input: { title: string; description: string; building: string; room: string; category?: string },
  candidates: DupCandidate[],
  excludeId?: number
): DuplicateMatch[] {
  const inputTokens = tokens(`${input.title} ${input.description}`);
  const results: DuplicateMatch[] = [];
  for (const c of candidates) {
    if (excludeId && c.id === excludeId) continue;
    if (c.status === "resolved") continue;
    const cTokens = tokens(`${c.title} ${c.description}`);
    let overlap = 0;
    inputTokens.forEach((t) => { if (cTokens.has(t)) overlap++; });
    const union = new Set([...inputTokens, ...cTokens]).size || 1;
    const jaccard = overlap / union;
    const sameRoom =
      c.building === input.building &&
      c.room.trim().toLowerCase() === input.room.trim().toLowerCase() &&
      input.room.trim() !== "";
    const sameBuilding = c.building === input.building;
    const sameCategory = input.category ? c.category === input.category : false;

    let score = jaccard * 60;
    if (sameRoom) score += 30;
    else if (sameBuilding) score += 12;
    if (sameCategory) score += 10;
    score = Math.round(Math.min(100, score));

    if (score >= 35 && (overlap >= 2 || (sameRoom && overlap >= 1))) {
      const why: string[] = [];
      if (sameRoom) why.push(`Same location (${c.room})`);
      else if (sameBuilding) why.push("Same building");
      if (sameCategory) why.push(`Same category: ${c.category}`);
      if (overlap > 0) why.push(`${overlap} matching keyword${overlap > 1 ? "s" : ""} in the description`);
      results.push({ ticket: c, similarity: score, why });
    }
  }
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
}

// ── Campus Impact Score ──────────────────────────────────────

export interface ScoreFactor {
  key: "S" | "A" | "R" | "T";
  label: string;
  points: number;
  max: number;
  explanation: string;
}

export interface ImpactScore {
  total: number;
  priority: "Critical" | "High" | "Medium" | "Low";
  factors: ScoreFactor[];
}

const SAFETY_POINTS: Record<Severity, number> = {
  critical: 40,
  high: 30,
  moderate: 16,
  low: 8,
};

export function impactScore(opts: {
  severity: string;
  affectedCount: number; // reporter + supporters
  recurrenceCount: number; // earlier similar tickets at same location
  createdAt: Date | string;
  status: string;
  resolvedAt?: Date | string | null;
}): ImpactScore {
  const sev = (opts.severity as Severity) in SAFETY_POINTS ? (opts.severity as Severity) : "moderate";
  const S = SAFETY_POINTS[sev];
  const A = Math.min(30, opts.affectedCount * 3);
  const R = Math.min(15, opts.recurrenceCount * 5);
  const end = opts.status === "resolved" && opts.resolvedAt ? new Date(opts.resolvedAt) : new Date();
  const days = Math.max(0, (end.getTime() - new Date(opts.createdAt).getTime()) / 86_400_000);
  const T = opts.status === "resolved" ? 0 : Math.min(15, Math.floor(days * 2));
  const total = Math.min(100, S + A + R + T);

  const priority = total >= 75 ? "Critical" : total >= 50 ? "High" : total >= 25 ? "Medium" : "Low";

  const factors: ScoreFactor[] = [
    {
      key: "S",
      label: "Safety & severity",
      points: S,
      max: 40,
      explanation:
        sev === "critical"
          ? "Safety hazard detected — urgent even with a single reporter."
          : sev === "high"
          ? "Significant disruption (e.g. water damage or major outage)."
          : sev === "moderate"
          ? "Noticeable inconvenience, no immediate safety risk."
          : "Minor issue with limited disruption.",
    },
    {
      key: "A",
      label: "Students affected",
      points: A,
      max: 30,
      explanation: `${opts.affectedCount} student${opts.affectedCount === 1 ? "" : "s"} reported being affected (3 pts each, capped at 30).`,
    },
    {
      key: "R",
      label: "Recurring issue",
      points: R,
      max: 15,
      explanation:
        opts.recurrenceCount > 0
          ? `${opts.recurrenceCount} earlier ticket${opts.recurrenceCount > 1 ? "s" : ""} for the same location & category (5 pts each, capped at 15).`
          : "First recorded issue of this kind at this location.",
    },
    {
      key: "T",
      label: "Time unresolved",
      points: T,
      max: 15,
      explanation:
        opts.status === "resolved"
          ? "Resolved — aging no longer adds pressure."
          : `Open for ${days < 1 ? "less than a day" : `${Math.floor(days)} day${Math.floor(days) === 1 ? "" : "s"}`} (2 pts/day, capped at 15).`,
    },
  ];

  return { total, priority, factors };
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case "Critical": return "text-red-700 bg-red-50 border-red-200";
    case "High": return "text-orange-700 bg-orange-50 border-orange-200";
    case "Medium": return "text-amber-700 bg-amber-50 border-amber-200";
    default: return "text-emerald-700 bg-emerald-50 border-emerald-200";
  }
}