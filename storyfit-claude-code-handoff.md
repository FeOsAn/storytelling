# StoryFit — Claude Code Handoff

Original handoff written after a Perplexity/Claude session that implemented the 3-interview
flow, adaptive pushback, live edge confirmation, and deferred "Receipts" verification, then ran
an 8-persona commercial-output simulation on the live Claude engine. Preserved here for
provenance; this repo is the migrated, reconstructed version (see README "Provenance").

## 1. Product thesis

StoryFit is an AI story agent for fitness / wellness / performance creators. A creator talks or
types through a short adaptive interview; StoryFit turns the conversation into a unique,
brand-ready story profile. **Thesis:** *Creators are more than their follower count.* The
differentiator that wins brand deals is a specific, hard-to-copy **edge** — usually an
uncomfortable contradiction the creator lives — not polished positioning. The product's job is
to *extract* that edge through pushback, confirm it with the creator, and package it as
commercial ammunition without overclaiming unverified numbers.

## 2. MVP features

- Adaptive 3-interview intake across chapters Foundation → Edge → Proof & Fit (6 primary
  questions; stages Origin/Audience/Values/Proof/Commercial Fit/Review), with voice (Web Speech
  API) and a typed fallback.
- Contradiction hunting: thin/generic/polished answers draw a sharper probe. The client
  guarantees at least one contradiction probe per chapter (`probedChapters`).
- Live edge confirmation: after the last answer the AI reflects a one-sentence edge hypothesis
  and captures confirm / refine / reject + a note, stored as a `Review` turn that feeds
  generation.
- Deferred lightweight verification ("Receipts"): the interview never stops to demand proof. Big
  claims are detected (`shared/claims.ts`), noted with a gentle toast, and surfaced once after
  generation. Creators can never self-assign `verified` (downgraded server-side).
- Brand-safe synthesis: `leadWithThis` and `neverSayThis` guardrails; engine caps `fitScore`
  when key numbers are self-reported.
- Brand/admin surfaces: cohort directory, shortlist toggle, approval + consent gates,
  operator-only proof verification.
- Dual engine: Anthropic preferred → OpenAI fallback → deterministic fallback.

## 3. Architecture

See README. Frontend React + Vite + Wouter + Tailwind + TanStack Query (`client/`). Backend
Express single-port over a storage layer (`server/routes.ts`). AI logic in
`server/storyEngine.ts` and `server/questions.ts`. SQLite via better-sqlite3 + Drizzle
(`server/storage.ts`). Shared `shared/schema.ts` + `shared/claims.ts`. No
localStorage/sessionStorage/cookies anywhere.

## 4. Major product decisions

1. **Edge is the product.** Pushback surfaces a lived contradiction; the edge read-back lets the
   creator own or sharpen it.
2. **Edge confirmation is a real feature** (`POST /api/intake/edge`, `inferEdgeSmart`).
3. **Verification is deferred and gentle**, never a mid-flow gate; compliance enforced at output
   time via `neverSayThis` + engine filtering.
4. **Never overclaim.** Self-reported numbers are fenced; `fitScore` capped with a rationale.
5. **Refine > confirm as a signal.** In the sim, several creators sharpened the AI's hypothesis
   and the refined text was materially better.

## 5. Known limitations

- Big-claim category labels are order-dependent (a reach/revenue number can be labelled
  "performance result"). The deferral trigger (`isBigClaim`) is correct in every case; only the
  suggested receipt type can be mislabelled. Roadmap #3.
- Creator creation is `POST /api/applications` (full application), **not** `POST /api/creators`.

## 6–9. Setup / commands / deploy / env

See README.

## 10. Roadmap / next tasks (from the 8-persona simulation)

1. **Detect repeated probe-dodges** and surface a "low-specificity" flag on the profile.
   *(Implemented in this migration: `assessSpecificity` in `server/questions.ts` +
   `lowSpecificity`/`specificityNote` on the profile, shown in `ProfileView`/`Admin`.)*
2. Double down on the edge-refine path — add a second micro-confirm after a refine.
3. Fix big-claim category ordering so the receipts panel suggests the right proof type.
4. Surface `neverSayThis` in the brand-facing view. *(Wired via `ProfileView brandFacing`.)*
5. Turn the `fitScore` cap into a creator nudge that feeds the receipts flow. *(Profile page
   shows an "add a receipt to lift your score" panel when fitScore < 75.)*

## 11. What NOT to do

- No localStorage / sessionStorage / cookies — persistence is server-side by design.
- Don't redesign the interview flow or broadly refactor; changes are deliberately minimal.
- Don't change the `__PORT_5001__` proxy token or hardcode an API base URL.
- Don't run large benchmark/QA suites casually — they hit the LLM and are slow.

## 12. Contracts locked by the salvaged source files

- `StoryProfile` shape (from `score.ts`): archetype, positioningLine, originStory,
  transformationArc, values[], antiValues[], tensions[], audienceRelationship, contentStyle,
  verbatim[], proofPoints[], brandFitMap[], hardNoCategories[], campaignAngles[], profileBio,
  brandNarrative, pitchDM, pitchEmail, narrativeTags[], creatorApprovalLine?, fitScore — plus
  edge, leadWithThis[], neverSayThis[], fitRationale, lowSpecificity, specificityNote.
- `server/questions.ts` exports `QUESTION_BANK` (`{id,stage,chapter,prompt,followUps[]}`) and
  `needsFollowUp`.
- `server/routes.ts` exports `registerRoutes(server, app)` (registers on an existing app).
