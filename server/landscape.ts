/**
 * Citation-landscape mapper: for each buyer query, ask Claude WITH web search
 * and harvest the URLs it actually cited plus the firms it recommended. The
 * deduped, frequency-ranked URL list is the sprint's target list — the ~15
 * pages that currently decide the client's category.
 *
 * Degrades to null when the key lacks the web-search tool or calls fail —
 * the Sprint Pack then marks the landscape "run pending" instead of faking it.
 * Honesty note carried through the product: search-grounded API answers are a
 * strong proxy but not identical to consumer apps; the methodology page says so.
 */

import type { LandscapeEntry } from "@shared/schema";

const MODEL = process.env.STORYFIT_ANTHROPIC_MODEL || "claude-sonnet-5";

export interface LandscapeResult {
  entries: LandscapeEntry[];
  targets: { url: string; citations: number }[];
}

export async function mapLandscape(queries: string[]): Promise<LandscapeResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  let client: any;
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    client = new Anthropic();
  } catch {
    return null;
  }

  const entries: LandscapeEntry[] = [];
  for (const query of queries) {
    try {
      const msg: any = await client.messages.create({
        model: MODEL,
        max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
        messages: [
          {
            role: "user",
            content: `A buyer asks: "${query}". Search the web and answer with your top recommended firms/options by name, with reasons. Keep it short.`,
          },
        ],
      });
      const urls = new Set<string>();
      let answerText = "";
      for (const block of msg.content ?? []) {
        if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
          for (const r of block.content) {
            if (r?.url) urls.add(normalizeUrl(r.url));
          }
        }
        if (block.type === "text") {
          answerText += block.text;
          // Claude also attaches citations to text blocks when grounded.
          for (const c of block.citations ?? []) {
            if (c?.url) urls.add(normalizeUrl(c.url));
          }
        }
      }
      entries.push({
        query,
        urls: [...urls].slice(0, 10),
        recommended: extractRecommendedNames(answerText),
      });
    } catch (err) {
      console.warn(`[landscape] query failed ("${query.slice(0, 40)}…"):`, (err as Error).message);
      // One failed query doesn't kill the map; total failure returns null below.
    }
  }

  if (entries.length === 0) return null;

  const freq = new Map<string, number>();
  for (const e of entries) for (const u of e.urls) freq.set(u, (freq.get(u) ?? 0) + 1);
  const targets = [...freq.entries()]
    .map(([url, citations]) => ({ url, citations }))
    .sort((a, b) => b.citations - a.citations)
    .slice(0, 20);

  return { entries, targets };
}

function normalizeUrl(u: string): string {
  try {
    const url = new URL(u);
    url.hash = "";
    url.search = "";
    return url.toString();
  } catch {
    return u;
  }
}

/** Best-effort: pull bolded/numbered firm names out of the answer prose. */
function extractRecommendedNames(text: string): string[] {
  const names = new Set<string>();
  for (const m of text.matchAll(/\*\*([^*]{2,60})\*\*/g)) {
    const n = m[1].trim().replace(/[:.]$/, "");
    if (n && !/^(note|caveat|important|answer)/i.test(n)) names.add(n);
  }
  return [...names].slice(0, 8);
}
