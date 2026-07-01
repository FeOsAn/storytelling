/**
 * Two-persona qualitative simulation against the LIVE backend (port 5001).
 * Drives the exact product protocol: application -> per-question evaluate ->
 * followup (pushback) -> intake -> generate -> GET creator. Captures the exact
 * script question text, our answer, the follow-up the bot returned (+reason),
 * our follow-up answer, and the full generated profile. Prints JSON we can pour
 * straight into a report. Does NOT touch the throwaway eval DB — it uses the
 * real running server, so it exercises the same data path a real user hits.
 */
const BASE = process.env.SIM_BASE || "http://127.0.0.1:5001";

const CONSENT = JSON.stringify({
  audioRecording: true, profileGeneration: true, storeProfile: true,
  brandSharing: true, futureMatching: true, productImprovement: true,
});

type Persona = {
  label: string;
  name: string; handle: string; email: string; niche: string;
  platforms: string[]; audienceSize: string;
  answers: Record<string, string>;
  followUpAnswers: Record<string, string>;
};

const PERSONAS: Persona[] = [
  {
    label: "Endurance — midlife ultrarunning coach (articulate, clean answers)",
    name: "Priya Venkatraman", handle: "@priyagoeslong",
    email: "priya.v@example.com", niche: "endurance",
    platforms: ["Instagram", "Substack"], audienceSize: "10–50k",
    answers: {
      "origin-start":
        "I was an ICU nurse in Bristol for 16 years, and the thing I actually lived through is the second COVID wave in the winter of 2020 — I proned patients for 12-hour shifts and lost count of how many died holding an iPad instead of a hand. I started running at 4:30am before shifts not because I loved it but because it was the only hour nobody could page me. The first 'run' was a shuffle to the end of my road and back, and I cried in the doorway. That's the real part — I didn't come to endurance as an athlete, I came to it as someone trying not to break.",
      "origin-turn":
        "The low point was March 2021. I was signed off work with what they called 'acute stress reaction' and I genuinely thought I was done as a person, not just a nurse. I'd lost two stone, wasn't sleeping, and I almost handed in my NMC registration. What pulled me through was signing up for a 50k on the Jurassic Coast that I had no business attempting — a woman called Deb in a Facebook group I'd never met offered to pace me. I finished in just under nine hours, dead last, and Deb waited at the line. I realised the finishing wasn't the point, the not-quitting was.",
      "audience-who":
        "The person who DMs me at 11pm is a 46-year-old woman whose kids have just become teenagers, who used to be 'the fit one' and now can't recognise her own body or energy. She's not training for a podium, she's training to feel like she still owns her life. She trusts me because I never sell her the 'strong not skinny' rebrand of the same diet culture — I talk about perimenopause, fuelling, and walking the uphills without shame. The thing she asks me for that I refuse to give is a plan that promises a specific finish time, because I won't sell certainty I can't control.",
      "values-line":
        "The hill I'll die on is that endurance is a mental-health intervention dressed up as a sport, and the industry's obsession with PBs and Strava segments actively harms the exact midlife women who need movement most. I say it even when race brands stop inviting me, and they have. I refuse to ever be associated with weight-loss challenges, 'detox' supplements, or any coach who shames people for walking.",
      "proof-receipts":
        "The receipts: I've coached 240 women through their first ultra over four years, with a 92% finish rate, and only one serious injury in that group. My Substack 'Going Long' has 14,000 subscribers and a 58% open rate. I'm a UESCA-certified ultrarunning coach and still a registered nurse. The number I'm proudest of is that 31 of those women have told me they came off antidepressants with their GP's support after a year of training — I don't claim I did that, but I was in the room.",
      "fit-love":
        "Love: real-food fuelling brands, merino and natural-fibre kit I actually run in, GPS watches used as tools not status symbols, and women's-health platforms doing real perimenopause science. Never: weight-loss shakes, 'detox' teas, waist trainers, or any 'transformation challenge' that puts a before/after body on the feed.",
    },
    followUpAnswers: {
      // filled at runtime only if the bot pushes back; we answer thoughtfully.
      "origin-start":
        "Before that winter I believed my worth was my usefulness — that if I wasn't saving someone I was nothing. I don't believe that anymore. The 4:30am run gave me one hour a day where I wasn't useful to anyone and the world didn't end.",
      "audience-who":
        "I give them permission to be slow and to fuel properly — the big accounts sell them shrinking, I sell them durability. The thing I refuse is a goal time, because the women who chase a number are the ones who get hurt and quit.",
      "values-line":
        "Where I contradict myself: I preach that the clock doesn't matter, and then I still secretly check my own splits on every long run and feel a little sick when I'm slower than last year. I won't pretend I'm above the thing I warn them about.",
      "proof-receipts":
        "The result I can't put a number on: a woman in my second cohort, Frances, told me the only reason she got out of bed the year her husband left was that she'd promised the group she'd do the Sunday long run. The run was the scaffolding when everything else collapsed.",
    },
  },
  {
    label: "Strength — young self-taught powerlifter (intentionally rough/casual answers)",
    name: "Bradley Mott", handle: "@bigbradlifts",
    email: "brad.mott@example.com", niche: "strength",
    platforms: ["TikTok", "YouTube"], audienceSize: "50–250k",
    answers: {
      // Deliberately slangy/casual: tbh, cuz, gonna, innit, loads, n, em, lowercase i, filler.
      "origin-start":
        "honestly i was a scaffolder in gateshead since i was 17, knees n back wrecked by 22 tbh. started liftin in me mate's garage gym cuz i couldnt afford a proper one, just a rusty bar n some bumper plates n a bench held together with duct tape. weren't no transformation thing, i was just angry n skint n it was the one place i felt like i wasnt failin innit. me dad reckoned the gym were a waste of time, that stuck with me.",
      "origin-turn":
        "lowest point were when i slipped a disc on site lifting a board wrong, doctor said i might not lift heavy again n i nearly packed it all in, was on the sofa for like 3 month gettin proper depressed. what pulled us through were i started filmin me rehab on me phone, dead basic, just tryna get back to a bodyweight squat, n loads of lads my age who'd also done their backs started messagin sayin it helped. gave us a reason to get up.",
      "audience-who":
        "person dmin me at 11pm is a 19 to 25 lad, working class, prob a labourer or warehouse, skint, thinks the gym lot online are all on gear n protein sponsorships n nowt to do with him. he trusts us cuz i lift in a manky garage not a fancy gym n i tell him when summat hurts me. thing he asks for that i wont give is a 'get big in 6 weeks' program cuz thats a lie n i wont sell lies to skint lads.",
      "values-line":
        "hill i die on is you dont need a 200 quid a month gym or supplements to get strong, the industry preys on skint young lads sellin em status they cant afford. i say it even tho supplement brands have offered us decent money n i turned em down. i'll never be associated with sarms, fat burners, or them 'shred' programs that are basically eating disorders for blokes.",
      "proof-receipts":
        "receipts — i pulled a 280kg deadlift at 90kg bodyweight raw, got that on video, no belt. coached like 60 lads online through me cheap garage program, most of em never touched a barbell before. me rehab series got 4.2 million views across tiktok n youtube. proudest number is i went from a slipped disc n cant-walk to a 280 pull, documented every step, didnt skip the rubbish bits.",
      "fit-love":
        "love: cheap home gym kit, basic creatine n whey that aint marked up stupid, work boots n gear for lads on site, proper food not powders. never touchin sarms, fat burners, detox stuff, or them dodgy 'transformation challenge' apps that charge skint kids subscriptions.",
    },
    followUpAnswers: {
      "origin-start":
        "before that i believed i were thick n that lads like me from estates just end up broken by 40, that the only thing me body were good for were graft. dont believe that no more — i rebuilt me own back when a doctor wrote us off.",
      "origin-turn":
        "part i leave out is i didnt tell me family i were depressed for months, i just said me back hurt. the filmin weren't brave, it were the only way i could talk about it without actually havin to say it out loud.",
      "audience-who":
        "i give em honesty about what hurts n what i cant afford — the big accounts wont admit they get comped gear n coaches, i show the duct tape on me bench. wont give em a magic 6 week plan cuz it dont exist.",
      "values-line":
        "where i contradict meself — i slag off supplement hype but i still take creatine n whey n bang on about em, n i tell lads gear is a mugs game but half me heroes growin up were obviously juiced n i still respect their lifts. its messy, i aint gonna pretend it aint.",
      "proof-receipts":
        "result i cant put a number on — a lad messaged sayin watchin me rehab were the only reason he didnt quit after his own back went, said it stopped him doin summat daft to himself. that one sat with us.",
      "fit-love":
        "unlimited budget collab i'd be proud of — kit out a proper free community garage gym on me old estate in gateshead with cheap basic equipment, no membership, n film lads usin it. that'd mean more than any sponsorship.",
    },
  },
];

