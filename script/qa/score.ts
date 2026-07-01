/**
 * Heuristic scorer for generated StoryProfiles.
 * =============================================
 * Deterministic (no API key needed) so the QA loop is repeatable in CI. Scores
 * a profile 0–100 per dimension against the persona's expected lived details.
 *
 * Dimensions (the moat = uniqueness):
 *   specificity, voiceFidelity, proofQuality, tension, antiValues,
 *   audiencePromise, brandFit, commercial, creatorApproval
 *
 * Plus two cross-cutting checks:
 *   genericPenalty   — count of banned generic phrases found
 *   replaceNameTest  — does the bio/narrative still carry persona-unique
 *                      anchors once the name/handle is stripped? (un-fakeable?)
 */

import type { StoryProfile } from "@shared/schema";
import type { Persona } from "./personas";

/** Phrases that signal generic AI-bio filler — should never appear verbatim. */
export const BANNED_GENERIC = [
  "more than a follower count",
  "more than their follower count",
  "point of view you can trust",
  "credibility you can audit",
  "passionate about",
  "game-changer",
  "game changer",
  "guru",
  "the real version, not the highlight reel",
  "where they started to a place where others now follow",
  "private struggle to public authority",
  "is small enough to trust",
  "worth more than their follower count",
];

function profileText(p: StoryProfile): string {
  const parts: string[] = [
    p.archetype,
    p.positioningLine,
    p.originStory,
    p.transformationArc,
    ...(p.values || []),
    ...(p.antiValues || []),
    ...(p.tensions || []),
    p.audienceRelationship,
    p.contentStyle,
    ...(p.verbatim || []),
    ...(p.proofPoints || []).flatMap((x) => [x.claim, x.evidence]),
    ...(p.brandFitMap || []).flatMap((x) => [x.category, x.rationale]),
    ...(p.hardNoCategories || []),
    ...(p.campaignAngles || []).flatMap((x) => [x.title, x.premise, x.format]),
    p.profileBio,
    p.brandNarrative,
    p.pitchDM,
    p.pitchEmail,
    ...(p.narrativeTags || []),
    (p as any).creatorApprovalLine || "",
  ];
  return parts.join(" \n ").toLowerCase();
}

function countAnchors(text: string, anchors: string[]): { hit: string[]; miss: string[] } {
  const hit: string[] = [];
  const miss: string[] = [];
  for (const a of anchors) {
    if (text.includes(a.toLowerCase())) hit.push(a);
    else miss.push(a);
  }
  return { hit, miss };
}

