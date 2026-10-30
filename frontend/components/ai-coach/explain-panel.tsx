"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentAnswer } from "@/types/question";
import { Markdown } from "./markdown";
import { postCoach } from "./use-coach";

type State = { kind: "idle" } | { kind: "loading" } | { kind: "done"; text: string } | { kind: "error"; message: string };

export function ExplainPanel({
  questionId,
  answer,
  enabled,
  autoStart = false,
}: {
  questionId: string;
  answer?: StudentAnswer;
  enabled: boolean | null;
  autoStart?: boolean;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const started = useRef(false);

  const run = useCallback(async () => {
    setState({ kind: "loading" });
    const res = await postCoach<{ explanation: string }>("/api/ai/explain", { questionId, answer });
    setState(res.ok ? { kind: "done", text: res.data.explanation } : { kind: "error", message: res.message });
  }, [questionId, answer]);

  useEffect(() => {
    if (autoStart && enabled && !started.current) {
      started.current = true;
      void run();
    }
  }, [autoStart, enabled, run]);

  if (state.kind === "idle") {
    return (
      <Button variant="outline" size="sm" onClick={run} disabled={!enabled} title={enabled ? undefined : "Engineering Coach offline"}>
        <Sparkles className="text-accent" /> Ask Claude to explain
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
        <Sparkles className="size-4" /> Claude Engineering Coach
      </div>
      {state.kind === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Reviewing your answer against the reference solution…
        </div>
      )}
      {state.kind === "error" && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-destructive">{state.message}</span>
          <Button variant="ghost" size="sm" onClick={run}>
            <RotateCcw /> Retry
          </Button>
        </div>
      )}
      {state.kind === "done" && (
        <>
          <Markdown>{state.text}</Markdown>
          <p className="mt-4 border-t pt-2 text-[11px] text-muted-foreground">
            AI explanation grounded in the approved reference solution. Grading was done by the game engine, not Claude.
          </p>
        </>
      )}
    </div>
  );
}
