/**
 * All `/api/*` routes, registered onto an existing Express app. The QA harness
 * (script/qa/run.ts) creates its own app + http server and calls registerRoutes,
 * so this must NOT create its own server or add express.json (the caller does).
 */

import type { Express } from "express";
import type { Server } from "node:http";
import { z } from "zod";
import {
  applicationSchema,
  intakePayloadSchema,
  intakeTurnSchema,
  proofSchema,
  proofStatusSchema,
  type StoryProfile,
} from "@shared/schema";
import { storage } from "./storage";
import { getEngine } from "./llm";
import {
  QUESTION_BANK,
  evaluateAnswer,
  generateFollowUpSmart,
  inferEdgeSmart,
} from "./questions";
import { generateProfile } from "./storyEngine";
import { isBigClaim, extractBigClaims } from "@shared/claims";
import {
  authConfigured,
  checkPassword,
  clearSession,
  isOperator,
  issueSession,
  loginLimiter,
  requireOperator,
} from "./auth";
import { rateLimit } from "./security";

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function toArray(platforms: unknown): string[] {
  if (Array.isArray(platforms)) return platforms as string[];
  if (typeof platforms === "string") return parseJson<string[]>(platforms, []);
  return [];
}

export async function registerRoutes(_server: Server, app: Express): Promise<void> {
  // Abuse guards: LLM-backed endpoints cost real money; applications can be
  // spammed. Loopback is exempt (local QA/sims), production sees real IPs.
  const llmLimit = rateLimit({ name: "llm", max: 60, windowMs: 10 * 60 * 1000 });
  const formLimit = rateLimit({ name: "form", max: 20, windowMs: 60 * 60 * 1000 });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, engine: getEngine() });
  });

  /* ---- Operator auth ---- */

  app.post("/api/auth/login", loginLimiter, (req, res) => {
    if (!authConfigured()) {
      return res.status(503).json({ error: "auth not configured — set CITED_ADMIN_PASSWORD" });
    }
    if (!checkPassword(String(req.body?.password ?? ""))) {
      return res.status(401).json({ error: "wrong password" });
    }
    issueSession(res);
    res.json({ ok: true, operator: true });
  });

  app.post("/api/auth/logout", (_req, res) => {
    clearSession(res);
    res.json({ ok: true });
  });

  app.get("/api/auth/me", (req, res) => {
    res.json({ operator: isOperator(req), configured: authConfigured() });
  });

  // The interview script (question bank).
  app.get("/api/intake/script", (_req, res) => {
    res.json({ questions: QUESTION_BANK });
  });

  // Adaptive evaluation of a single answer. Pass `chapterProbed: false` to get
  // the guaranteed at-least-one-probe-per-chapter behaviour enforced here (not
  // just in the web client) — polished answers can otherwise dodge every probe.
  app.post("/api/intake/evaluate", (req, res) => {
    const answer = String(req.body?.answer ?? "");
    const evaln = evaluateAnswer(answer);
    const bigClaims = extractBigClaims(answer);
    const chapterProbed = req.body?.chapterProbed;
    const forceChapterProbe = chapterProbed === false && !evaln.needsFollowUp;
    res.json({
      needsFollowUp: evaln.needsFollowUp || forceChapterProbe,
      reason: forceChapterProbe
        ? "Guaranteed chapter probe — every chapter earns at least one contradiction hunt."
        : evaln.reason,
      // Deferred receipts: note big claims gently, never gate the flow.
      bigClaim: bigClaims.length > 0,
      claims: bigClaims,
    });
  });

  // Contradiction-hunting follow-up.
  app.post("/api/intake/followup", llmLimit, async (req, res) => {
    const questionId = String(req.body?.questionId ?? "");
    const answer = String(req.body?.answer ?? "");
    const { followUp, reason } = await generateFollowUpSmart({
      questionId,
      answer,
      name: req.body?.name,
      niche: req.body?.niche,
    });
    res.json({ followUp, reason });
  });

  // Live edge confirmation — reflect a one-sentence hypothesis.
  app.post("/api/intake/edge", llmLimit, async (req, res) => {
    let turns = z.array(intakeTurnSchema).safeParse(req.body?.turns).data;
    if (!turns && req.body?.creatorId) {
      const creator = storage.getCreator(String(req.body.creatorId));
      turns = parseJson(creator?.intakeJson, []);
    }
    if (!turns || turns.length === 0) {
      return res.status(400).json({ error: "no turns provided" });
    }
    const { edge } = await inferEdgeSmart(turns);
    res.json({ edge });
  });

  // Create the creator (consent-gated). NOTE: this is the creator-creation route,
  // NOT POST /api/creators.
  app.post("/api/applications", formLimit, (req, res) => {
    const parsed = applicationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid application", details: parsed.error.flatten() });
    }
    const platforms = Array.isArray(parsed.data.platforms)
      ? JSON.stringify(parsed.data.platforms)
      : parsed.data.platforms;
    const creator = storage.createCreator({ ...parsed.data, platforms });
    res.json({ id: creator.id });
  });

  // Persist the interview transcript.
  app.post("/api/intake", (req, res) => {
    const parsed = intakePayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid intake", details: parsed.error.flatten() });
    }
    const creator = storage.getCreator(parsed.data.creatorId);
    if (!creator) return res.status(404).json({ error: "creator not found" });

    // Capture any edge/review turn to feed generation.
    const edgeTurn = parsed.data.turns.find((t) => t.kind === "edge" || t.kind === "review");
    storage.update(creator.id, {
      intakeJson: JSON.stringify(parsed.data.turns),
      edgeJson: edgeTurn ? JSON.stringify(edgeTurn) : creator.edgeJson,
    });
    res.json({ ok: true });
  });

  // Deferred receipts: creators can add proofs, but never self-assign `verified`.
  app.post("/api/proofs", formLimit, (req, res) => {
    const schema = z.object({ creatorId: z.string(), proofs: z.array(proofSchema) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid proofs" });
    const creator = storage.getCreator(parsed.data.creatorId);
    if (!creator) return res.status(404).json({ error: "creator not found" });

    const downgraded = parsed.data.proofs.map((p) => ({
      ...p,
      status: p.status === "verified" ? ("self-reported" as const) : p.status,
    }));
    storage.update(creator.id, { proofsJson: JSON.stringify(downgraded) });
    res.json({ ok: true, proofs: downgraded });
  });

  // Operator-only verification.
  app.post("/api/admin/verify", requireOperator, (req, res) => {
    const schema = z.object({
      creatorId: z.string(),
      index: z.number(),
      status: proofStatusSchema,
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid verify" });
    const creator = storage.getCreator(parsed.data.creatorId);
    if (!creator) return res.status(404).json({ error: "creator not found" });
    const proofs = parseJson<any[]>(creator.proofsJson, []);
    if (proofs[parsed.data.index]) {
      proofs[parsed.data.index].status = parsed.data.status;
      storage.update(creator.id, { proofsJson: JSON.stringify(proofs) });
    }
    res.json({ ok: true, proofs });
  });

  // Generate the story profile. Public callers get exactly one generation per
  // creator (the end of their own interview); regeneration costs money and is
  // operator-only.
  app.post("/api/generate", llmLimit, async (req, res) => {
    const creatorId = String(req.body?.creatorId ?? "");
    const creator = storage.getCreator(creatorId);
    if (!creator) return res.status(404).json({ error: "creator not found" });
    if (creator.profileJson && !isOperator(req)) {
      return res.status(403).json({ error: "profile already generated — regeneration is operator-only" });
    }

    const turns = parseJson<any[]>(creator.intakeJson, []);
    const edgeTurn = parseJson<any>(creator.edgeJson, null);
    const edge = edgeTurn?.answer || edgeTurn?.edge || undefined;

    const profile = await generateProfile({
      name: creator.name,
      niche: creator.niche ?? undefined,
      turns,
      edge,
    });

    storage.update(creator.id, {
      profileJson: JSON.stringify(profile),
      status: "generated",
    });
    res.json({ ok: true, profile });
  });

  // Approval + consent gates.
  app.post("/api/approve", requireOperator, (req, res) => {
    const creatorId = String(req.body?.creatorId ?? "");
    const creator = storage.getCreator(creatorId);
    if (!creator) return res.status(404).json({ error: "creator not found" });
    storage.update(creator.id, { approved: true, status: "approved" });
    res.json({ ok: true });
  });

  app.post("/api/consent", requireOperator, (req, res) => {
    const creatorId = String(req.body?.creatorId ?? "");
    const creator = storage.getCreator(creatorId);
    if (!creator) return res.status(404).json({ error: "creator not found" });
    storage.update(creator.id, { consentJson: JSON.stringify(req.body?.consent ?? req.body?.consentJson ?? {}) });
    res.json({ ok: true });
  });

  // Read back exactly what a creator/brand would see. Includes saved interview
  // turns so a half-finished interview can resume after a refresh.
  app.get("/api/creators/:id", (req, res) => {
    const creator = storage.getCreator(req.params.id);
    if (!creator) return res.status(404).json({ error: "creator not found" });
    const profile = parseJson<StoryProfile | null>(creator.profileJson, null);
    res.json({
      id: creator.id,
      name: creator.name,
      handle: creator.handle,
      niche: creator.niche,
      platforms: toArray(creator.platforms),
      audienceSize: creator.audienceSize,
      status: creator.status,
      approved: creator.approved,
      shortlisted: creator.shortlisted,
      engine: getEngine(),
      profile,
      proofs: parseJson<any[]>(creator.proofsJson, []),
      turns: parseJson<any[]>(creator.intakeJson, []),
    });
  });

  // Brand/admin cohort directory. turnsCount lets the pipeline distinguish
  // audit leads (no interview yet) from interviewed/generated clients.
  app.get("/api/admin/cohort", requireOperator, (_req, res) => {
    const rows = storage.listCreators().map((c) => ({
      id: c.id,
      name: c.name,
      handle: c.handle,
      niche: c.niche,
      status: c.status,
      approved: c.approved,
      shortlisted: c.shortlisted,
      turnsCount: parseJson<any[]>(c.intakeJson, []).length,
      profile: parseJson<StoryProfile | null>(c.profileJson, null),
    }));
    res.json({ creators: rows });
  });

  // Full data export — the operator's backup. Everything: applications,
  // transcripts, edges, profiles, proofs. Download it on a schedule; the
  // SQLite volume must never be the only copy of a client's interview.
  app.get("/api/admin/export", requireOperator, (_req, res) => {
    const rows = storage.listCreators().map((c) => ({
      id: c.id,
      name: c.name,
      handle: c.handle,
      email: c.email,
      niche: c.niche,
      platforms: toArray(c.platforms),
      audienceSize: c.audienceSize,
      status: c.status,
      approved: c.approved,
      shortlisted: c.shortlisted,
      createdAt: c.createdAt,
      consent: parseJson<unknown>(c.consentJson, null),
      turns: parseJson<any[]>(c.intakeJson, []),
      edge: parseJson<unknown>(c.edgeJson, null),
      profile: parseJson<StoryProfile | null>(c.profileJson, null),
      proofs: parseJson<any[]>(c.proofsJson, []),
    }));
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="cited-backup-${stamp}.json"`);
    res.json({ exportedAt: new Date().toISOString(), creators: rows });
  });

  app.post("/api/admin/shortlist", requireOperator, (req, res) => {
    const creatorId = String(req.body?.creatorId ?? "");
    const creator = storage.getCreator(creatorId);
    if (!creator) return res.status(404).json({ error: "creator not found" });
    const shortlisted = req.body?.shortlisted ?? !creator.shortlisted;
    storage.update(creator.id, { shortlisted: !!shortlisted });
    res.json({ ok: true, shortlisted: !!shortlisted });
  });
}

// Silence unused-import lint in case isBigClaim is only used indirectly.
void isBigClaim;
