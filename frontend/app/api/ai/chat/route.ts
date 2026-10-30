import { NextResponse } from "next/server";
import { z } from "zod";
import { askCoach } from "@/lib/ai/engineering-coach";
import { aiError, readJson } from "@/lib/ai/route-helpers";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(20)
    .refine((m) => m.at(-1)?.role === "user", "Last message must be from the user."),
});

export async function POST(request: Request) {
  const body = await readJson(request, "chat", bodySchema, 15);
  if (!body.ok) return body.response;
  const result = await askCoach(body.data.messages);
  if (!result.ok) return aiError(result.code, result.message);
  return NextResponse.json({ reply: result.text });
}
