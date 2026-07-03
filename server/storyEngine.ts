/**
 * Profile generation. Anthropic (Claude) → OpenAI → deterministic fallback, so the
 * app always produces a coherent, brand-safe StoryProfile even with no keys.
 *
 * Brand-safety is enforced at output time, not by interrogating the creator:
 *   - self-reported numbers are fenced in `neverSayThis`
 *   - `fitScore` is capped with a rationale that names the unverified claims
 *   - `leadWithThis` surfaces the verifiable, hard-to-copy edge
 */

import { complete, extractJson } from "./llm";
import { assessSpecificity } from "./questions";
import { isBigClaim, extractBigClaims } from "@shared/claims";
import { storyProfileSchema, type StoryProfile, type IntakeTurn } from "@shared/schema";

export interface GenerateInput {
  name: string;
  niche?: string;
  turns: IntakeTurn[];
  edge?: string;
}

export async function generateProfile(input: GenerateInput): Promise<StoryProfile> {
  const llm = await tryLlmProfile(input);
  const base = llm ?? deterministicProfile(input);
  return postProcess(base, input);
}

/* ---------------------------------------------------------------------------
 * LLM path
 * ------------------------------------------------------------------------- */

async function tryLlmProfile(input: GenerateInput): Promise<StoryProfile | null> {
  const transcript = input.turns
    .map((t) => `[${t.stage}] Q: ${t.question}\nA: ${t.answer}`)
    .join("\n\n");

  const text = await complete({
    // A full profile with rich prose needs headroom — too small a budget truncates
    // the JSON and the whole response is silently discarded.
    maxTokens: 8000,
    system: `You are Cited, a strategic-narrative engine for founders and expert B2B firms.
Turn the interview into a UNIQUE, client-ready narrative profile — the story an AI assistant would need in order to recommend this firm by name. The differentiator is the firm's EDGE — a lived contradiction, not polished positioning. Quote the founder's own words in "verbatim". Treat brandFitMap as the map of client/partner categories this firm fits. Never invent numbers; only use claims present in the transcript. Keep each field concise so the JSON is complete and valid. Reply ONLY with JSON matching exactly these keys:
{"archetype":string,"positioningLine":string,"originStory":string,"transformationArc":string,"edge":string,"values":string[],"antiValues":string[],"tensions":string[],"audienceRelationship":string,"contentStyle":string,"verbatim":string[],"proofPoints":[{"claim":string,"evidence":string}],"brandFitMap":[{"category":string,"rationale":string,"congruence":"high"|"medium"|"low"}],"hardNoCategories":string[],"campaignAngles":[{"title":string,"premise":string,"format":string}],"profileBio":string,"brandNarrative":string,"pitchDM":string,"pitchEmail":string,"narrativeTags":string[],"creatorApprovalLine":string,"leadWithThis":string[],"neverSayThis":string[],"fitScore":number,"fitRationale":string,"lowSpecificity":boolean}`,
    user: `Creator: ${input.name}${input.niche ? ` (${input.niche})` : ""}
${input.edge ? `Confirmed edge: ${input.edge}\n` : ""}
Transcript:
${transcript}`,
  });

  const parsed = extractJson<any>(text);
  if (!parsed) {
    if (text) console.warn("[storyEngine] LLM returned unparseable JSON; using deterministic fallback.");
    return null;
  }

  // Normalize the model's JSON so a minor omission/typo doesn't discard an otherwise
  // good response. Missing strings become "", missing arrays become [], congruence is
  // coerced to a valid enum, and proof statuses are validated.
  const candidate = normalizeLlmProfile(parsed, input);
  const result = storyProfileSchema.safeParse(candidate);
  if (!result.success) {
    console.warn(
      "[storyEngine] LLM JSON failed validation; using deterministic fallback. Issues:",
      result.error.issues.map((i) => i.path.join(".")).join(", "),
    );
    return null;
  }
  return result.data;
}

const VALID_STATUS = ["self-reported", "needs-proof", "verified"];

