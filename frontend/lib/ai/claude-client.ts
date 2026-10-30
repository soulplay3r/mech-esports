import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only Claude client. The API key is read from the environment here and
 * never leaves the server. Every Claude feature degrades gracefully when the
 * key is missing: the game itself never depends on Claude.
 */

export const DEFAULT_MODEL = "claude-opus-5-5";
const REQUEST_TIMEOUT_MS = 50_000;

/** Models that accept server-side refusal fallbacks with `fallbacks: "default"`. */
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"]);
/** Models that accept `output_config.effort`. */
const EFFORT_MODEL = /^claude-(opus-(4-[5-8]|5)|sonnet-(4-6|5)|fable-5|mythos|haiku-5)/;

export function getModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

let cached: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!cached) {
    cached = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: 1,
    });
  }
  return cached;
}

/** The slice of the SDK this module uses, so tests can substitute a fake. */
export type ClaudeClient = Pick<Anthropic, "beta">;

export type ClaudeErrorCode =
  | "not_configured"
  | "auth"
  | "rate_limited"
  | "timeout"
  | "unavailable"
  | "refused"
  | "truncated"
  | "upstream";

export type ClaudeResult = { ok: true; text: string } | { ok: false; code: ClaudeErrorCode; message: string };

export interface ClaudeRequest {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  maxTokens: number;
  effort?: "low" | "medium" | "high";
  /** JSON schema for structured output. */
  jsonSchema?: Record<string, unknown>;
}

const MESSAGES: Record<ClaudeErrorCode, string> = {
  not_configured: "The Engineering Coach is offline: no Anthropic API key is configured on the server. You can still play every match.",
  auth: "The Engineering Coach is offline: the server's Anthropic API key was rejected.",
  rate_limited: "The Engineering Coach is busy right now. Try again in a minute.",
  timeout: "The Engineering Coach took too long to respond. Try again.",
  unavailable: "Couldn't reach the Engineering Coach. Check the connection and try again.",
  refused: "The Engineering Coach declined to answer that request.",
  truncated: "The Engineering Coach's answer was cut off. Try a shorter question.",
  upstream: "The Engineering Coach hit an error. Try again shortly.",
};

export function errorResult(code: ClaudeErrorCode): ClaudeResult {
  return { ok: false, code, message: MESSAGES[code] };
}

export function mapClaudeError(error: unknown): ClaudeResult {
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return errorResult("auth");
  }
  if (error instanceof Anthropic.RateLimitError) return errorResult("rate_limited");
  if (error instanceof Anthropic.APIConnectionTimeoutError) return errorResult("timeout");
  if (error instanceof Anthropic.APIConnectionError) return errorResult("unavailable");
  if (error instanceof Anthropic.APIError) return errorResult("upstream");
  return errorResult("upstream");
}

export async function callClaude(request: ClaudeRequest, client?: ClaudeClient): Promise<ClaudeResult> {
  if (!client && !isClaudeConfigured()) return errorResult("not_configured");
  const model = getModel();
  const outputConfig: Anthropic.Beta.BetaOutputConfig = {};
  if (request.effort && EFFORT_MODEL.test(model)) outputConfig.effort = request.effort;
  if (request.jsonSchema) outputConfig.format = { type: "json_schema", schema: request.jsonSchema };
  const useFallbacks = FALLBACK_MODELS.has(model);

  try {
    const response = await (client ?? getClient()).beta.messages.create({
      model,
      max_tokens: request.maxTokens,
      system: request.system,
      messages: request.messages,
      ...(Object.keys(outputConfig).length ? { output_config: outputConfig } : {}),
      ...(useFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    });
    if (response.stop_reason === "refusal") return errorResult("refused");
    if (response.stop_reason === "max_tokens") return errorResult("truncated");
    const text = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("")
      .trim();
    if (!text) return errorResult("upstream");
    return { ok: true, text };
  } catch (error) {
    console.error("[claude] request failed:", error instanceof Error ? error.message : error);
    return mapClaudeError(error);
  }
}
