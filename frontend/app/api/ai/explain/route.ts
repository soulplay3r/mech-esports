import { NextResponse } from "next/server";
import { z } from "zod";
import { getQuestion } from "@/lib/data/questions";
import { explainQuestion } from "@/lib/ai/engineering-coach";
import { aiError, readJson } from "@/lib/ai/route-helpers";

export const runtime = "nodejs";
export const maxDuration = 60;

const answerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("numeric"), value: z.string().max(40), unit: z.string().max(20) }),
  z.object({ kind: z.literal("mcq"), optionId: z.string().max(8) }),
]);

const bodySchema = z.object({
  questionId: z.string().max(40),
  answer: answerSchema.optional(),
});

export async function POST(request: Request) {
  const body = await readJson(request, "explain", bodySchema);
  if (!body.ok) return body.response;

  // The question, correct answer and reference solution come from trusted seed
  // data on the server; only the student's raw answer comes from the client.
  const question = getQuestion(body.data.questionId);
  if (!question) {
    return NextResponse.json({ error: { code: "invalid", message: "Unknown question." } }, { status: 404 });
  }
  const result = await explainQuestion(question, body.data.answer);
  if (!result.ok) return aiError(result.code, result.message);
  return NextResponse.json({ explanation: result.text });
}
