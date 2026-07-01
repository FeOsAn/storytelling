import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { z } from "zod";

/**
 * Persistence: a single `creators` table. Interview transcript, generated profile,
 * proofs and the edge-confirmation are stored as JSON columns so the shape can evolve
 * without migrations. `proofs_json` is added idempotently on boot (see server/storage.ts).
 */
export const creators = sqliteTable("creators", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  handle: text("handle"),
  email: text("email"),
  niche: text("niche"),
  platforms: text("platforms"), // JSON string[] as sent by the client
  audienceSize: text("audience_size"),
  consentJson: text("consent_json"),
  status: text("status").notNull().default("applied"), // applied | generated | approved
  approved: integer("approved", { mode: "boolean" }).notNull().default(false),
  shortlisted: integer("shortlisted", { mode: "boolean" }).notNull().default(false),
  intakeJson: text("intake_json"),
  profileJson: text("profile_json"),
  proofsJson: text("proofs_json"),
  edgeJson: text("edge_json"),
  createdAt: integer("created_at").notNull(),
});

export type CreatorRow = typeof creators.$inferSelect;

/* ---------------------------------------------------------------------------
 * Interview intake
 * ------------------------------------------------------------------------- */

export const intakeTurnSchema = z.object({
  stage: z.string(),
  chapter: z.string().optional(),
  question: z.string(),
  answer: z.string(),
  /** "text" | "voice" as sent by the client; sims send "text". */
  source: z.string().optional().default("text"),
  /** primary | followup | edge | review */
  kind: z.enum(["primary", "followup", "edge", "review"]).optional(),
});
export type IntakeTurn = z.infer<typeof intakeTurnSchema>;

export const applicationSchema = z.object({
  name: z.string().min(1),
  handle: z.string().optional(),
  email: z.string().optional(),
  niche: z.string().optional(),
  /** Client sends a JSON-encoded string[]; accept either. */
  platforms: z.union([z.string(), z.array(z.string())]).optional(),
  audienceSize: z.string().optional(),
  consentJson: z.string().optional(),
});
export type Application = z.infer<typeof applicationSchema>;

export const intakePayloadSchema = z.object({
  creatorId: z.string(),
  turns: z.array(intakeTurnSchema),
});

/* ---------------------------------------------------------------------------
 * Deferred verification ("Receipts")
 * ------------------------------------------------------------------------- */

export const proofStatusSchema = z.enum(["self-reported", "needs-proof", "verified"]);
export type ProofStatus = z.infer<typeof proofStatusSchema>;

export const proofSchema = z.object({
  claim: z.string(),
  /** Suggested receipt type, e.g. "audience metric", "revenue", "certification". */
  type: z.string().optional(),
  status: proofStatusSchema.default("self-reported"),
  note: z.string().optional(),
});
export type Proof = z.infer<typeof proofSchema>;

/* ---------------------------------------------------------------------------
 * Generated story profile — the commercial deliverable
 * ------------------------------------------------------------------------- */

export const proofPointSchema = z.object({
  claim: z.string(),
  evidence: z.string(),
  status: proofStatusSchema.optional(),
});

export const brandFitSchema = z.object({
  category: z.string(),
  rationale: z.string(),
  congruence: z.enum(["high", "medium", "low"]),
});

export const campaignAngleSchema = z.object({
  title: z.string(),
  premise: z.string(),
  format: z.string(),
});

export const storyProfileSchema = z.object({
  archetype: z.string(),
  positioningLine: z.string(),
  originStory: z.string(),
  transformationArc: z.string(),
  /** The lived contradiction that makes this creator hard to copy. */
  edge: z.string(),
  values: z.array(z.string()),
  antiValues: z.array(z.string()),
  tensions: z.array(z.string()),
  audienceRelationship: z.string(),
  contentStyle: z.string(),
  verbatim: z.array(z.string()),
  proofPoints: z.array(proofPointSchema),
  brandFitMap: z.array(brandFitSchema),
  hardNoCategories: z.array(z.string()),
  campaignAngles: z.array(campaignAngleSchema),
  profileBio: z.string(),
  brandNarrative: z.string(),
  pitchDM: z.string(),
  pitchEmail: z.string(),
  narrativeTags: z.array(z.string()),
  creatorApprovalLine: z.string().optional(),
  /** Brand-safety guardrails. */
  leadWithThis: z.array(z.string()),
  neverSayThis: z.array(z.string()),
  fitScore: z.number(),
  fitRationale: z.string(),
  /** Roadmap #1: set when the creator dodged repeated probes / stayed generic. */
  lowSpecificity: z.boolean(),
  specificityNote: z.string().optional(),
});
export type StoryProfile = z.infer<typeof storyProfileSchema>;
