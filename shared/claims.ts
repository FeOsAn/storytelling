/**
 * Big-claim heuristics — dependency-free so both the server (deferred-receipts
 * detection) and the client (gentle toast) can import it.
 *
 * KNOWN LIMITATION (see handoff §5): the category label is order-dependent — a
 * reach/revenue number can be labelled "performance result". The deferral trigger
 * (`isBigClaim`) is correct in every case; only the *suggested* receipt type can be
 * mislabelled. Roadmap #3 fixes the ordering.
 */

export type ClaimCategory =
  | "audience metric"
  | "revenue"
  | "performance result"
  | "certification"
  | "media reach"
  | "outcome claim";

export interface BigClaim {
  text: string;
  category: ClaimCategory;
}

const NUMBER_RE = /(\d[\d,.]*)\s*(k|m|thousand|million|%|percent)?/gi;

/**
 * Category signals. `priority` is a specificity tiebreak (lower = wins ties): rarer,
 * more-specific signals (an outcome, a certification) beat broad ones (a "finish"/"race"
 * word) so a revenue/reach number isn't mislabelled a "performance result" (roadmap #3).
 */
const CATEGORY_RULES: { category: ClaimCategory; re: RegExp; priority: number }[] = [
  { category: "outcome claim", priority: 0, re: /\b(cured|off (?:their |the )?meds|antidepressant|lost .* stone|reversed|healed)\b/i },
  { category: "certification", priority: 1, re: /\b(certified|certification|qualified|registered|licen[cs]ed|accredit)\b/i },
  { category: "revenue", priority: 2, re: /\b(revenue|\$|£|€|earn|earned|sales|paid|deal worth|contract)\b/i },
  { category: "audience metric", priority: 3, re: /\b(subscriber|subscribers|followers|list|open rate|email|dm)\b/i },
  { category: "media reach", priority: 4, re: /\b(views|impressions|reach|streams|downloads)\b/i },
  { category: "performance result", priority: 5, re: /\b(kg|lbs|pr\b|pb\b|deadlift|squat|marathon|ultra|finish|km|miles|race)\b/i },
];

/** True when an answer contains a sizeable, verifiable-sounding claim. */
export function isBigClaim(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  // A number paired with any commercial/outcome noun, or an explicit outcome claim.
  const hasBigNumber = /\b(\d{3,}|\d[\d,.]*\s*(k|m|thousand|million)|\d+\s*(%|percent))\b/i.test(lower);
  const outcome = CATEGORY_RULES.some((r) => r.category === "outcome claim" && r.re.test(lower));
  const commercialNoun = CATEGORY_RULES.some(
    (r) => r.category !== "outcome claim" && r.re.test(lower),
  );
  return outcome || (hasBigNumber && commercialNoun);
}

/**
 * Category for the *suggested* receipt type. Picks the category with the most
 * keyword hits (the dominant signal), not the first rule in the list — so ordering
 * no longer decides the label. Ties break toward the more specific category.
 */
export function categorize(text: string): ClaimCategory {
  const lower = (text || "").toLowerCase();
  let best: (typeof CATEGORY_RULES)[number] | null = null;
  let bestScore = 0;
  for (const rule of CATEGORY_RULES) {
    // Clone with a global flag to count occurrences without mutating rule.re's state.
    const hits = lower.match(new RegExp(rule.re.source, "gi"));
    const score = hits ? hits.length : 0;
    if (score === 0) continue;
    if (score > bestScore || (score === bestScore && best !== null && rule.priority < best.priority)) {
      best = rule;
      bestScore = score;
    }
  }
  return best ? best.category : "outcome claim";
}

/** Extract the sentence-ish fragments that trip the big-claim detector. */
export function extractBigClaims(text: string): BigClaim[] {
  if (!text) return [];
  const fragments = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const claims: BigClaim[] = [];
  for (const frag of fragments) {
    if (isBigClaim(frag)) {
      claims.push({ text: frag, category: categorize(frag) });
    }
  }
  // If the whole answer trips it but no single fragment did (claim split across
  // sentences), surface the whole thing once.
  if (claims.length === 0 && isBigClaim(text)) {
    claims.push({ text: text.trim(), category: categorize(text) });
  }
  return claims;
}

export function hasNumbers(text: string): boolean {
  NUMBER_RE.lastIndex = 0;
  return NUMBER_RE.test(text || "");
}
