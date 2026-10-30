import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { callClaude, mapClaudeError, type ClaudeClient } from "@/lib/ai/claude-client";
import {
  buildExplainPrompt,
  explainQuestion,
  generatePractice,
  parsePracticeResponse,
  verifyPracticeAnswer,
} from "@/lib/ai/engineering-coach";
import { getQuestion } from "@/lib/data/questions";
import { POST as explainPOST } from "@/app/api/ai/explain/route";
import { POST as chatPOST } from "@/app/api/ai/chat/route";
import { POST as practicePOST } from "@/app/api/ai/practice/route";
import { GET as statusGET } from "@/app/api/ai/status/route";

type CreateArgs = Record<string, unknown>;

function fakeClient(impl: (args: CreateArgs) => unknown): { client: ClaudeClient; calls: CreateArgs[] } {
  const calls: CreateArgs[] = [];
  const client = {
    beta: {
      messages: {
        create: async (args: CreateArgs) => {
          calls.push(args);
          return impl(args);
        },
      },
    },
  } as unknown as ClaudeClient;
  return { client, calls };
}

const textResponse = (text: string, stop_reason = "end_turn") => ({
  content: [{ type: "thinking", thinking: "" }, { type: "text", text }],
  stop_reason,
});

const goodPractice = {
  title: "Drill spindle speed",
  topic: "cutting-speed",
  difficulty: "intermediate",
  problem: "A 20 mm drill cuts at 25 m/min. Find the spindle speed in RPM.",
  formula: "N = 1000V / (πD)",
  answer: 398,
  unit: "RPM",
  steps: ["N = 1000 × 25 / (π × 20)", "N ≈ 398 RPM"],
  calculation: {
    formula_id: "spindle_speed",
    inputs: [
      { name: "V_m_per_min", value: 25 },
      { name: "D_mm", value: 20 },
    ],
  },
};

const ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ENV };
});

describe("callClaude", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_MODEL = "claude-opus-5-5";
  });

  it("returns text and sends model, limits, effort and refusal fallbacks", async () => {
    const { client, calls } = fakeClient(() => textResponse("Hello"));
    const r = await callClaude({ system: "s", messages: [{ role: "user", content: "hi" }], maxTokens: 100, effort: "low" }, client);
    expect(r).toEqual({ ok: true, text: "Hello" });
    expect(calls[0]).toMatchObject({
      model: "claude-opus-5-5",
      max_tokens: 100,
      output_config: { effort: "low" },
      fallbacks: "default",
      betas: ["server-side-fallback-2026-07-01"],
    });
  });

  it("uses ANTHROPIC_MODEL and omits unsupported params for older models", async () => {
    process.env.ANTHROPIC_MODEL = "claude-haiku-4-5";
    const { client, calls } = fakeClient(() => textResponse("ok"));
    await callClaude({ system: "s", messages: [{ role: "user", content: "hi" }], maxTokens: 50, effort: "low" }, client);
    expect(calls[0].model).toBe("claude-haiku-4-5");
    expect(calls[0]).not.toHaveProperty("fallbacks");
    expect(calls[0]).not.toHaveProperty("output_config");
  });

  it("reports missing configuration without calling the API", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const r = await callClaude({ system: "s", messages: [{ role: "user", content: "hi" }], maxTokens: 10 });
    expect(r).toMatchObject({ ok: false, code: "not_configured" });
  });

  it("handles refusals and truncation", async () => {
    const refused = fakeClient(() => ({ content: [], stop_reason: "refusal" }));
    expect(await callClaude({ system: "s", messages: [{ role: "user", content: "x" }], maxTokens: 10 }, refused.client)).toMatchObject({
      ok: false,
      code: "refused",
    });
    const cut = fakeClient(() => textResponse("partial", "max_tokens"));
    expect(await callClaude({ system: "s", messages: [{ role: "user", content: "x" }], maxTokens: 10 }, cut.client)).toMatchObject({
      ok: false,
      code: "truncated",
    });
  });

  it("maps SDK errors to friendly codes", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const headers = new Headers();
    const thrower = (err: unknown) => fakeClient(() => Promise.reject(err)).client;
    const run = (err: unknown) => callClaude({ system: "s", messages: [{ role: "user", content: "x" }], maxTokens: 10 }, thrower(err));
    expect(await run(new Anthropic.RateLimitError(429, undefined, "rate", headers))).toMatchObject({ code: "rate_limited" });
    expect(await run(new Anthropic.AuthenticationError(401, undefined, "auth", headers))).toMatchObject({ code: "auth" });
    expect(await run(new Anthropic.APIConnectionTimeoutError())).toMatchObject({ code: "timeout" });
    expect(await run(new Anthropic.APIConnectionError({ message: "down" }))).toMatchObject({ code: "unavailable" });
    expect(await run(new Anthropic.InternalServerError(500, undefined, "boom", headers))).toMatchObject({ code: "upstream" });
    expect(mapClaudeError(new Error("weird"))).toMatchObject({ ok: false, code: "upstream" });
  });
});