function anyOf(text: string, needles: string[]): boolean {
  return needles.some((n) => text.includes(n.toLowerCase()));
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export interface DimensionScores {
  specificity: number;
  voiceFidelity: number;
  proofQuality: number;
  tension: number;
  antiValues: number;
  audiencePromise: number;
  brandFit: number;
  commercial: number;
  creatorApproval: number;
}

export interface ScoreResult {
  persona: string;
  niche: string;
  engine: string;
  dimensions: DimensionScores;
  overall: number;
  genericHits: string[];
  replaceNamePass: boolean;
  /** A recommended (high/medium) brand category that collides with a stated hard-no. */
  hardNoViolation: boolean;
  anchorsHit: string[];
  anchorsMiss: string[];
  notes: string[];
}

export function scoreProfile(
  persona: Persona,
  profile: StoryProfile,
  engine: string
): ScoreResult {
  const text = profileText(profile);
  const notes: string[] = [];
  const { anchors, lovedCats, hardNos } = persona.expected;
  const { hit, miss } = countAnchors(text, anchors);

  // ---- genericPenalty ----
  const genericHits = BANNED_GENERIC.filter((b) => text.includes(b));
  const genericPenalty = genericHits.length;

  // ---- replace-the-name test ----
  const first = persona.name.split(" ")[0].toLowerCase();
  const full = persona.name.toLowerCase();
  const handle = persona.handle.toLowerCase();
  const facing = `${profile.profileBio} ${profile.brandNarrative} ${profile.positioningLine}`
    .toLowerCase()
    .split(full).join("creator")
    .split(first).join("creator")
    .split(handle).join("creator");
  const facingAnchors = anchors.filter((a) => facing.includes(a.toLowerCase()));
  const replaceNamePass = facingAnchors.length >= 2;
  if (!replaceNamePass)
    notes.push(
      `replace-name test FAIL: bio/narrative carries only ${facingAnchors.length} unique anchor(s) once name is stripped`
    );

  // ---- specificity: anchor coverage in full profile ----
  const anchorRatio = anchors.length ? hit.length / anchors.length : 0;
  const hasNumbers = /\d/.test(
    `${profile.originStory} ${profile.transformationArc} ${(profile.proofPoints || [])
      .map((p) => p.evidence)
      .join(" ")}`
  );
  let specificity = anchorRatio * 85 + (hasNumbers ? 15 : 0);
  if (genericPenalty) specificity -= genericPenalty * 12;
  specificity = clamp(specificity);
  if (miss.length) notes.push(`missing anchors: ${miss.join(", ")}`);

  // ---- voiceFidelity: verbatim quotes present + actually from transcript ----
  const transcript = Object.values(persona.answers).join(" ").toLowerCase();
  const verb = profile.verbatim || [];
  const realQuotes = verb.filter((v) => {
    const vv = v.toLowerCase().replace(/^["']|["']$/g, "").trim();
    return vv.length > 8 && transcript.includes(vv.slice(0, Math.min(40, vv.length)));
  });
  const quotedInProse = verb.some(
    (v) =>
      v.length > 8 &&
      (profile.originStory.toLowerCase().includes(v.toLowerCase().slice(0, 25)) ||
        profile.positioningLine.toLowerCase().includes(v.toLowerCase().slice(0, 25)))
  );
  let voiceFidelity =
    Math.min(3, realQuotes.length) * 22 + (quotedInProse ? 25 : 0) + (verb.length >= 2 ? 9 : 0);
  voiceFidelity = clamp(voiceFidelity);
  if (realQuotes.length === 0) notes.push("no verbatim quote traceable to transcript");

  // ---- proofQuality: distinct, evidenced, quantified ----
  const pps = profile.proofPoints || [];
  const evidences = pps.map((p) => p.evidence.trim().toLowerCase());
  const distinct = new Set(evidences).size;
  const dupPenalty = pps.length - distinct;
  const numericProof = pps.filter((p) => /\d/.test(p.evidence)).length;
  let proofQuality =
    Math.min(4, distinct) * 16 + Math.min(3, numericProof) * 12 - dupPenalty * 18;
  proofQuality = clamp(proofQuality);
  if (dupPenalty > 0) notes.push(`${dupPenalty} duplicated proof-point evidence string(s)`);

  // ---- tension: count + persona-specific + not generic fallback ----
  const tensions = profile.tensions || [];
  const genericTension = tensions.filter((t) =>
    /walk from any deal|overclaim|confident on camera|careful with their credibility/i.test(t)
  ).length;
  const specificTension = tensions.filter((t) => anyOf(t.toLowerCase(), anchors)).length;
  let tension =
    Math.min(3, tensions.length) * 18 + specificTension * 18 - genericTension * 16;
  tension = clamp(tension);
  if (genericTension) notes.push(`${genericTension} generic boilerplate tension(s)`);

  // ---- antiValues: present + reflect stated hard-no language ----
  const avs = (profile.antiValues || []).join(" ").toLowerCase();
  const avSpecific = anyOf(avs, hardNos) || anyOf(avs, anchors);
  let antiValues =
    Math.min(3, (profile.antiValues || []).length) * 18 + (avSpecific ? 46 : 0);
  antiValues = clamp(antiValues);
  if (!avSpecific) notes.push("anti-values are generic (don't reflect stated no's)");

  // ---- audiencePromise: specific audience, not a demographic ----
  const ar = (profile.audienceRelationship || "").toLowerCase();
  const audSpecific = anyOf(ar, anchors) || /dm|11pm|2am|specific|who/.test(ar);
  let audiencePromise =
    (ar.length > 80 ? 40 : 15) + (audSpecific ? 35 : 0) + (anyOf(ar, anchors) ? 25 : 0);
  audiencePromise = clamp(audiencePromise);

  // ---- brandFit: high-congruence + rationale + loved cat + hard-no honored ----
  const bfm = profile.brandFitMap || [];
  const highs = bfm.filter((b) => b.congruence === "high").length;
  const lovedHit = bfm.some((b) => anyOf(b.category.toLowerCase(), lovedCats));
  const hardNoText = (profile.hardNoCategories || []).join(" ").toLowerCase();
  const hardNoHit = anyOf(hardNoText, hardNos);
  let brandFit =
    Math.min(3, highs) * 14 + (lovedHit ? 22 : 0) + (hardNoHit ? 24 : 0) + (bfm.length >= 3 ? 12 : 0);
  brandFit = clamp(brandFit);
  if (!hardNoHit) notes.push("hard-no categories don't reflect the creator's explicit refusals");
  if (!lovedHit) notes.push("brand-fit map misses the creator's stated loved categories");

  // ---- hard-no violation: did we RECOMMEND a category the creator refuses? ----
  const recommended = bfm
    .filter((b) => b.congruence === "high" || b.congruence === "medium")
    .map((b) => b.category.toLowerCase());
  const hardNoViolation = recommended.some((cat) => anyOf(cat, hardNos));
  if (hardNoViolation) notes.push("BRAND-FIT VIOLATION: recommended a category the creator explicitly refuses");

  // ---- commercial: pitches reference category & specifics, not pure template ----
  const pitch = `${profile.pitchDM} ${profile.pitchEmail}`.toLowerCase();
  const pitchSpecific = anyOf(pitch, anchors);
  const pitchCat = anyOf(pitch, lovedCats);
  const angles = profile.campaignAngles || [];
  let commercial =
    (angles.length >= 2 ? 30 : 10) +
    (pitchCat ? 25 : 0) +
    (pitchSpecific ? 30 : 0) +
    (profile.fitScore > 0 ? 15 : 0);
  commercial = clamp(commercial);
  if (!pitchSpecific) notes.push("pitch templates carry no persona-specific detail");

  // ---- creatorApproval (heuristic): would they say "yes that's me"? ----
  const approvalLine = ((profile as any).creatorApprovalLine || "").toLowerCase();
  let creatorApproval =
    anchorRatio * 45 +
    (replaceNamePass ? 25 : 0) +
    (genericPenalty ? 0 : 15) +
    (approvalLine && anyOf(approvalLine, anchors) ? 15 : 0);
  creatorApproval = clamp(creatorApproval);

  const dimensions: DimensionScores = {
    specificity,
    voiceFidelity,
    proofQuality,
    tension,
    antiValues,
    audiencePromise,
    brandFit,
    commercial,
    creatorApproval,
  };
  const overall = clamp(
    Object.values(dimensions).reduce((a, b) => a + b, 0) / Object.keys(dimensions).length
  );

  return {
    persona: persona.name,
    niche: persona.niche,
    engine,
    dimensions,
    overall,
    genericHits,
    replaceNamePass,
    hardNoViolation,
    anchorsHit: hit,
    anchorsMiss: miss,
    notes,
  };
}

export function aggregate(results: ScoreResult[]) {
  const keys = Object.keys(results[0].dimensions) as (keyof DimensionScores)[];
  const avg = (ns: number[]) => Math.round(ns.reduce((a, b) => a + b, 0) / ns.length);
  const dimAvg: Record<string, number> = {};
  for (const k of keys) dimAvg[k] = avg(results.map((r) => r.dimensions[k]));
  // Per-niche overall averages, to surface where the engine is weak.
  const byNiche: Record<string, number> = {};
  const nicheGroups = new Map<string, number[]>();
  for (const r of results) {
    if (!nicheGroups.has(r.niche)) nicheGroups.set(r.niche, []);
    nicheGroups.get(r.niche)!.push(r.overall);
  }
  for (const [n, arr] of nicheGroups) byNiche[n] = avg(arr);

  return {
    count: results.length,
    overall: avg(results.map((r) => r.overall)),
    dimensions: dimAvg,
    byNiche,
    genericTotal: results.reduce((a, r) => a + r.genericHits.length, 0),
    replaceNameFails: results.filter((r) => !r.replaceNamePass).length,
    hardNoViolations: results.filter((r) => r.hardNoViolation).length,
  };
}
