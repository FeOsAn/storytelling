/**
 * StoryFit synthetic-profile QA harness
 * =====================================
 * Drives the REAL backend protocol (the exact Express routes the React client
 * calls) for 10 synthetic personas, then scores the generated story profiles
 * for uniqueness. Repeatable: `npm run qa` (or `npm run qa -- --judge` to also
 * ask the LLM to role-play each creator and rate approval).
 *
 * Flow per persona (mirrors client/src/pages Apply → Intake → Profile):
 *   POST /api/applications      (consent-gated create)
 *   POST /api/intake/evaluate   (adaptive follow-up check, per answer)
 *   POST /api/intake            (persist transcript, incl. follow-up turns)
 *   POST /api/generate          (story profile — LLM if key, else deterministic)
 *   GET  /api/creators/:id      (confirm the profile a creator/brand would see)
 *
 * Uses a throwaway SQLite DB (STORYFIT_DB) so the real data.db is untouched.
 */

process.env.STORYFIT_DB = process.env.STORYFIT_DB || "/tmp/storyfit-qa.db";
process.env.NODE_ENV = "test";

import "dotenv/config";
import express from "express";
import { createServer, type Server } from "node:http";
import { writeFileSync, rmSync } from "node:fs";
import { registerRoutes } from "../../server/routes";
import { QUESTION_BANK, needsFollowUp } from "../../server/questions";
import { PERSONAS, type Persona } from "./personas";
import { generatePersonas } from "./generate-personas";
import { scoreProfile, aggregate, type ScoreResult } from "./score";
import type { StoryProfile } from "@shared/schema";

/** Parse `--flag=value` / `--flag value` ints from argv with a default. */
function intArg(flag: string, dflt: number): number {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1] && /^\d+$/.test(process.argv[i + 1])) return Number(process.argv[i + 1]);
  const eq = process.argv.find((a) => a.startsWith(`${flag}=`));
  if (eq) { const v = Number(eq.split("=")[1]); if (Number.isFinite(v)) return v; }
  return dflt;
}

/** Run async `worker` over `items` with a bounded concurrency pool. */
async function pool<T>(items: T[], limit: number, worker: (t: T, i: number) => Promise<void>) {
  let idx = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const cur = idx++;
      await worker(items[cur], cur);
    }
  });
  await Promise.all(runners);
}

const CONSENT = JSON.stringify({
  audioRecording: true,
  profileGeneration: true,
  storeProfile: true,
  brandSharing: true,
  futureMatching: true,
  productImprovement: true,
});

async function startServer(): Promise<{ server: Server; base: string }> {
  // fresh DB each run
  try {
    rmSync(process.env.STORYFIT_DB!, { force: true });
    rmSync(process.env.STORYFIT_DB! + "-wal", { force: true });
    rmSync(process.env.STORYFIT_DB! + "-shm", { force: true });
  } catch {}
  const app = express();
  app.use(express.json());
  const server = createServer(app);
  await registerRoutes(server, app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  return { server, base: `http://127.0.0.1:${port}` };
}

async function api(base: string, path: string, body?: unknown) {
  const res = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text };
  }
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${text.slice(0, 200)}`);
  return json;
}

async function runPersona(base: string, p: Persona) {
  // 1) application + consent
  const created = await api(base, "/api/applications", {
    name: p.name,
    handle: p.handle,
    email: p.email,
    niche: p.niche,
    platforms: JSON.stringify(p.platforms),
    audienceSize: p.audienceSize,
    consentJson: CONSENT,
  });
  const id: string = created.id;

  // 2) adaptive intake — answer each question, append a follow-up turn when the
  //    real /api/intake/evaluate endpoint says the answer is thin.
  const turns: { stage: string; question: string; answer: string; source: "text" }[] = [];
  let followUpsTriggered = 0;
  for (const node of QUESTION_BANK) {
    const answer = p.answers[node.id];
    if (!answer) continue;
    turns.push({ stage: node.stage, question: node.prompt, answer, source: "text" });
    const evalRes = await api(base, "/api/intake/evaluate", { answer });
    if (evalRes.needsFollowUp) {
      followUpsTriggered++;
      const fu = p.answers[`${node.id}-fu`];
      if (fu && node.followUps[0]) {
        turns.push({ stage: node.stage, question: node.followUps[0], answer: fu, source: "text" });
      }
    }
  }
  await api(base, "/api/intake", { creatorId: id, turns });

  // 3) generate
  await api(base, "/api/generate", { creatorId: id });

  // 4) read back exactly what a creator/brand would see
  const full = await api(base, `/api/creators/${id}`);
  return {
    id,
    engine: full.engine as string,
    profile: full.profile as StoryProfile,
    followUpsTriggered,
  };
}

/** Optional: LLM role-plays the creator and rates "yes that's me" 1–5. */
async function judgeApproval(p: Persona, profile: StoryProfile): Promise<{ score: number; why: string } | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();
    const card = `POSITIONING: ${profile.positioningLine}
