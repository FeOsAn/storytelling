/**
 * Security middleware: response headers + a small in-memory rate limiter.
 * Right-sized for a single-instance deployment — no Redis, no dependencies.
 */

import type { NextFunction, Request, Response } from "express";

const isProd = () => process.env.NODE_ENV === "production";

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), geolocation=(), payment=()");
  if (isProd()) {
    // Self-contained app + Google Fonts; inline styles are required by the
    // component styling. No external scripts, no external connections.
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src https://fonts.gstatic.com",
        "img-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
      ].join("; "),
    );
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }
  next();
}

function isLoopback(ip: string | undefined): boolean {
  return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
}

/**
 * Fixed-window per-IP limiter. Loopback is exempt so local QA harnesses and
 * sims never trip it; in production, Railway's proxy + trust-proxy gives us
 * real client IPs.
 */
export function rateLimit(opts: { max: number; windowMs: number; name: string }) {
  const hits = new Map<string, { n: number; reset: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    if (isLoopback(req.ip)) return next();
    const now = Date.now();
    const key = `${opts.name}:${req.ip || "unknown"}`;
    const slot = hits.get(key);
    if (!slot || slot.reset < now) {
      hits.set(key, { n: 1, reset: now + opts.windowMs });
      return next();
    }
    if (slot.n >= opts.max) {
      res.status(429).json({ error: "rate limit exceeded — slow down and try again shortly" });
      return;
    }
    slot.n++;
    next();
  };
}
