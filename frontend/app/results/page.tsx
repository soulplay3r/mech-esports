"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Clock, Crosshair, Loader2, RotateCcw, Sparkles, Target, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FinalStandings } from "@/components/leaderboard/final-standings";
import { AnswerReview } from "@/components/leaderboard/answer-review";
import { PracticePanel } from "@/components/ai-coach/practice-panel";
import { CoachOffline } from "@/components/ai-coach/coach-offline";
import { useCoachAvailable } from "@/components/ai-coach/use-coach";
import { createMatch } from "@/lib/game/match-engine";
import { sessionStore } from "@/lib/game/session-store";
import { formatDuration } from "@/lib/game/timer";
import { newSeed } from "@/lib/utils/random";
import { cn } from "@/lib/utils/cn";
import type { MatchResult } from "@/types/competition";
import { TOPIC_LABELS } from "@/types/question";

const ORDINAL = ["1st", "2nd", "3rd", "4th"];

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<MatchResult | null>(null);
  const [autoExplainId, setAutoExplainId] = useState<string | null>(null);
  const coachEnabled = useCoachAvailable();

  useEffect(() => {
    const saved = sessionStore.loadResult();
    if (!saved) router.replace("/arena");
    else setResult(saved);
  }, [router]);

  if (!result) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const { student, standings } = result;
  const me = standings.find((s) => s.isStudent)!;
  const winner = standings[0];
  const won = winner.isStudent;
  const delta = student.ratingAfter - student.ratingBefore;
  const wrong = student.perQuestion.filter((r) => r.correctness === 0);
  const weakTopics = [...new Set(wrong.map((r) => r.topic))];

  function playAgain() {
    sessionStore.clearMatch();
    sessionStore.saveMatch(createMatch(result!.config, newSeed(), Date.now() + 3500));
    router.push("/competition");
  }

  function explainMistakes() {
    const target = wrong[0]?.questionId ?? student.perQuestion[0]?.questionId;
    setAutoExplainId(target ?? null);
    window.setTimeout(() => document.getElementById(`review-${target}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Winner banner */}
      <section
        className={cn(
          "animate-rise relative overflow-hidden rounded-2xl border p-8 text-center sm:p-12",
          won ? "border-warning/50 bg-gradient-to-b from-warning/15 to-card" : "border-primary/40 bg-gradient-to-b from-primary/15 to-card",
        )}
      >
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse,black,transparent_70%)]" />
        <div className="relative">
          <Badge variant={result.endReason === "timeout" ? "warning" : "outline"} className="mb-4">
            {result.endReason === "timeout" ? "Time expired" : "Final whistle"} · Machining Sprint
          </Badge>
          <div className="flex items-center justify-center gap-3">
            <Trophy className={cn("size-10", won ? "text-warning" : "text-muted-foreground")} />
            <h1 className={cn("font-display text-5xl font-bold uppercase sm:text-7xl", won && "neon-text")}>
              {won ? "Victory!" : `${winner.name} takes it`}
            </h1>
          </div>
          <p className="mt-3 text-lg text-muted-foreground">
            {won ? "You out-engineered every bot in the arena." : `You finished ${ORDINAL[me.rank - 1] ?? `#${me.rank}`} of ${standings.length}.`}
          </p>
          <div className="mt-6 font-mono text-7xl font-bold tabular-nums sm:text-8xl">
            {student.score}
            <span className="text-2xl text-muted-foreground"> / {student.maxScore}</span>
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">Points</div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={playAgain}>
              <RotateCcw /> Play again
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("review")?.scrollIntoView({ behavior: "smooth" })}>
              <BookOpenCheck /> Review my answers
            </Button>
            <Button size="lg" variant="accent" onClick={explainMistakes} disabled={!coachEnabled}>
              <Sparkles /> Ask Claude to explain my mistakes
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat icon={Target} label="Correct" value={`${student.correct}/${student.perQuestion.length}`} />
        <Stat icon={Crosshair} label="Accuracy" value={`${Math.round(student.accuracy * 100)}%`} />
        <Stat icon={Clock} label="Time taken" value={formatDuration(student.timeTaken)} />
        <Stat
          icon={delta >= 0 ? TrendingUp : TrendingDown}
          label="Match rating"
          value={String(student.ratingAfter)}
          sub={`${delta >= 0 ? "+" : ""}${delta} from ${student.ratingBefore}`}
          subClass={delta >= 0 ? "text-success" : "text-destructive"}
        />
        <Stat icon={Trophy} label="Tier" value={student.tier} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="mb-3 font-display text-2xl font-bold uppercase">Final ranking</h2>
          <FinalStandings standings={standings} questionCount={student.perQuestion.length} />
        </div>
        <div>
          <h2 className="mb-3 font-display text-2xl font-bold uppercase">Performance by topic</h2>
          <div className="space-y-3 rounded-xl border bg-card/80 p-5">
            {student.topics.map((t) => {
              const pct = t.correct / t.total;
              return (
                <div key={t.topic}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{TOPIC_LABELS[t.topic]}</span>
                    <span className="font-mono text-muted-foreground">
                      {t.correct}/{t.total}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", pct === 1 ? "bg-success" : pct > 0 ? "bg-warning" : "bg-destructive")}
                      style={{ width: `${Math.max(pct * 100, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="review" className="mt-10 scroll-mt-20">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-2xl font-bold uppercase">Review my answers</h2>
          <span className="text-sm text-muted-foreground">Correct answers and explanations are now unlocked.</span>
        </div>
        {coachEnabled === false && (
          <div className="mb-3">
            <CoachOffline />
          </div>
        )}
        <AnswerReview results={student.perQuestion} coachEnabled={coachEnabled} autoExplainId={autoExplainId} />
      </section>

      <section className="mt-10">
        <h2 className="mb-1 font-display text-2xl font-bold uppercase">Personalised practice</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Claude writes three new problems targeting your weak topics. Every answer is re-computed by the game engine before
          you see it. Practice problems are not added to the official competition pool.
        </p>
        <PracticePanel weakTopics={weakTopics} difficulty={result.config.difficulty} enabled={coachEnabled} />
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  subClass,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  sub?: string;
  subClass?: string;
}) {
  return (
    <div className="rounded-xl border bg-card/80 p-4">
      <Icon className="mb-2 size-4 text-accent" />
      <div className="font-display text-3xl font-bold uppercase leading-none">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      {sub && <div className={cn("mt-1 text-xs font-semibold", subClass)}>{sub}</div>}
    </div>
  );
}
