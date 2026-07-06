/**
 * SQLite persistence via better-sqlite3 + Drizzle. The schema is created on boot
 * (create-table-if-missing) and `proofs_json` / `edge_json` are added idempotently
 * so an older DB upgrades in place. No localStorage/cookies anywhere — persistence
 * is server-side by design.
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { creators, type CreatorRow } from "@shared/schema";

const DB_PATH = process.env.STORYFIT_DB || "data.db";

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

// Base table + idempotent column adds (survives an older data.db).
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS creators (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    handle TEXT,
    email TEXT,
    niche TEXT,
    platforms TEXT,
    audience_size TEXT,
    consent_json TEXT,
    status TEXT NOT NULL DEFAULT 'applied',
    approved INTEGER NOT NULL DEFAULT 0,
    shortlisted INTEGER NOT NULL DEFAULT 0,
    intake_json TEXT,
    profile_json TEXT,
    proofs_json TEXT,
    edge_json TEXT,
    created_at INTEGER NOT NULL
  );
`);

function ensureColumn(name: string, ddl: string) {
  const cols = sqlite.prepare(`PRAGMA table_info(creators)`).all() as { name: string }[];
  if (!cols.some((c) => c.name === name)) {
    sqlite.exec(`ALTER TABLE creators ADD COLUMN ${ddl}`);
  }
}
ensureColumn("proofs_json", "proofs_json TEXT");
ensureColumn("edge_json", "edge_json TEXT");
ensureColumn("sprint_pack_json", "sprint_pack_json TEXT");

export const db = drizzle(sqlite);

export interface NewCreator {
  name: string;
  handle?: string;
  email?: string;
  niche?: string;
  platforms?: string;
  audienceSize?: string;
  consentJson?: string;
}

export const storage = {
  createCreator(input: NewCreator): CreatorRow {
    const id = nanoid();
    db.insert(creators)
      .values({
        id,
        name: input.name,
        handle: input.handle ?? null,
        email: input.email ?? null,
        niche: input.niche ?? null,
        platforms: input.platforms ?? null,
        audienceSize: input.audienceSize ?? null,
        consentJson: input.consentJson ?? null,
        status: "applied",
        approved: false,
        shortlisted: false,
        createdAt: Date.now(),
      })
      .run();
    return this.getCreator(id)!;
  },

  getCreator(id: string): CreatorRow | undefined {
    return db.select().from(creators).where(eq(creators.id, id)).get();
  },

  listCreators(): CreatorRow[] {
    return db.select().from(creators).all();
  },

  update(id: string, patch: Partial<CreatorRow>): CreatorRow | undefined {
    db.update(creators).set(patch).where(eq(creators.id, id)).run();
    return this.getCreator(id);
  },
};
