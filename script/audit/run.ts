/**
 * Cited — share-of-answer audit runner (v0)
 * ==========================================
 * Measures how often named firms are recommended in AI answers to buyer
 * queries, with the frequency-across-runs methodology from /methodology:
 * every query runs N times per engine, and we report mention frequencies —
 * never a single lucky screenshot.
 *
 * Engines: Claude (ANTHROPIC_API_KEY) and OpenAI (OPENAI_API_KEY) via API.
 *
 * HONESTY CAVEAT (also stated on the public methodology page): API responses
 * approximate but do not equal what buyers see in the consumer apps — search
 * grounding and product layers differ. Use this runner for cheap, frequent
 * baseline/tracking runs; client audit *deliverables* are run manually in the
 * consumer products themselves.
 *
 * Usage:
 *   npm run audit                                  # uses queries.example.json
 *   npm run audit -- path/to/your-config.json
 *
 * Config: { "queries": string[], "firms": string[], "runs": number }
 * Output: markdown table to stdout + full raw answers in last-audit.json
 * (keep the JSON — it's the receipt behind every number you publish).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

interface Config {
  queries: string[];
  firms: string[];
  runs?: number;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const cfgPath = process.argv[2] || path.join(here, "queries.example.json");
const cfg: Config = JSON.parse(readFileSync(cfgPath, "utf-8"));
const RUNS = cfg.runs ?? 3;

const SYSTEM =
  "You are helping a buyer choose a firm to hire. Answer with your top 3 recommended firms by name, each with a one-line reason. If you don't know specific real firms for this query, say so plainly instead of inventing names.";

const ANTHROPIC_MODEL = process.env.STORYFIT_ANTHROPIC_MODEL || "claude-sonnet-5";
const OPENAI_MODEL = process.env.STORYFIT_OPENAI_MODEL || "gpt-4o-mini";

type Ask = (query: string) => Promise<string | null>;

async function claudeAsk(): Promise<Ask | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  return async (query) => {
    try {
      const msg: any = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 500,
        system: SYSTEM,
        messages: [{ role: "user", content: query }],
      });
      return msg.content.map((b: any) => (b.type === "text" ? b.text : "")).join("") || null;
    } catch (e) {
      console.error(`  ! claude error: ${(e as Error).message.slice(0, 120)}`);
      return null;
    }
  };
}

async function openaiAsk(): Promise<Ask | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI();
  return async (query) => {
    try {
      const res = await client.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: 500,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: query },
        ],
      });
      return res.choices?.[0]?.message?.content || null;
    } catch (e) {
      console.error(`  ! openai error: ${(e as Error).message.slice(0, 120)}`);
      return null;
    }
  };
}

/** A firm counts as mentioned when its name appears as a word in the answer. */
function mentioned(text: string, firm: string): boolean {
  const escaped = firm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

interface RunRecord {
  engine: string;
  query: string;
  run: number;
  answer: string | null;
  mentions: string[];
}

async function main() {
  const engines: { name: string; ask: Ask }[] = [];
  const c = await claudeAsk();
  if (c) engines.push({ name: `claude (${ANTHROPIC_MODEL})`, ask: c });
  const o = await openaiAsk();
  if (o) engines.push({ name: `openai (${OPENAI_MODEL})`, ask: o });

  if (engines.length === 0) {
    console.error("No API keys set (ANTHROPIC_API_KEY / OPENAI_API_KEY) — nothing to measure.");
    process.exit(1);
  }

  const total = engines.length * cfg.queries.length * RUNS;
  console.log(
    `\nCited audit runner — ${cfg.queries.length} queries × ${RUNS} runs × ${engines.length} engine(s) = ${total} answers`,
  );
  console.log(`Firms tracked: ${cfg.firms.join(", ")}\n`);

  const records: RunRecord[] = [];
  let done = 0;
  for (const engine of engines) {
    for (const query of cfg.queries) {
      for (let run = 1; run <= RUNS; run++) {
        const answer = await engine.ask(query);
        records.push({
          engine: engine.name,
          query,
          run,
          answer,
          mentions: answer ? cfg.firms.filter((f) => mentioned(answer, f)) : [],
        });
        done++;
        process.stdout.write(`\r  ${done}/${total} answers collected…`);
      }
    }
  }
  console.log("\n");

  // Aggregate: per firm, per engine and combined.
  const valid = records.filter((r) => r.answer !== null);
  const header = ["Firm", ...engines.map((e) => e.name), "Combined"];
  const rows = cfg.firms.map((firm) => {
    const cells = engines.map((e) => {
      const rs = valid.filter((r) => r.engine === e.name);
      const hits = rs.filter((r) => r.mentions.includes(firm)).length;
      return `${hits}/${rs.length}`;
    });
    const hitsAll = valid.filter((r) => r.mentions.includes(firm)).length;
    return [firm, ...cells, `${hitsAll}/${valid.length}`];
  });

  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const fmt = (r: string[]) => "| " + r.map((c, i) => c.padEnd(widths[i])).join(" | ") + " |";
  console.log("Share of answers (mentions/runs):\n");
  console.log(fmt(header));
  console.log("|" + widths.map((w) => "-".repeat(w + 2)).join("|") + "|");
  for (const r of rows) console.log(fmt(r));

  const failed = records.length - valid.length;
  if (failed > 0) console.log(`\n(${failed} run(s) failed and were excluded)`);

  const out = path.join(here, "last-audit.json");
  writeFileSync(
    out,
    JSON.stringify(
      { ranAt: new Date().toISOString(), config: cfg, engines: engines.map((e) => e.name), records },
      null,
      2,
    ),
  );
  console.log(`\nRaw answers (the receipts) → ${out}`);
  console.log(
    "\nCAVEAT: API responses approximate, but do not equal, the consumer apps (search grounding differs).\nUse these numbers for baselines and trend-tracking; run client deliverables in the consumer products.\n",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
