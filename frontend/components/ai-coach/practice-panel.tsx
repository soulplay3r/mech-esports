"use client";

import { useState } from "react";
import { BadgeCheck, Eye, EyeOff, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, NativeSelect } from "@/components/ui/input";
import { convertUnit, parseNumber, withinTolerance } from "@/lib/game/evaluation";
import type { PracticeQuestion } from "@/lib/ai/engineering-coach";
import { PRACTICE_UNITS } from "@/lib/data/practice";
import { DIFFICULTY_LABELS, TOPIC_LABELS, type Difficulty, type Topic } from "@/types/question";
import { postCoach } from "./use-coach";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; questions: PracticeQuestion[]; rejected: number }
  | { kind: "error"; message: string };

export function PracticePanel({
  weakTopics,
  difficulty,
  enabled,
}: {
  weakTopics: Topic[];
  difficulty: Difficulty;
  enabled: boolean | null;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function run() {
    setState({ kind: "loading" });
    const res = await postCoach<{ questions: PracticeQuestion[]; rejected: number }>("/api/ai/practice", { weakTopics, difficulty });
    setState(res.ok ? { kind: "done", ...res.data } : { kind: "error", message: res.message });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={!enabled || state.kind === "loading"}>
          {state.kind === "loading" ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {state.kind === "done" ? "Generate a new set" : "Generate personalised practice"}
        </Button>
        <span className="text-sm text-muted-foreground">
          Focus:{" "}
          {weakTopics.length ? weakTopics.map((t) => TOPIC_LABELS[t]).join(", ") : "all topics (flawless match!)"}
        </span>
      </div>

      {state.kind === "loading" && (
        <p className="text-sm text-muted-foreground">Claude is writing problems, and every answer is re-checked by the game engine. This takes ~20–40 s.</p>
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
          <div className="grid gap-4 lg:grid-cols-3">
            {state.questions.map((q, i) => (
              <PracticeCard key={`${q.title}-${i}`} q={q} index={i} />
            ))}
          </div>
          {state.rejected > 0 && (
            <p className="text-xs text-muted-foreground">
              {state.rejected} generated problem{state.rejected > 1 ? "s were" : " was"} discarded because the answer failed deterministic verification.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function PracticeCard({ q, index }: { q: PracticeQuestion; index: number }) {
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [checked, setChecked] = useState<null | boolean>(null);
  const [reveal, setReveal] = useState(false);

  function check() {
    const n = parseNumber(value);
    const converted = n === null ? null : convertUnit(n, unit, q.unit);
    setChecked(converted !== null && withinTolerance(converted, q.answer, 0.01));
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card/80 p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="accent">
          <Sparkles /> AI-generated practice
        </Badge>
        {q.verified && (
          <Badge variant="success">
            <BadgeCheck /> Answer verified
          </Badge>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        P{index + 1} · {TOPIC_LABELS[q.topic]} · {DIFFICULTY_LABELS[q.difficulty as Difficulty] ?? q.difficulty}
      </div>
      <div className="font-display text-lg font-bold uppercase leading-tight">{q.title}</div>
      <p className="text-sm text-foreground/90">{q.problem}</p>
      <div className="mt-auto flex gap-2">
        <Input className="font-mono" placeholder="Answer" inputMode="decimal" value={value} onChange={(e) => { setValue(e.target.value); setChecked(null); }} />
        <NativeSelect value={unit} onChange={(e) => { setUnit(e.target.value); setChecked(null); }} aria-label="Unit" className="w-32">
          <option value="" disabled>
            Unit…
          </option>
          {PRACTICE_UNITS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={check} disabled={!value || !unit}>
          Check
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setReveal((r) => !r)}>
          {reveal ? <EyeOff /> : <Eye />} {reveal ? "Hide" : "Solution"}
        </Button>
        {checked !== null && (
          <span className={checked ? "text-sm font-semibold text-success" : "text-sm font-semibold text-destructive"}>
            {checked ? "Correct!" : "Not quite"}
          </span>
        )}
      </div>
      {reveal && (
        <div className="rounded-lg border bg-surface-2 p-3 text-sm">
          <div className="font-mono text-xs text-accent">{q.formula}</div>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
            {q.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <div className="mt-2 font-semibold">
            Answer: {q.answer.toLocaleString()} {q.unit}
          </div>
        </div>
      )}
    </div>
  );
}
