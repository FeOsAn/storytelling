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

const CATEGORY_RULES: { category: ClaimCategory; re: RegExp }[] = [
  { category: "revenue", re: /\b(revenue|\$|£|€|earn|earned|sales|paid|deal worth|contract)\b/i },
  { category: "audience metric", re: /\b(subscriber|subscribers|followers|list|open rate|email|dm)\b/i },
  { category: "media reach", re: /\b(views|impressions|reach|streams|downloads)\b/i },
  { category: "certification", re: /\b(certified|certification|qualified|registered|licen[cs]ed|accredit)\b/i },
  { category: "performance result", re: /\b(kg|lbs|pr\b|pb\b|deadlift|squat|marathon|ultra|finish|km|miles|race)\b/i },
  { category: "outcome claim", re: /\b(cured|off (?:their |the )?meds|antidepressant|lost .* stone|reversed|healed)\b/i },
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

/** Best-effort category for the *suggested* receipt type. See KNOWN LIMITATION above. */
export function categorize(text: string): ClaimCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.re.test(text)) return rule.category;
  }
  return "outcome claim";
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