async function api(path: string, body?: unknown) {
  const res = await fetch(BASE + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any; try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${text.slice(0, 300)}`);
  return json;
}

async function runPersona(p: Persona) {
  const script = (await api("/api/intake/script")).questions as any[];
  const created = await api("/api/applications", {
    name: p.name, handle: p.handle, email: p.email, niche: p.niche,
    platforms: JSON.stringify(p.platforms), audienceSize: p.audienceSize, consentJson: CONSENT,
  });
  const id: string = created.id;
  const turns: any[] = [];
  const transcript: any[] = [];

  for (const node of script) {
    const answer = p.answers[node.id];
    if (!answer) continue;
    const rec: any = { id: node.id, stage: node.stage, chapter: node.chapter, question: node.prompt, answer };
    turns.push({ stage: node.stage, question: node.prompt, answer, source: "text" });

    const evalRes = await api("/api/intake/evaluate", { answer });
    rec.needsFollowUp = !!evalRes.needsFollowUp;
    if (evalRes.needsFollowUp) {
      const fu = await api("/api/intake/followup", { questionId: node.id, answer, name: p.name, niche: p.niche });
      rec.followUpReason = fu.reason;
      rec.followUpQuestion = fu.followUp;
      const fuAns = p.followUpAnswers[node.id];
      rec.followUpAnswer = fuAns || null;
      if (fuAns) turns.push({ stage: node.stage, question: fu.followUp, answer: fuAns, source: "text" });
    }
    transcript.push(rec);
  }

  await api("/api/intake", { creatorId: id, turns });
  await api("/api/generate", { creatorId: id });
  const full = await api(`/api/creators/${id}`);
  return { id, engine: full.engine, profile: full.profile, transcript };
}

async function main() {
  const out: any = { base: BASE, health: await api("/api/health"), personas: [] };
  for (const p of PERSONAS) {
    try {
      const r = await runPersona(p);
      const blob = JSON.stringify(r.profile).toLowerCase();
      const leakTokens = ["cuz", " innit", " tbh", " n ", " em ", "gonna", " me dad", " me back", " us ", "honestly i", "liftin", "filmin", " aint ", " nowt ", " summat ", " skint "];
      const leaks = leakTokens.filter((t) => blob.includes(t));
      out.personas.push({ label: p.label, name: p.name, handle: p.handle, niche: p.niche,
        audienceSize: p.audienceSize, platforms: p.platforms, ...r, leaks });
    } catch (e: any) {
      out.personas.push({ label: p.label, name: p.name, error: e.message });
    }
  }
  console.log(JSON.stringify(out, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