function normalizeLlmProfile(parsed: any, input: GenerateInput): StoryProfile {
  const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
  const arr = (v: unknown): any[] => (Array.isArray(v) ? v : v == null ? [] : [v]);
  const strArr = (v: unknown): string[] => arr(v).map(str).filter(Boolean);
  const cong = (v: unknown): "high" | "medium" | "low" => {
    const s = str(v).toLowerCase();
    return s === "high" || s === "low" ? s : "medium";
  };

  return {
    archetype: str(parsed.archetype),
    positioningLine: str(parsed.positioningLine),
    originStory: str(parsed.originStory),
    transformationArc: str(parsed.transformationArc),
    edge: str(parsed.edge || input.edge),
    values: strArr(parsed.values),
    antiValues: strArr(parsed.antiValues),
    tensions: strArr(parsed.tensions),
    audienceRelationship: str(parsed.audienceRelationship),
    contentStyle: str(parsed.contentStyle),
    verbatim: strArr(parsed.verbatim),
    proofPoints: arr(parsed.proofPoints)
      .map((p: any) => ({
        claim: str(p?.claim || p?.category || "stated"),
        evidence: str(p?.evidence ?? p),
        status: VALID_STATUS.includes(p?.status) ? p.status : undefined,
      }))
      .filter((p) => p.evidence),
    brandFitMap: arr(parsed.brandFitMap)
      .map((b: any) => ({
        category: str(b?.category),
        rationale: str(b?.rationale),
        congruence: cong(b?.congruence),
      }))
      .filter((b) => b.category),
    hardNoCategories: strArr(parsed.hardNoCategories),
    campaignAngles: arr(parsed.campaignAngles)
      .map((a: any) => ({
        title: str(a?.title),
        premise: str(a?.premise),
        format: str(a?.format || "post"),
      }))
      .filter((a) => a.title),
    profileBio: str(parsed.profileBio),
    brandNarrative: str(parsed.brandNarrative),
    pitchDM: str(parsed.pitchDM),
    pitchEmail: str(parsed.pitchEmail),
    narrativeTags: strArr(parsed.narrativeTags),
    creatorApprovalLine: parsed.creatorApprovalLine ? str(parsed.creatorApprovalLine) : undefined,
    leadWithThis: strArr(parsed.leadWithThis),
    neverSayThis: strArr(parsed.neverSayThis),
    fitScore: typeof parsed.fitScore === "number" ? parsed.fitScore : Number(parsed.fitScore) || 60,
    fitRationale: str(parsed.fitRationale),
    lowSpecificity: !!parsed.lowSpecificity,
    specificityNote: parsed.specificityNote ? str(parsed.specificityNote) : undefined,
  };
}

/* ---------------------------------------------------------------------------
 * Deterministic fallback — coherent, brand-safe, never overclaims
 * ------------------------------------------------------------------------- */

function pick(turns: IntakeTurn[], stage: RegExp): string {
  return turns.find((t) => stage.test(t.stage))?.answer?.trim() || "";
}

function firstSentence(s: string): string {
  return (s.split(/(?<=[.!?])\s+/)[0] || s).trim();
}

function sentences(s: string, n: number): string[] {
  return s
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, n);
}

function deterministicProfile(input: GenerateInput): StoryProfile {
  const { name, niche } = input;
  const turns = input.turns;
  const origin = pick(turns, /origin/i);
  const audience = pick(turns, /audience/i);
  const values = pick(turns, /values/i);
  const proof = pick(turns, /proof/i);
  const fit = pick(turns, /commercial|fit/i);
  const edge = input.edge || firstSentence(values || origin) || "A lived contradiction most creators would smooth over.";

  const verbatim = [firstSentence(origin), firstSentence(values)]
    .filter((s) => s.length > 12)
    .map((s) => `"${s.replace(/^["']|["']$/g, "")}"`);

  const bigClaims = extractBigClaims(proof);
  const proofPoints = bigClaims.length
    ? bigClaims.map((c) => ({ claim: c.category, evidence: c.text }))
    : sentences(proof, 3).map((s) => ({ claim: "stated", evidence: s }));

  const hardNos = extractHardNos(values + " " + fit);
  const loved = extractLoved(fit);

  return {
    archetype: nicheArchetype(niche),
    positioningLine: edge,
    originStory: origin || "The founding story, in their own words, was not captured in detail.",
    transformationArc: [firstSentence(origin), firstSentence(values)].filter(Boolean).join(" → ") ||
      "From lived struggle to a specific, defensible point of view.",
    edge,
    values: sentences(values, 2),
    antiValues: hardNos.slice(0, 3),
    tensions: [edge].filter(Boolean),
    audienceRelationship: audience || "A specific client who trusts this firm for candor over polish.",
    contentStyle: "Candid, specific, unpolished — the anti-brochure.",
    verbatim,
    proofPoints,
    brandFitMap: loved.map((c) => ({
      category: c,
      rationale: `Named as a category the firm would be proud to work with.`,
      congruence: "high" as const,
    })),
    hardNoCategories: hardNos,
    campaignAngles: [
      {
        title: "Lead with the edge",
        premise: edge,
        format: "Founder-voice essay + answer-shaped comparison page",
      },
    ],
    profileBio: buildBio(name, niche, edge, audience),
    brandNarrative: [origin, values].filter(Boolean).map(firstSentence).join(" "),
    pitchDM: `Hi — ${name} here. ${edge} If that fits what you're building, I'd love to talk.`,
    pitchEmail: `Subject: A partnership that leads with substance\n\n${buildBio(name, niche, edge, audience)}\n\nHappy to share the full story profile.`,
    narrativeTags: [niche || "specialist", "edge-first", "citation-ready"],
    creatorApprovalLine: edge,
    leadWithThis: [],
    neverSayThis: [],
    fitScore: 60,
    fitRationale: "",
    lowSpecificity: false,
  };
}

