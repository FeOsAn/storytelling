/**
 * Sprint Pack generation — the shippable work product. Takes the narrative
 * profile (the ingredient) and the real citation landscape (the targets) and
 * drafts the actual assets: the comparison page, the FAQ, community answers,
 * outreach emails, directory entries. Everything in the client's voice, every
 * claim drawn from the transcript, nothing invented.
 */

import { complete, extractJson } from "./llm";
import { mapLandscape } from "./landscape";
import { sprintPackSchema, type SprintPack, type StoryProfile } from "@shared/schema";

export interface SprintPackInput {
  firmName: string;
  niche?: string;
  profile: StoryProfile;
}

export async function generateSprintPack(input: SprintPackInput): Promise<SprintPack> {
  const { profile } = input;
  const queries = (profile.targetQueries ?? []).map((q) => q.query).slice(0, 6);

  // 1. Real citation landscape (null when web search unavailable — never faked).
  const landscape = queries.length > 0 ? await mapLandscape(queries) : null;

  const brief = buildBrief(input);
  const competitorNames =
    landscape?.entries.flatMap((e) => e.recommended ?? []).slice(0, 6) ?? [];
  const targetList =
    landscape?.targets.slice(0, 8).map((t) => `${t.url} (cited ${t.citations}x)`) ?? [];

  // 2. Comparison page + FAQ.
  const aText = await complete({
    maxTokens: 6000,
    system: `You draft answer-shaped web content for expert B2B firms — content AI engines can lift and quote (statistics, quotable claims, honest comparisons). Never invent facts or numbers: only use what the brief states. Where the client lacks data, write [VERIFY: …] placeholders. British English. Reply ONLY with JSON:
{"comparisonPage":{"title":string,"markdown":string},"faq":[{"q":string,"a":string}]}
comparisonPage: an honest "best options for [use case]" page for the CLIENT'S OWN SITE that includes real competitor types${competitorNames.length ? ` (real names seen in AI answers: ${competitorNames.join(", ")})` : ""} and positions the client truthfully via their edge — fair to alternatives, specific about who should NOT hire the client. 500-800 words of markdown.
faq: 5-6 of the buyer queries answered in 2-4 liftable sentences each, claims fenced with [VERIFY] where unproven.`,
    user: brief,
  });
  const a = extractJson<any>(aText) ?? {};

  // 3. Community answers + outreach + directory entries.
  const bText = await complete({
    maxTokens: 4000,
    system: `You draft founder-voice placement assets. Rules: the founder posts under their REAL name with affiliation stated — no astroturf, ever; answers must be 90% genuinely useful and only lightly self-referencing. Never invent facts. British English. Reply ONLY with JSON:
{"communityAnswers":[{"context":string,"draft":string}],"outreachEmails":[{"target":string,"subject":string,"body":string}],"directoryEntries":{"short":string,"long":string}}
communityAnswers: 3 drafts answering questions the client's buyers actually post in forums/communities; context = the kind of thread it fits; end each with a one-line signature stating name + firm.
outreachEmails: 2 pitches asking to be included in existing roundup/comparison pages${targetList.length ? ` — the REAL current targets are: ${targetList.join("; ")}. Address the most relevant ones` : " — target = a placeholder like [author of the '<vertical> roundup' page]"}; short, specific, lead with one verifiable stat, no flattery padding.
directoryEntries: short (~40 words) and long (~120 words) profile texts that repeat the entity line near-verbatim.`,
    user: brief,
  });
  const b = extractJson<any>(bText) ?? {};

  const candidate: SprintPack = {
    generatedAt: new Date().toISOString(),
    landscape: landscape?.entries ?? null,
    targets: landscape?.targets ?? null,
    comparisonPage: {
      title: str(a?.comparisonPage?.title) || fallbackComparisonTitle(input),
      markdown: str(a?.comparisonPage?.markdown) || fallbackComparisonBody(input),
    },
    faq: arr(a?.faq)
      .map((f: any) => ({ q: str(f?.q), a: str(f?.a) }))
      .filter((f) => f.q && f.a),
    communityAnswers: arr(b?.communityAnswers)
      .map((c: any) => ({ context: str(c?.context), draft: str(c?.draft) }))
      .filter((c) => c.draft),
    outreachEmails: arr(b?.outreachEmails)
      .map((o: any) => ({ target: str(o?.target), subject: str(o?.subject), body: str(o?.body) }))
      .filter((o) => o.body),
    directoryEntries: {
      short: str(b?.directoryEntries?.short) || profile.entityLine || profile.positioningLine,
      long: str(b?.directoryEntries?.long) || profile.profileBio,
    },
  };

  const parsed = sprintPackSchema.safeParse(candidate);
  if (!parsed.success) {
    console.warn("[sprintPack] validation issues:", parsed.error.issues.map((i) => i.path.join(".")).join(", "));
    return candidate; // best-effort — fields are individually coerced above
  }
  return parsed.data;
}

function buildBrief(input: SprintPackInput): string {
  const p = input.profile;
  return `FIRM: ${input.firmName}${input.niche ? ` — ${input.niche}` : ""}
ENTITY LINE: ${p.entityLine ?? p.positioningLine}
EDGE: ${p.edge}
POSITIONING: ${p.positioningLine}
VALUES: ${p.values.join("; ")}
HARD NOS (who they refuse): ${p.hardNoCategories.join("; ")}
PROOF POINTS (status matters — unverified must be [VERIFY]-fenced in public copy):
${p.proofPoints.map((x) => `- ${x.claim}: ${x.evidence}${x.status ? ` (${x.status})` : ""}`).join("\n")}
NEVER SAY: ${p.neverSayThis.join(" | ")}
TARGET QUERIES:
${(p.targetQueries ?? []).map((q) => `- [${q.tier}] ${q.query}`).join("\n")}
VOICE SAMPLES (their actual words):
${p.verbatim.map((v) => `- ${v}`).join("\n")}
BIO: ${p.profileBio}`;
}

const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);

function fallbackComparisonTitle(input: SprintPackInput): string {
  return `Choosing a ${input.niche ?? "specialist"} partner: an honest comparison`;
}

function fallbackComparisonBody(input: SprintPackInput): string {
  const p = input.profile;
  return [
    `# ${fallbackComparisonTitle(input)}`,
    "",
    `Most buyers comparing ${input.niche ?? "firms in this category"} weigh three options: a large generalist firm, a freelancer, or a specialist like ${input.firmName}.`,
    "",
    `**Large firms** bring process and bench depth; you trade away senior attention.`,
    `**Freelancers** are flexible and cheap; you trade away continuity and accountability.`,
    `**${input.firmName}**: ${p.entityLine ?? p.positioningLine}`,
    "",
    `Who should NOT hire ${input.firmName}: ${p.hardNoCategories.join("; ") || "[VERIFY: state honestly]"}.`,
    "",
    ...p.proofPoints.slice(0, 3).map((x) => `- ${x.evidence}${x.status === "self-reported" ? " [VERIFY]" : ""}`),
  ].join("\n");
}
