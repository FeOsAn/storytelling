/**
 * The interview: a small, fixed question bank across three chapters
 * (Foundation → Edge → Proof & Fit), plus the adaptive layer that hunts for the
 * creator's lived contradiction (the "edge").
 *
 * `evaluateAnswer` / `needsFollowUp` decide when an answer is thin/generic/polished
 * enough to earn a sharper probe. `generateFollowUpSmart` and `inferEdgeSmart` use
 * the LLM when available and fall back to deterministic logic otherwise.
 */

import { complete, extractJson } from "./llm";
import type { IntakeTurn } from "@shared/schema";

export interface QuestionNode {
  id: string;
  stage: string; // Origin | Audience | Values | Proof | Commercial Fit | Review
  chapter: string; // Foundation | Edge | Proof & Fit
  prompt: string;
  followUps: string[];
}

export const QUESTION_BANK: QuestionNode[] = [
  {
    id: "origin-start",
    stage: "Origin",
    chapter: "Foundation",
    prompt:
      "Take me back to before the firm existed. What were you actually living through when you decided to start it — not the About-page version, the real part?",
    followUps: [
      "What did you believe about yourself back then that you don't believe now?",
      "What's the part of the founding story you leave off the website?",
    ],
  },
  {
    id: "origin-turn",
    stage: "Origin",
    chapter: "Foundation",
    prompt:
      "What was the lowest point — the client, the quarter, the moment it nearly went the other way? What pulled you through?",
    followUps: [
      "What did that cost you that clients never see?",
      "Who was in the room when it turned, and why did that matter?",
    ],
  },
  {
    id: "audience-who",
    stage: "Audience",
    chapter: "Foundation",
    prompt:
      "Picture the client who calls you at 9pm in a panic. Who are they, and what do they trust you with that they trust nobody else with?",
    followUps: [
      "What do you give them that the big firms won't?",
      "What do they ask for that you refuse to sell them?",
    ],
  },
  {
    id: "values-line",
    stage: "Values",
    chapter: "Edge",
    prompt:
      "What's the hill this firm dies on — the advice you give even when it costs you the engagement? And what work will you never take?",
    followUps: [
      "Where do you contradict yourselves on this — the part that's messy and true?",
      "When did holding that line actually cost you revenue?",
    ],
  },
  {
    id: "proof-receipts",
    stage: "Proof",
    chapter: "Proof & Fit",
    prompt:
      "What are the receipts — outcomes, numbers, names you can use, credentials? The concrete things that prove this isn't marketing.",
    followUps: [
      "Which result are you proudest of that you can't put a number on?",
      "What's the one claim here you'd want a prospect to be able to verify?",
    ],
  },
  {
    id: "fit-love",
    stage: "Commercial Fit",
    chapter: "Proof & Fit",
    prompt:
      "Describe the client you'd be genuinely proud to win — and the engagement you'd turn down even at full rate.",
    followUps: [
      "If fees were no object, what work would you do more of?",
      "What kind of client would you never take, no matter the money?",
    ],
  },
];

export function getQuestion(id: string): QuestionNode | undefined {
  return QUESTION_BANK.find((q) => q.id === id);
}

/* ---------------------------------------------------------------------------
 * Answer evaluation — is this thin / generic / polished enough to probe?
 * ------------------------------------------------------------------------- */

const GENERIC_MARKERS = [
  // creator fluff
  "passionate about",
  "passion for",
  "authentic",
  "my journey",
  "help people",
  "living my best life",
  "grind",
  "no excuses",
  "believe in yourself",
  "hard work pays off",
  // B2B corporate fluff
  "operational excellence",
  "commitment to excellence",
  "best-in-class",
  "world-class",
  "synergies",
  "value creation",
  "bespoke solutions",
  "bespoke strategic",
  "results-driven",
  "client-centric",
  "customer-centric",
  "cutting-edge",
  "thought leader",
  "trusted partner",
  "holistic approach",
  "proven methodolog",
  "transformational guidance",
  "unwavering",
];

const DODGE_MARKERS = [
  "rather not",
  "prefer not",
  "no comment",
  "not going there",
  "don't want to talk",
  "not comfortable",
  "keep that private",
  "pass on that",
  "next question",
  "i'd skip",
  "nothing comes to mind",
  "not sure",
  "dunno",
];

export interface Evaluation {
  needsFollowUp: boolean;
  reason: string;
  thin: boolean;
  generic: boolean;
  polished: boolean;
  dodge: boolean;
}