describe("Engineering Coach: explain", () => {
  it("grounds the prompt in the approved solution and the engine's verdict", () => {
    const q = getQuestion("cs-int-1")!;
    const prompt = buildExplainPrompt(q, { kind: "numeric", value: "2000", unit: "RPM" });
    expect(prompt).toContain("Approved reference solution");
    expect(prompt).toContain("N ≈ 636.6 RPM");
    expect(prompt).toContain("Official correct answer: ≈ 637 RPM");
    expect(prompt).toContain("Student's answer: 2000 RPM");
    expect(prompt).toContain("INCORRECT");
  });

  it("flags unit errors and unanswered questions", () => {
    const q = getQuestion("cs-int-1")!;
    expect(buildExplainPrompt(q, { kind: "numeric", value: "637", unit: "m/min" })).toContain("unit error");
    expect(buildExplainPrompt(q, undefined)).toContain("did not answer");
  });

  it("returns Claude's explanation", async () => {
    const { client, calls } = fakeClient(() => textResponse("### What this tests\n..."));
    const r = await explainQuestion(getQuestion("po-int-1")!, { kind: "mcq", optionId: "b" }, client);
    expect(r.ok).toBe(true);
    expect(JSON.stringify(calls[0].messages)).toContain("Student's answer: 120 units");
  });
});

describe("Engineering Coach: practice validation", () => {
  it("verifies answers deterministically, including unit conversion", () => {
    expect(verifyPracticeAnswer(goodPractice as never)).toBe(true);
    expect(verifyPracticeAnswer({ ...goodPractice, answer: 500 } as never)).toBe(false);
    expect(verifyPracticeAnswer({ ...goodPractice, unit: "min" } as never)).toBe(false);
    const time = {
      ...goodPractice,
      unit: "s",
      answer: 120,
      calculation: {
        formula_id: "machining_time",
        inputs: [
          { name: "L_mm", value: 200 },
          { name: "f_mm_per_rev", value: 0.25 },
          { name: "N_rpm", value: 400 },
        ],
      },
    };
    expect(verifyPracticeAnswer(time as never)).toBe(true);
    expect(verifyPracticeAnswer({ ...time, calculation: { ...time.calculation, inputs: [] } } as never)).toBe(false);
  });

  it("drops unverifiable questions and rejects malformed output", () => {
    const text = JSON.stringify({ questions: [goodPractice, { ...goodPractice, answer: 9999 }, goodPractice] });
    const parsed = parsePracticeResponse(text)!;
    expect(parsed.questions).toHaveLength(2);
    expect(parsed.rejected).toBe(1);
    expect(parsed.questions.every((q) => q.verified)).toBe(true);
    expect(parsePracticeResponse("not json")).toBeNull();
    expect(parsePracticeResponse(JSON.stringify({ questions: [{ title: "x" }] }))).toBeNull();
  });

  it("requests structured output and returns at most three verified questions", async () => {
    const { client, calls } = fakeClient(() =>
      textResponse(JSON.stringify({ questions: [goodPractice, goodPractice, goodPractice, goodPractice] })),
    );
    const r = await generatePractice(["cutting-speed"], "intermediate", client);
    expect(r.ok && r.questions).toHaveLength(3);
    expect(calls[0]).toMatchObject({ output_config: { format: { type: "json_schema" } } });
  });

  it("reports a validation failure when nothing verifies", async () => {
    const { client } = fakeClient(() => textResponse(JSON.stringify({ questions: [{ ...goodPractice, answer: 1 }] })));
    expect(await generatePractice([], "beginner", client)).toMatchObject({ ok: false, code: "upstream" });
  });
});

describe("API routes", () => {
  const post = (body: unknown, ip: string) =>
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

  it("status reports whether Claude is configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(await statusGET().json()).toEqual({ enabled: false });
    process.env.ANTHROPIC_API_KEY = "sk-test";
    expect(await statusGET().json()).toEqual({ enabled: true });
  });

  it("returns 503 with a helpful message when no key is configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = await explainPOST(post({ questionId: "cs-int-1", answer: { kind: "numeric", value: "1", unit: "RPM" } }, "1.1.1.1"));
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error.code).toBe("not_configured");
    expect(json.error.message).toMatch(/still play/);
  });

  it("validates request bodies", async () => {
    expect((await explainPOST(post("{bad", "2.2.2.2"))).status).toBe(400);
    expect((await explainPOST(post({ questionId: "nope" }, "2.2.2.2"))).status).toBe(404);
    expect((await chatPOST(post({ messages: [] }, "2.2.2.3"))).status).toBe(400);
    expect((await chatPOST(post({ messages: [{ role: "assistant", content: "hi" }] }, "2.2.2.3"))).status).toBe(400);
    expect((await chatPOST(post({ messages: [{ role: "user", content: "x".repeat(2001) }] }, "2.2.2.3"))).status).toBe(400);
    expect((await practicePOST(post({ weakTopics: ["welding"], difficulty: "intermediate" }, "2.2.2.4"))).status).toBe(400);
  });

  it("rate limits repeated requests from one client", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      statuses.push((await practicePOST(post({ weakTopics: [], difficulty: "beginner" }, "9.9.9.9"))).status);
    }
    expect(statuses.slice(0, 5).every((s) => s === 503)).toBe(true);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });
});
