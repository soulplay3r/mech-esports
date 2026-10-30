import "server-only";

/**
 * Basic in-memory sliding-window rate limiter. Per server instance only, which
 * is enough to stop casual abuse of a prototype. Swap for a shared store
 * (e.g. Redis/Upstash) before real traffic.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { ok: boolean; retryAfterSec: number } {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return { ok: true, retryAfterSec: 0 };
}

export function clientKey(request: Request, route: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${route}:${forwarded || request.headers.get("x-real-ip") || "local"}`;
}
