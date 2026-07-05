/**
 * Operator authentication — right-sized for a single-operator product.
 *
 * - Password comes from CITED_ADMIN_PASSWORD (set it in production).
 * - Sessions are stateless HMAC-signed expiry tokens in an HttpOnly cookie:
 *   no session table, survives restarts, revoke-all by changing the password
 *   (the signing secret derives from it unless CITED_SESSION_SECRET is set).
 * - In development with no password configured, operator routes stay open for
 *   DX; in production with no password configured they are DENIED, never open.
 */

import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const COOKIE = "cited_session";
const TTL_MS = 7 * 24 * 3600 * 1000;

const password = () => process.env.CITED_ADMIN_PASSWORD || "";
const isProd = () => process.env.NODE_ENV === "production";

// Random per-boot fallback only matters when no password is set (dev).
const bootSecret = crypto.randomBytes(32).toString("hex");
function secret(): string {
  if (process.env.CITED_SESSION_SECRET) return process.env.CITED_SESSION_SECRET;
  const pw = password();
  return pw
    ? crypto.createHash("sha256").update(`cited-session-v1:${pw}`).digest("hex")
    : bootSecret;
}

function hmac(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("hex");
}

function signToken(expiresAt: number): string {
  return `${expiresAt}.${hmac(String(expiresAt))}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now() || !sig) return false;
  const expected = hmac(expStr);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function readCookie(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === COOKIE) return v.join("=");
  }
  return undefined;
}

export function authConfigured(): boolean {
  return password().length > 0;
}

export function checkPassword(attempt: string): boolean {
  if (!authConfigured()) return false;
  const a = crypto.createHash("sha256").update(attempt).digest();
  const b = crypto.createHash("sha256").update(password()).digest();
  return crypto.timingSafeEqual(a, b);
}

export function issueSession(res: Response): void {
  const exp = Date.now() + TTL_MS;
  const attrs = [
    `${COOKIE}=${signToken(exp)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(TTL_MS / 1000)}`,
    ...(isProd() ? ["Secure"] : []),
  ];
  res.setHeader("Set-Cookie", attrs.join("; "));
}

export function clearSession(res: Response): void {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

export function isOperator(req: Request): boolean {
  if (verifyToken(readCookie(req))) return true;
  // Dev convenience only — production without a password stays locked.
  if (!authConfigured() && !isProd()) return true;
  return false;
}

export function requireOperator(req: Request, res: Response, next: NextFunction): void {
  if (isOperator(req)) return next();
  res.status(401).json({
    error: authConfigured()
      ? "operator login required"
      : "locked: set CITED_ADMIN_PASSWORD and log in",
  });
}

/* Login attempt limiter: 5 tries per 15 minutes per IP. */
const attempts = new Map<string, { n: number; reset: number }>();
export function loginLimiter(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  const key = req.ip || "unknown";
  const slot = attempts.get(key);
  if (!slot || slot.reset < now) {
    attempts.set(key, { n: 1, reset: now + 15 * 60 * 1000 });
    return next();
  }
  if (slot.n >= 5) {
    res.status(429).json({ error: "too many login attempts — try again in 15 minutes" });
    return;
  }
  slot.n++;
  next();
}