function nicheArchetype(niche?: string): string {
  const n = (niche || "").toLowerCase();
  if (n.includes("consult") || n.includes("advis")) return "The Straight-Answer Firm";
  if (n.includes("legal") || n.includes("law")) return "The Plain-English Counsel";
  if (n.includes("financ") || n.includes("cfo") || n.includes("account")) return "The Numbers Translator";
  if (n.includes("recruit") || n.includes("talent")) return "The Specialist Matchmaker";
  if (n.includes("endur")) return "The Durable Guide";
  if (n.includes("strength")) return "The Honest Builder";
  if (n.includes("well")) return "The Grounded Practitioner";
  return "The Specific One";
}

function buildBio(name: string, niche: string | undefined, edge: string, audience: string): string {
  const who = audience ? firstSentence(audience) : "clients who value candor over polish";
  return `${name} is a ${niche || "specialist"} firm whose edge is simple and hard to copy: ${edge} They show up for ${who}`;
}

function extractHardNos(text: string): string[] {
  const nos: string[] = [];
  const patterns: [RegExp, string][] = [
    [/detox|teatox|skinny tea/i, "detox / 'skinny' teas"],
    [/weight[- ]?loss|shred|fat burner/i, "weight-loss / fat-burner products"],
    [/sarms|steroid|gear/i, "SARMs / performance drugs"],
    [/transformation challenge|before\/?after|before and after/i, "before/after 'transformation challenges'"],
    [/waist trainer/i, "waist trainers"],
  ];
  for (const [re, label] of patterns) if (re.test(text)) nos.push(label);
  return nos;
}

function extractLoved(text: string): string[] {
  const loved: string[] = [];
  const patterns: [RegExp, string][] = [
    [/real[- ]?food|whole food|fuell?ing/i, "real-food fuelling"],
    [/merino|natural[- ]?fib|kit|apparel/i, "natural-fibre apparel & kit"],
    [/gps|watch|wearable/i, "wearables used as tools"],
    [/perimenopause|women'?s health/i, "women's-health platforms"],
    [/creatine|whey|home gym|equipment/i, "no-nonsense home-gym & basics"],
  ];
  for (const [re, label] of patterns) if (re.test(text)) loved.push(label);
  return loved.length ? loved : ["values-aligned brands in the creator's niche"];
}

/* ---------------------------------------------------------------------------
 * Post-processing — brand safety, fit-score cap, low-specificity flag
 * ------------------------------------------------------------------------- */

function postProcess(profile: StoryProfile, input: GenerateInput): StoryProfile {
  const spec = assessSpecificity(input.turns);

  // Detect self-reported big claims across the transcript → never assert as fact.
  const claimText = input.turns
    .filter((t) => /proof/i.test(t.stage) || isBigClaim(t.answer))
    .map((t) => t.answer)
    .join(" ");
  const bigClaims = extractBigClaims(claimText);

  const neverSayThis = uniq([
    ...profile.neverSayThis,
    ...bigClaims.map(
      (c) => `Don't assert "${trimClaim(c.text)}" as established fact — it's self-reported and unverified.`,
    ),
  ]);

  // Mark proof points that are big claims as self-reported unless already set.
  const proofPoints = profile.proofPoints.map((p) => ({
    ...p,
    status: p.status ?? (isBigClaim(p.evidence) ? ("self-reported" as const) : undefined),
  }));

  const leadWithThis = uniq([
    ...profile.leadWithThis,
    profile.edge,
    ...profile.hardNoCategories.slice(0, 1).map((h) => `Trust signal: publicly refuses ${h}.`),
  ]).filter(Boolean);

  // Cap fit score when key numbers are self-reported and/or specificity is low.
  let fitScore = clamp(profile.fitScore || 60);
  const caps: string[] = [];
  if (bigClaims.length > 0 && fitScore > 74) {
    fitScore = 74;
    caps.push(`capped at 74 until self-reported numbers are verified (${bigClaims.length} claim(s))`);
  }
  if (spec.lowSpecificity && fitScore > 55) {
    fitScore = 55;
    caps.push("capped at 55 for low specificity — creator stayed generic");
  }
  const fitRationale = [profile.fitRationale, ...caps].filter(Boolean).join("; ");

  return {
    ...profile,
    proofPoints,
    neverSayThis,
    leadWithThis,
    fitScore,
    fitRationale: fitRationale || "Fit score reflects clarity of edge and verifiable proof.",
    lowSpecificity: profile.lowSpecificity || spec.lowSpecificity,
    specificityNote: profile.specificityNote || spec.note,
  };
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const uniq = <T>(arr: T[]) => Array.from(new Set(arr));
const trimClaim = (s: string) => (s.length > 80 ? s.slice(0, 77) + "…" : s);
