import { NextResponse } from "next/server";
import { z } from "zod";
import { DIFFICULTIES, TOPICS, type Difficulty, type Topic } from "@/types/question";
import { generatePractice } from "@/lib/ai/engineering-coach";
import { aiError, readJson } from "@/lib/ai/route-helpers";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  weakTopics: z.array(z.enum(TOPICS as [Topic, ...Topic[]])).max(5),
  difficulty: z.enum(DIFFICULTIES as [Difficulty, ...Difficulty[]]),
});

export async function POST(request: Request) {
  const body = await readJson(request, "practice", bodySchema, 5);
  if (!body.ok) return body.response;
  const result = await generatePractice([...new Set(body.data.weakTopics)], body.data.difficulty);
  if (!result.ok) return aiError(result.code, result.message);
  return NextResponse.json({ questions: result.questions, rejected: result.rejected });
}
