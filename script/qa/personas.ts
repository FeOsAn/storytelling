/**
 * Curated synthetic personas for the QA harness (script/qa/run.ts). Each persona
 * answers the real question bank (keyed by node id, with `${id}-fu` follow-ups) and
 * carries `expected` anchors the deterministic scorer (score.ts) checks for.
 */

export interface Persona {
  name: string;
  handle: string;
  email: string;
  niche: string;
  platforms: string[];
  audienceSize: string;
  /** Keyed by QUESTION_BANK node id, plus optional `${id}-fu` follow-up answers. */
  answers: Record<string, string>;
  expected: {
    summary: string;
    anchors: string[];
    lovedCats: string[];
    hardNos: string[];
  };
}

export const PERSONAS: Persona[] = [
  {
    name: "Priya Venkatraman",
    handle: "@priyagoeslong",
    email: "priya.v@example.com",
    niche: "endurance",
    platforms: ["Instagram", "Substack"],
    audienceSize: "10-50k",
    answers: {
      "origin-start":
        "I was an ICU nurse in Bristol for 16 years. I started running at 4:30am before shifts during the second COVID wave — not because I loved it but because it was the only hour nobody could page me.",
      "origin-start-fu":
        "I believed my worth was my usefulness. The 4:30am run gave me one hour a day where I wasn't useful to anyone and the world didn't end.",
      "origin-turn":
        "The low point was March 2021, signed off with acute stress reaction. A woman called Deb paced me through a 50k on the Jurassic Coast; I finished dead last and she waited at the line.",
      "audience-who":
        "A 46-year-old woman whose kids just became teenagers, who used to be the fit one. She trusts me because I never sell the 'strong not skinny' rebrand of diet culture.",
      "audience-who-fu":
        "I give them permission to be slow and to fuel properly. The thing I refuse is a goal time, because the women who chase a number get hurt and quit.",
      "values-line":
        "Endurance is a mental-health intervention dressed up as a sport, and the PB obsession harms the exact midlife women who need movement most. I refuse detox teas and weight-loss challenges.",
      "values-line-fu":
        "I preach the clock doesn't matter, then secretly check my own splits and feel sick when I'm slower than last year. I won't pretend I'm above it.",
      "proof-receipts":
        "I've coached 240 women through their first ultra over four years with a 92% finish rate. My Substack has 14,000 subscribers at a 58% open rate. I'm UESCA-certified and still a registered nurse.",
      "fit-love":
        "Love real-food fuelling brands, merino kit, GPS watches as tools, women's-health platforms doing real perimenopause science. Never weight-loss shakes, detox teas, or transformation challenges.",
    },
    expected: {
      summary:
        "A midlife endurance coach and ex-ICU nurse who frames endurance as a mental-health intervention and refuses PB-chasing diet culture.",
      anchors: ["icu nurse", "4:30am", "jurassic coast", "240 women", "92%", "uesca", "perimenopause", "deb"],
      lovedCats: ["real-food fuelling", "merino", "women's health", "gps"],
      hardNos: ["detox", "weight-loss", "transformation challenge"],
    },
  },
  {
    name: "Bradley Mott",
    handle: "@bigbradlifts",
    email: "brad.mott@example.com",
    niche: "strength",
    platforms: ["TikTok", "YouTube"],
    audienceSize: "50-250k",
    answers: {
      "origin-start":
        "I was a scaffolder in Gateshead since I was 17, knees and back wrecked by 22. Started lifting in my mate's garage gym on a rusty bar because I couldn't afford a proper one. My dad reckoned the gym was a waste of time.",
      "origin-turn":
        "Lowest point was slipping a disc on site; a doctor said I might not lift heavy again and I was on the sofa for three months getting depressed. I started filming my rehab on my phone and lads who'd done their backs started messaging.",
      "origin-turn-fu":
        "The part I leave out is I didn't tell my family I was depressed for months. Filming wasn't brave, it was the only way I could talk about it without saying it out loud.",
      "audience-who":
        "A 19-to-25 working-class lad, skint, who thinks the gym crowd online are all on gear and sponsorships. He trusts me because I lift in a manky garage and tell him when something hurts.",
      "values-line":
        "You don't need a £200-a-month gym or supplements to get strong; the industry preys on skint young lads. I turned down supplement money. I'll never be associated with SARMs, fat burners, or 'shred' programs.",
      "values-line-fu":
        "Where I contradict myself: I slag off supplement hype but still take creatine and whey, and I tell lads gear is a mug's game while half my heroes were obviously juiced. It's messy.",
      "proof-receipts":
        "I pulled a 280kg deadlift at 90kg bodyweight raw, no belt, on video. Coached 60 lads through my cheap garage program. My rehab series got 4.2 million views across TikTok and YouTube.",
      "fit-love":
        "Love cheap home-gym kit, basic creatine and whey that isn't marked up, work boots for lads on site, proper food. Never touching SARMs, fat burners, detox stuff, or dodgy transformation-challenge apps.",
    },
    expected: {
      summary:
        "A self-taught working-class powerlifter from Gateshead who rebuilt from a slipped disc on camera and refuses supplement-hype grifts.",
      anchors: ["scaffolder", "gateshead", "garage gym", "slipped disc", "280kg", "4.2 million", "creatine"],
      lovedCats: ["home gym", "creatine", "whey", "work boots"],
      hardNos: ["sarms", "fat burner", "transformation challenge"],
    },
  },
];
