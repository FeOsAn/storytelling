import type { SprintPack, StoryProfile } from "@shared/schema";

export type { SprintPack, StoryProfile };

export interface QuestionNode {
  id: string;
  stage: string;
  chapter: string;
  prompt: string;
  followUps: string[];
}

export interface IntakeTurnClient {
  stage: string;
  chapter?: string;
  question: string;
  answer: string;
  source: "text" | "voice";
  kind?: "primary" | "followup" | "edge" | "review";
}

export type EdgeAction = "confirm" | "refine" | "reject";

export interface CreatorView {
  id: string;
  name: string;
  handle?: string | null;
  niche?: string | null;
  platforms: string[];
  audienceSize?: string | null;
  status: string;
  approved: boolean;
  shortlisted: boolean;
  engine: string;
  profile: StoryProfile | null;
  proofs: Array<{ claim: string; type?: string; status: string; note?: string }>;
  sprintPack: SprintPack | null;
}
