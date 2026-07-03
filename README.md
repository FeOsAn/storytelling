# Cited (formerly StoryFit)

**The narrative-to-AI-answer studio.** Buyers now ask ChatGPT, Perplexity and Claude who to
hire; the models recommend two or three firms by name. Cited extracts the true story of an
expert firm through an adaptive interview, translates it into the answer-shaped narrative the
models need, and proves the lift with a share-of-voice before/after.

**Thesis:** *AI is the new referral engine — and to a language model, generic is invisible.*
The differentiator that gets a firm cited is a specific, hard-to-copy **edge** — usually an
uncomfortable contradiction the founders live. The engine extracts that edge through pushback,
confirms it with the founder, and packages it without overclaiming unverified numbers.

The site ships a marketing landing (`/`), a free **AI Visibility Audit** request flow
(`/audit`), the narrative-extraction interview (`/intake`), generated narrative profiles
(`/profile/:id`), and an operator pipeline (`/admin`). The underlying engine is the StoryFit
narrative-extraction stack described below — same contracts, repointed at founders and expert
firms.

> **Provenance:** this repo was reconstructed from the original StoryFit handoff spec plus a set
> of salvaged source files (`tailwind.config.ts`, `script/build.ts`, `script/qa/*`). The
> reconstructed files are faithful to the original **contracts** (the `StoryProfile` shape,
> `QUESTION_BANK` nodes, `registerRoutes(server, app)`, every `/api/*` payload) but are not
> byte-identical to the originals, which were unreachable at migration time.

## Features

- **Adaptive 3-interview intake** — chapters Foundation → Edge → Proof & Fit (6 primary
  questions), voice (Web Speech API) with a typed fallback.
- **Contradiction hunting** — thin/generic/polished/dodging answers draw a sharper probe; at
  least one probe per chapter is guaranteed client-side.
- **Live edge confirmation** — after the last answer the engine reflects a one-sentence edge
  hypothesis; the creator can **confirm / refine / reject** it (`POST /api/intake/edge`).
- **Deferred "Receipts"** — big/sensitive claims (`shared/claims.ts`) are noted gently and
  surfaced after generation; creators can never self-assign `verified` (downgraded server-side).
- **Brand-safe synthesis** — `leadWithThis` / `neverSayThis` guardrails; `fitScore` is capped
  with a rationale when key numbers are self-reported.
- **Low-specificity flag** — repeated probe-dodging surfaces a `lowSpecificity` flag on the
  profile so an operator isn't surprised by a generic result.
- **Dual engine** — Anthropic (Claude) preferred → OpenAI fallback → **deterministic fallback**,
  so the app works with no keys.

## Architecture

- **Frontend:** React + Vite + Wouter (hash routing) + Tailwind v3 + TanStack Query. Root at
  `client/`. Aliases: `@` → `client/src`, `@shared` → `shared`, `@assets` → `attached_assets`.
- **Backend:** Express, single port, thin routes over a storage layer (`server/routes.ts`).
  Serves both the API (`/api/*`) and the built client.
- **AI logic:** `server/storyEngine.ts` (generation), `server/questions.ts` (question bank +
  `evaluateAnswer` / `generateFollowUpSmart` / `inferEdgeSmart` / `assessSpecificity`),
  `server/llm.ts` (engine selection).
- **Persistence:** SQLite via `better-sqlite3` + Drizzle (`server/storage.ts`). DB file `data.db`
  (override with `STORYFIT_DB`); `proofs_json` / `edge_json` added idempotently on boot.
  **No localStorage / sessionStorage / cookies anywhere** — persistence is server-side by design.
- **Shared:** `shared/schema.ts` (zod + drizzle), `shared/claims.ts` (dependency-free big-claim
  heuristics used by both server and client).

Key API routes (under `/api`): `health`, `intake/script`, `intake/evaluate`, `intake/followup`,
`intake/edge`, `intake`, `applications` (creates the creator — **not** `/api/creators`),
`proofs`, `admin/verify`, `generate`, `approve`, `consent`, `creators/:id`, `admin/cohort`,
`admin/shortlist`.

## Setup

```bash
npm install          # compiles the better-sqlite3 native module
cp .env.example .env # optional — the app runs with no keys on the deterministic engine
```

## Commands

```bash
npm run check   # tsc typecheck
npm run build   # script/build.ts → dist/public (client) + dist/index.cjs (server)
npm run dev     # dev server (Express + Vite) on http://localhost:5000
npm start       # run the production build
npm run qa      # synthetic QA harness (script/qa/run.ts) — slow, LLM if keys present
npm run qa:brand# 2-persona commercial sim (needs a running server; SIM_BASE)
npm run db:push # drizzle-kit push
```

## Deploy (Railway — recommended)

The repo ships a multi-stage `Dockerfile` and `railway.json` (health check on
`/api/health`, single replica — required for SQLite).

1. [railway.app](https://railway.app) → New Project → **Deploy from GitHub repo** →
   pick this repo (`main`). The Dockerfile is detected automatically.
2. Service → **Variables**: set `STORYFIT_DB=/data/data.db`, `ANTHROPIC_API_KEY=<key>`
   (optional — deterministic engine without it).
3. Service → **Volumes**: add a volume mounted at `/data` (this is the database;
   without it, data is wiped on every deploy).
4. Service → **Settings → Networking**: Generate Domain (instant `*.up.railway.app`
   URL), or add your custom domain and set the CNAME it shows you.
5. Verify: `https://<domain>/api/health` → `{"ok":true,"engine":"llm:claude"}`.

Every push to `main` redeploys. Keep it to one replica.

### Manual / other hosts

```bash
npm run build
STORYFIT_DB=/path/to/persistent/data.db PORT=8080 NODE_ENV=production node dist/index.cjs
```

Any Node host works if it has a persistent disk for the SQLite file. (Legacy note: the
original Perplexity sandbox ran on port 5001 behind a proxy — see the token note below.)

`client/src/lib/queryClient.ts` contains the literal placeholder `__PORT_5001__`. At deploy the
`deploy_website` step rewrites it to the proxy path so the built client calls the backend.
Locally it stays `__PORT_5001__` (starts with `__`), so `API_BASE` falls back to same-origin.
**Do not change this token or hardcode a base URL.**

## Environment variables

| Var | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Enables the preferred Claude path (read automatically by `new Anthropic()`) |
| `ANTHROPIC_BASE_URL` | Custom Anthropic gateway (read automatically by the SDK) |
| `STORYFIT_ANTHROPIC_MODEL` | Override model (default: current Sonnet-class id) |
| `OPENAI_API_KEY` / `STORYFIT_OPENAI_MODEL` | OpenAI fallback |
| `PORT` | Server port (default 5000; deploy uses 5001) |
| `STORYFIT_DB` | SQLite file path (default `data.db`) |
| `SIM_BASE` | Base URL for QA/sim scripts, e.g. `http://127.0.0.1:5001` |

`/api/health` reports the live engine: `llm:claude`, `llm:openai`, or `deterministic`.

## Deliberate deviations from the original

- **UI primitives instead of shadcn/ui.** The original used shadcn/ui; this repo ships a small
  set of Tailwind primitives (`client/src/components/ui.tsx`) to keep the dependency tree light.
- **Default Anthropic model** is a valid current id, overridable via `STORYFIT_ANTHROPIC_MODEL`
  (the handoff's literal `claude_sonnet_4_6` is not a real model id).

See `storyfit-claude-code-handoff.md` for the full original handoff, product decisions, and
roadmap.
