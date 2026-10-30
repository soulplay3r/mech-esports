import { NextResponse } from "next/server";
import { isClaudeConfigured } from "@/lib/ai/claude-client";

export const dynamic = "force-dynamic";

/** Lets the UI disable Claude features up front when no key is configured. */
export function GET() {
  return NextResponse.json({ enabled: isClaudeConfigured() });
}