export function evaluateAnswer(answer: string): Evaluation {
  const text = (answer || "").trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const lower = text.toLowerCase();

  const thin = words < 25;
  const generic = GENERIC_MARKERS.some((m) => lower.includes(m));
  const dodge = words < 40 && DODGE_MARKERS.some((m) => lower.includes(m));
  // "Polished" = long and fluent but with no roughness/contradiction signal.
  const hasRough = /\bbut\b|\bexcept\b|\bcontradict|\bmessy\b|\bashamed\b|\bhid\b|\bsecret|honestly|the truth is/i.test(
    text,
  );
  const polished = words >= 60 && !hasRough;

  const needsFollowUp = thin || generic || polished || dodge;
  let reason = "";
  if (dodge) reason = "The creator is deflecting — probe gently for the specific.";
  else if (thin) reason = "Answer is thin; ask for the concrete lived detail.";
  else if (generic) reason = "Answer leans on generic language; push for what only they can say.";
  else if (polished) reason = "Answer is polished but frictionless; hunt for the contradiction.";
  else reason = "Answer is specific enough.";

  return { needsFollowUp, reason, thin, generic, polished, dodge };
}

/** Back-compat convenience used by the QA harness. */
export function needsFollowUp(answer: string): boolean {
  return evaluateAnswer(answer).needsFollowUp;
}

/* ---------------------------------------------------------------------------
 * Adaptive follow-up (contradiction hunt)
 * ------------------------------------------------------------------------- */

export async function generateFollowUpSmart(input: {
  questionId: string;
  answer: string;
  name?: string;
  niche?: string;
}): Promise<{ followUp: string; reason: string }> {
  const node = getQuestion(input.questionId);
  const evaln = evaluateAnswer(input.answer);
  const deterministic = node?.followUps[0] || "What's the part of that you usually don't say out loud?";

  const llm = await complete({
    system:
      "You are a sharp, warm narrative interviewer for founders and expert firms. Given an answer, ask ONE short follow-up (max 25 words) that surfaces the uncomfortable, specific contradiction they live — the 'part they don't put on the website'. Never generic. Reply ONLY as JSON: {\"followUp\":\"...\"}.",
    user: `Question: ${node?.prompt || input.questionId}\nFounder: ${input.name || "founder"} (${input.niche || "expert firm"})\nAnswer: ${input.answer}\nWhy we probe: ${evaln.reason}`,
    maxTokens: 200,
  });
  const parsed = extractJson<{ followUp: string }>(llm);
  return {
    followUp: parsed?.followUp?.trim() || deterministic,
    reason: evaln.reason,
  };
}

/* ---------------------------------------------------------------------------
 * Live edge confirmation — reflect a one-sentence edge hypothesis
 * ------------------------------------------------------------------------- */

export async function inferEdgeSmart(turns: IntakeTurn[]): Promise<{ edge: string }> {
  const transcript = turns
    .map((t) => `Q: ${t.question}\nA: ${t.answer}`)
    .join("\n\n");

  const llm = await complete({
    system:
      "You extract a firm's EDGE: the single lived contradiction that makes them hard to copy and worth recommending. Reflect it back in ONE sentence the founder can own, refine, or reject. Be specific to their words. Reply ONLY as JSON: {\"edge\":\"...\"}.",
    user: transcript,
    maxTokens: 200,
  });
  const parsed = extractJson<{ edge: string }>(llm);
  if (parsed?.edge?.trim()) return { edge: parsed.edge.trim() };

  return { edge: inferEdgeDeterministic(turns) };
}

function inferEdgeDeterministic(turns: IntakeTurn[]): string {
  // Prefer the values/edge chapter answer, then origin.
  const values = turns.find((t) => /values/i.test(t.stage))?.answer;
  const origin = turns.find((t) => /origin/i.test(t.stage))?.answer;
  const seed = (values || origin || turns[0]?.answer || "").trim();
  const firstSentence = seed.split(/(?<=[.!?])\s+/)[0] || seed;
  return firstSentence
    ? `Your edge looks like this: ${firstSentence.replace(/\.$/, "")} — a line you hold even when it costs you.`
    : "Your edge is the contradiction you live but rarely say out loud.";
}

/* ---------------------------------------------------------------------------
 * Roadmap #1 — repeated probe-dodge detection → low-specificity flag
 * ------------------------------------------------------------------------- */

export interface SpecificityAssessment {
  lowSpecificity: boolean;
  dodgeCount: number;
  note?: string;
}

/**
 * Looks across the whole transcript: counts dodged/thin/generic answers and flags
 * "low specificity" when the creator repeatedly avoided the specific. This is a
 * gentle operator-facing signal, not a mid-flow gate.
 */
export function assessSpecificity(turns: IntakeTurn[]): SpecificityAssessment {
  const primary = turns.filter((t) => t.kind !== "edge" && t.kind !== "review");
  let dodgeCount = 0;
  let weakCount = 0;
  for (const t of primary) {
    const e = evaluateAnswer(t.answer);
    if (e.dodge) dodgeCount++;
    if (e.thin || e.generic || e.dodge) weakCount++;
  }
  const total = Math.max(primary.length, 1);
  const weakRatio = weakCount / total;
  const lowSpecificity = dodgeCount >= 2 || weakRatio >= 0.5;
  return {
    lowSpecificity,
    dodgeCount,
    note: lowSpecificity
      ? `Creator gave ${dodgeCount} deflecting and ${weakCount}/${total} low-specificity answers — the profile will read generic until they share concrete lived detail.`
      : undefined,
  };
}
