/**
 * Engine selection + a single completion helper. Anthropic (Claude) is preferred,
 * then OpenAI, then a deterministic fallback handled by the callers (this module
 * returns `null` when no LLM is available or a call fails, and callers degrade).
 *
 * Clients are constructed lazily so importing this module never throws when keys
 * are absent — the app must run with no keys at all.
 */

export type Engine = "llm:claude" | "llm:openai" | "deterministic";

export function getEngine(): Engine {
  if (process.env.ANTHROPIC_API_KEY) return "llm:claude";
  if (process.env.OPENAI_API_KEY) return "llm:openai";
  return "deterministic";
}

const ANTHROPIC_MODEL = process.env.STORYFIT_ANTHROPIC_MODEL || "claude-sonnet-5";
const OPENAI_MODEL = process.env.STORYFIT_OPENAI_MODEL || "gpt-4o-mini";

let anthropicClient: any = null;
let openaiClient: any = null;

async function getAnthropic() {
  if (anthropicClient) return anthropicClient;
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  anthropicClient = new Anthropic(); // reads ANTHROPIC_API_KEY / ANTHROPIC_BASE_URL
  return anthropicClient;
}

async function getOpenAI() {
  if (openaiClient) return openaiClient;
  const { default: OpenAI } = await import("openai");
  openaiClient = new OpenAI();
  return openaiClient;
}

export interface CompleteOptions {
  system: string;
  user: string;
  maxTokens?: number;
}

/**
 * Returns the model's text, or `null` if no LLM is configured or the call throws.
 * Callers own the deterministic fallback.
 */
export async function complete(opts: CompleteOptions): Promise<string | null> {
  const engine = getEngine();
  const maxTokens = opts.maxTokens ?? 1500;

  if (engine === "llm:claude") {
    try {
      const client = await getAnthropic();
      const msg = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        system: opts.system,
        messages: [{ role: "user", content: opts.user }],
      });
      const text = (msg.content || [])
        .map((b: any) => (b.type === "text" ? b.text : ""))
        .join("");
      return text || null;
    } catch (err) {
      console.warn("[llm] anthropic call failed, degrading:", (err as Error).message);
      return null;
    }
  }

  if (engine === "llm:openai") {
    try {
      const client = await getOpenAI();
      const res = await client.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
      });
      return res.choices?.[0]?.message?.content || null;
    } catch (err) {
      console.warn("[llm] openai call failed, degrading:", (err as Error).message);
      return null;
    }
  }

  return null;
}

/** Pull the first JSON object/array out of a model response. */
export function extractJson<T = any>(text: string | null): T | null {
  if (!text) return null;
  const match = text.match(/[\{\[][\s\S]*[\}\]]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}
