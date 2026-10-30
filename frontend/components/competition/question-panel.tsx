"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, Lightbulb, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, NativeSelect } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import type { AnswerRecord } from "@/types/competition";
import { DIFFICULTY_LABELS, TOPIC_LABELS, type Question, type StudentAnswer } from "@/types/question";

export function emptyDraft(question: Question): StudentAnswer {
  return question.kind === "numeric" ? { kind: "numeric", value: "", unit: "" } : { kind: "mcq", optionId: "" };
}

export function isDraftComplete(draft: StudentAnswer): boolean {
  return draft.kind === "numeric" ? draft.value.trim() !== "" && draft.unit !== "" : draft.optionId !== "";
}

export function sameAnswer(a: StudentAnswer | undefined, b: StudentAnswer | undefined): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function QuestionPanel({
  question,
  index,
  total,
  draft,
  submitted,
  showHint,
  disabled,
  onDraft,
  onSubmit,
  onNavigate,
}: {
  question: Question;
  index: number;
  total: number;
  draft: StudentAnswer;
  submitted?: AnswerRecord;
  showHint: boolean;
  disabled: boolean;
  onDraft: (draft: StudentAnswer) => void;
  onSubmit: () => void;
  onNavigate: (index: number) => void;
}) {
  const complete = isDraftComplete(draft);
  const lockedIn = submitted && sameAnswer(submitted.answer, draft);
  const pendingRevision = submitted && !lockedIn;

  return (
    <div className="flex flex-col gap-5 rounded-xl border bg-card/80 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Question {index + 1} <span className="text-muted-foreground/60">/ {total}</span>
        </span>
        <Badge variant="accent">{TOPIC_LABELS[question.topic]}</Badge>
        <Badge variant="outline">{DIFFICULTY_LABELS[question.difficulty]}</Badge>
        <Badge variant="outline">{question.kind === "numeric" ? "Numerical" : "Multiple choice"}</Badge>
      </div>

      <div>
        <h2 className="font-display text-3xl font-bold uppercase leading-tight">{question.title}</h2>
        <p className="mt-3 text-lg leading-relaxed text-foreground/90">{question.prompt}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {question.parameters.map((p) => (
          <div key={p.label} className="flex items-center justify-between rounded-lg border bg-surface-2 px-3 py-2">
            <span className="text-sm text-muted-foreground">{p.label}</span>
            <span className="font-mono text-sm font-semibold text-accent">{p.value}</span>
          </div>
        ))}
      </div>

      {showHint && question.formulaHint && (
        <div className="flex gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning/90">
          <Lightbulb className="mt-0.5 size-4 shrink-0" />
          <span>{question.formulaHint}</span>
        </div>
      )}

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (complete && !disabled && !lockedIn) onSubmit();
        }}
      >
        {question.kind === "numeric" && draft.kind === "numeric" ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              inputMode="decimal"
              autoComplete="off"
              aria-label="Your answer"
              placeholder="Enter your answer"
              className="h-14 flex-1 font-mono text-2xl"
              value={draft.value}
              disabled={disabled}
              onChange={(e) => onDraft({ ...draft, value: e.target.value })}
            />
            <NativeSelect
              aria-label="Unit"
              className="h-14 sm:w-40"
              value={draft.unit}
              disabled={disabled}
              onChange={(e) => onDraft({ ...draft, unit: e.target.value })}
            >
              <option value="" disabled>
                Unit…
              </option>
              {[...question.unitOptions].sort().map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </NativeSelect>
          </div>
        ) : question.kind === "mcq" && draft.kind === "mcq" ? (
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Options">
            {question.options.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={draft.optionId === o.id}
                disabled={disabled}
                onClick={() => onDraft({ kind: "mcq", optionId: o.id })}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border bg-surface-2 px-4 py-3 text-left transition hover:border-primary/60 disabled:cursor-not-allowed",
                  draft.optionId === o.id && "border-primary bg-primary/15 neon-ring",
                )}
              >
                <span className="grid size-7 place-items-center rounded-md border font-mono text-sm uppercase">{o.id}</span>
                <span className="font-medium">{o.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={!complete || disabled || lockedIn} className="min-w-44">
            <Send /> {pendingRevision ? "Resubmit answer" : lockedIn ? "Locked in" : "Submit answer"}
          </Button>
          <div aria-live="polite" className="text-sm">
            {lockedIn ? (
              <span className="flex items-center gap-1.5 text-success">
                <CheckCircle2 className="size-4" /> Answer recorded. You can revise it until the final whistle.
              </span>
            ) : pendingRevision ? (
              <span className="text-warning">Unsaved change. Resubmit to replace your recorded answer.</span>
            ) : (
              <span className="text-muted-foreground">Answers are revealed after the match.</span>
            )}
          </div>
        </div>
      </form>

      <div className="flex items-center justify-between border-t pt-4">
        <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => onNavigate(index - 1)}>
          <ChevronLeft /> Previous
        </Button>
        <Button variant="ghost" size="sm" disabled={index === total - 1} onClick={() => onNavigate(index + 1)}>
          Next <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