ARCHETYPE: ${profile.archetype}
ORIGIN: ${profile.originStory}
VALUES: ${(profile.values || []).join("; ")}
TENSIONS: ${(profile.tensions || []).join("; ")}
BIO: ${profile.profileBio}
APPROVAL LINE: ${(profile as any).creatorApprovalLine || "(none)"}`;
    const msg: any = await client.messages.create({
      model: process.env.STORYFIT_ANTHROPIC_MODEL || "claude_sonnet_4_6",
      max_tokens: 200,
      system:
        "You role-play a real creator reviewing an AI-written story profile of yourself. Be a tough, proud critic. Reply ONLY as compact JSON: {\"score\":1-5,\"why\":\"<=20 words\"}. 5 = 'yes, that's exactly me'; 1 = 'generic, could be anyone'.",
      messages: [
        {
          role: "user",
          content: `You are ${p.expected.summary}\n\nHere is the profile written about you:\n${card}\n\nWould you approve it as truly you?`,
        },
      ],
    });
    const text = msg.content.map((b: any) => (b.type === "text" ? b.text : "")).join("");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const obj = JSON.parse(m[0]);
    return { score: Number(obj.score), why: String(obj.why || "") };
  } catch (e) {
    return null;
  }
}

function bar(n: number): string {
  const filled = Math.round((n / 100) * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

async function main() {
  const withJudge = process.argv.includes("--judge");
  const curatedOnly = process.argv.includes("--curated");
  const scale = intArg("--scale", 90); // procedural personas added on top of curated
  const concurrency = intArg("--concurrency", 12);
  const judgeSample = intArg("--judge-sample", 12); // cap LLM judge calls for cost

  const personas: Persona[] = curatedOnly ? PERSONAS : [...PERSONAS, ...generatePersonas(scale)];

  const { server, base } = await startServer();
  const results: ScoreResult[] = [];
  const judgeScores: number[] = [];
  const perPersonaJudge: Record<string, { score: number; why: string }> = {};
  let engineSeen = "";
  let judgedSoFar = 0;
  const verbose = personas.length <= 20; // per-persona lines only for small runs

  console.log(`\nStoryFit synthetic QA — ${personas.length} personas through the live API (${base})`);
  console.log(
    `(pool concurrency=${concurrency}${withJudge ? `, LLM approval judge on first ${judgeSample}` : ""})\n`
  );

  let done = 0;
  await pool(personas, concurrency, async (p) => {
    try {
      const { engine, profile, followUpsTriggered } = await runPersona(base, p);
      engineSeen = engine;
      const score = scoreProfile(p, profile, engine);
      results.push(score);
      let judgeStr = "";
      if (withJudge && judgedSoFar < judgeSample) {
        judgedSoFar++;
        const j = await judgeApproval(p, profile);
        if (j) {
          judgeScores.push(j.score);
          perPersonaJudge[p.name] = j;
          judgeStr = `  judge=${j.score}/5`;
        }
      }
      done++;
      if (verbose) {
        console.log(
          `  • ${p.name.padEnd(20)} ${engine.padEnd(14)} overall=${String(score.overall).padStart(
            3
          )} ${bar(score.overall)}  fu=${followUpsTriggered}${judgeStr}`
        );
      } else if (done % 20 === 0) {
        console.log(`  …${done}/${personas.length} generated & scored`);
      }
    } catch (e: any) {
      console.log(`  • ${p.name.padEnd(20)} FAILED: ${e.message}`);
    }
  });
  results.sort((a, b) => a.persona.localeCompare(b.persona));

  server.close();

  if (!results.length) {
    console.error("\nNo results — aborting.");
    process.exit(1);
  }

  const agg = aggregate(results);
  console.log(`\n  ── Aggregate (engine: ${engineSeen}) ───────────────────────────`);
  for (const [k, v] of Object.entries(agg.dimensions)) {
    console.log(`    ${k.padEnd(16)} ${String(v).padStart(3)}  ${bar(v)}`);
  }
  console.log(`    ${"OVERALL".padEnd(16)} ${String(agg.overall).padStart(3)}  ${bar(agg.overall)}`);
  console.log(
    `\n    generic-phrase hits: ${agg.genericTotal}   replace-name fails: ${agg.replaceNameFails}/${results.length}   hard-no violations: ${agg.hardNoViolations}/${results.length}`
  );
  const nicheLine = Object.entries(agg.byNiche)
    .sort((a, b) => a[1] - b[1])
    .map(([n, v]) => `${n} ${v}`)
    .join("  ·  ");
  console.log(`    by niche (overall): ${nicheLine}`);
  if (judgeScores.length) {
    const avg = (judgeScores.reduce((a, b) => a + b, 0) / judgeScores.length).toFixed(2);
    console.log(`    LLM creator-approval (avg of ${judgeScores.length}): ${avg}/5`);
  }

  // weakest dimensions
  const weak = Object.entries(agg.dimensions)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([k, v]) => `${k} (${v})`);
  console.log(`\n    weakest dimensions: ${weak.join(", ")}`);

  const report = {
    generatedAt: new Date().toISOString(),
    engine: engineSeen,
    aggregate: agg,
    judge: judgeScores.length
      ? { avg: judgeScores.reduce((a, b) => a + b, 0) / judgeScores.length, perPersona: perPersonaJudge }
      : null,
    results,
  };
  const out = new URL("./last-report.json", import.meta.url).pathname;
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`\n  Full report → ${out}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
