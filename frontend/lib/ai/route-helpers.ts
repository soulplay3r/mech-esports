import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import type { ClaudeErrorCode } from "./claude-client";
import { clientKey, rateLimit } from "./rate-limit";

const STATUS: Record<ClaudeErrorCode, number> = {
  not_configured: 503,
  auth: 503,
  rate_limited: 429,
  timeout: 504,
  unavailable: 502,
  refused: 422,
  truncated: 502,
  upstream: 502,
};

export function aiError(code: ClaudeErrorCode, message: string) {
  return NextResponse.json({ error: { code, message } }, { status: STATUS[code] });
}

const MAX_BODY_BYTES = 32_000;

/** Rate-limits, size-checks and schema-validates a JSON request body. */
export async function readJson<T extends z.ZodType>(
  request: Request,
  route: string,
  schema: T,
  limitPerMinute = 10,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: NextResponse }> {
  const limit = rateLimit(clientKey(request, route), limitPerMinute, 60_000);
  if (!limit.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: "rate_limited", message: `Too many coach requests. Try again in ${limit.retryAfterSec}s.` } },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
      ),
    };
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return { ok: false, response: NextResponse.json({ error: { code: "invalid", message: "Request too large." } }, { status: 413 }) };
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return { ok: false, response: NextResponse.json({ error: { code: "invalid", message: "Invalid JSON." } }, { status: 400 }) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, response: NextResponse.json({ error: { code: "invalid", message: "Invalid request." } }, { status: 400 }) };
  }
  return { ok: true, data: parsed.data };
}
