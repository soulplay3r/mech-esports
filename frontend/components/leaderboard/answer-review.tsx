"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, CircleSlash, Ruler, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExplainPanel } from "@/components/ai-coach/explain-panel";
import { getQuestion } from "@/lib/data/questions";
import { formatStudentAnswer } from "@/lib/game/evaluation";
import { formatDuration } from "@/lib/game/timer";
import { cn } from "@/lib/utils/cn";
import type { StudentQuestionResult } from "@/types/competition";
import { DIFFICULTY_LABELS, TOPIC_LABELS, type EvaluationStatus } from "@/types/question";

const STATUS: Record<EvaluationStatus, { label: string; variant: "success" | "destructive" | "warning" | "outline"; icon: typeof XCircle }> = {
  correct: { label: "Correct", variant: "success", icon: CheckCircle2 },
  incorrect: { label: "Incorrect", variant: "destructive", icon: XCircle },
  "unit-error": { label: "Unit error", variant: "warning", icon: Ruler },
  invalid: { label: "Invalid", variant: "destructive", icon: XCircle },
  unanswered: { label: "No answer", variant: "outline", icon: CircleSlash },
};

export function AnswerReview({
  results,
  coachEnabled,
  autoExplainId,
}: {
  results: StudentQuestionResult[];
  coachEnabled: boolean | null;
  autoExplainId?: string | null;
}) {
  const firstWrong = results.find((r) => r.correctness === 0)?.questionId;
  const [open, setOpen] = useState<string | null>(firstWrong ?? results[0]?.questionId ?? null);
  const expanded = autoExplainId ?? open;

  return (
    <div className="space-y-3">
      {results.map((r, i) => {
        const q = getQuestion(r.questionId)!;
        const s = STATUS[r.evaluation.status];
        const isOpen = expanded === r.questionId;
        return (
          <div key={r.questionId} id={`review-${r.questionId}`} className={cn("rounded-xl border bg-card/80", isOpen && "border-primary/50")}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : r.questionId)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left sm:px-5"
            >
              <span className="font-mono text-sm text-muted-foreground">Q{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-display text-lg font-bold uppercase">{q.title}</span>
              <Badge variant={s.variant} className="hidden sm:inline-flex">
                <s.icon /> {s.label}
              </Badge>
              <span className="w-12 text-right font-mono font-bold">+{r.total}</span>
              <ChevronDown className={cn("size-4 transition", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <div className="space-y-4 border-t px-4 py-4 sm:px-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="accent">{TOPIC_LABELS[q.topic]}</Badge>
                  <Badge variant="outline">{DIFFICULTY_LABELS[q.difficulty]}</Badge>
                  <Badge variant={s.variant} className="sm:hidden">
                    {s.label}
                  </Badge>
                </div>
                <p className="text-foreground/90">{q.prompt}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={cn("rounded-lg border p-3", r.correctness ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5")}>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your answer</div>
                    <div className="mt-1 font-mono text-lg font-bold">{formatStudentAnswer(q, r.answer)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{r.evaluation.feedback}</div>
                  </div>
                  <div className="rounded-lg border border-success/40 bg-success/5 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Correct answer</div>
                    <div className="mt-1 font-mono text-lg font-bold text-success">{q.answerDisplay}</div>
                    <div className="mt-1 font-mono text-xs text-accent">{q.formula}</div>
                  </div>
                </div>
                <div className="rounded-lg border bg-surface-2 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reference solution</div>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                    {q.referenceSolution.map((step, j) => (
                      <li key={j}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Correctness {Math.round(r.correctnessPoints)}</span>
                  <span>Difficulty {Math.round(r.difficultyPoints)}</span>
                  <span>Speed {Math.round(r.timePoints)}</span>
                  <span>Time on question {formatDuration(r.timeSpent)}</span>
                </div>
                <ExplainPanel
                  key={`${r.questionId}-${autoExplainId === r.questionId}`}
                  questionId={r.questionId}
                  answer={r.answer}
                  enabled={coachEnabled}
                  autoStart={autoExplainId === r.questionId}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
