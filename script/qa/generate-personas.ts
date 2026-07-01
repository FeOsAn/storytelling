/**
 * Procedural personas layered on top of the curated set, so `npm run qa` can scale
 * to N synthetic creators for uniqueness/regression testing. Kept deterministic
 * (seeded by index) so runs are repeatable.
 */

import type { Persona } from "./personas";

const NICHES = ["endurance", "strength", "wellness", "mobility", "hybrid"];
const CITIES = ["Leeds", "Cardiff", "Cork", "Dundee", "Hull", "Plymouth", "Derby", "Swansea"];
const LOVED = [
  ["real-food fuelling", "merino kit"],
  ["home gym", "creatine"],
  ["recovery tech", "sleep tracking"],
  ["natural-fibre apparel", "wearables"],
];
const HARDNOS = [
  ["detox", "weight-loss"],
  ["sarms", "fat burner"],
  ["transformation challenge", "waist trainer"],
];

export function generatePersonas(n: number): Persona[] {
  const out: Persona[] = [];
  for (let i = 0; i < Math.max(0, n); i++) {
    const niche = NICHES[i % NICHES.length];
    const city = CITIES[i % CITIES.length];
    const loved = LOVED[i % LOVED.length];
    const hardNos = HARDNOS[i % HARDNOS.length];
    const years = 3 + (i % 9);
    const clients = 40 + ((i * 7) % 200);
    const anchors = [city.toLowerCase(), `${clients}`, `${years} years`, niche];

    out.push({
      name: `Synthetic ${niche}-${i + 1}`,
      handle: `@syn_${niche}_${i + 1}`,
      email: `syn${i + 1}@example.com`,
      niche,
      platforms: ["Instagram"],
      audienceSize: ["1-10k", "10-50k", "50-250k"][i % 3],
      answers: {
        "origin-start": `I came to ${niche} from ${city} after ${years} years of a job that broke my body. The real part is I started because I was trying not to fall apart, not because I was an athlete.`,
        "origin-turn": `The turn came after an injury that nearly ended it; I documented my comeback and people from ${city} started following the honest, unglamorous version.`,
        "audience-who": `The person who DMs me at 11pm is a beginner who's been sold quick fixes and trusts me because I show the boring, sustainable ${niche} work.`,
        "values-line": `The hill I die on is that ${niche} shouldn't cost a fortune or shame anyone. I refuse ${hardNos.join(" and ")} no matter the offer.`,
        "proof-receipts": `I've coached ${clients} people over ${years} years and document real, non-viral results rather than before/after bodies.`,
        "fit-love": `I'd be proud to work with ${loved.join(" and ")}. I'd turn down ${hardNos.join(", ")} even for good money.`,
      },
      expected: {
        summary: `A ${niche} creator from ${city} who leads with honesty over hype.`,
        anchors,
        lovedCats: loved,
        hardNos,
      },
    });
  }
  return out;
}
