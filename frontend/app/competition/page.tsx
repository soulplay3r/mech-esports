"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MatchClock } from "@/components/competition/match-clock";
import { LiveStandings } from "@/components/competition/live-standings";
import { QuestionPanel, emptyDraft } from "@/components/competition/question-panel";
import { getBot } from "@/lib/data/bots";
import { simulateBot } from "@/lib/game/bot-engine";
import { addTimeOnQuestion, computeResult, finishMatch, matchQuestions, submitAnswer } from "@/lib/game/match-engine";
import { sessionStore } from "@/lib/game/session-store";
import { remainingMs } from "@/lib/game/timer";
import { cn } from "@/lib/utils/cn";
import type { MatchState } from "@/types/competition";
import type { StudentAnswer } from "@/types/question";

const TICK_MS = 250;

export default function CompetitionPage() {
  const router = useRouter();
  const [match, setMatch] = useState<MatchState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [current, setCurrent] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, StudentAnswer>>({});
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const lastTick = useRef<number | null>(null);
  const ending = useRef(false);

  // Load (or recover after refresh) the match from session storage.
  useEffect(() => {
    const saved = sessionStore.loadMatch();
    if (!saved) {
      router.replace("/arena");
      return;
    }
    if (saved.status === "finished") {
      if (!sessionStore.loadResult()) sessionStore.saveResult(computeResult(saved));
      router.replace("/results");
      return;
    }
    setMatch(saved);
    setDrafts(Object.fromEntries(Object.entries(saved.answers).map(([id, r]) => [id, r.answer])));
  }, [router]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const questions = useMemo(() => (match ? matchQuestions(match) : []), [match?.questionIds]); // eslint-disable-line react-hooks/exhaustive-deps
  const runs = useMemo(
    () => (match ? match.config.botIds.map((id) => simulateBot(getBot(id)!, questions, match.config.durationSec, match.seed)) : []),
    [match?.seed, questions], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const end = useCallback(
    (state: MatchState, reason: "submitted" | "timeout") => {
      if (ending.current) return;
      ending.current = true;
      const finished = finishMatch(state, Date.now(), reason);
      sessionStore.saveMatch(finished);
      sessionStore.saveResult(computeResult(finished));
      router.push("/results");
    },
    [router],
  );

  // Per-tick bookkeeping: active time on the current question, persistence, expiry.
  useEffect(() => {
    if (!match || match.status !== "live") return;
    const prev = lastTick.current ?? now;
    lastTick.current = now;
    if (now >= match.endsAt) {
      end(match, "timeout");
      return;
    }
    const from = Math.max(prev, match.startedAt);
    const delta = (now - from) / 1000;
    const qid = match.questionIds[current];
    if (delta > 0 && delta < 5 && document.visibilityState === "visible") {
      const next = addTimeOnQuestion(match, qid, delta);
      setMatch(next);
      sessionStore.saveMatch(next);
    }
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!match || questions.length === 0) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const question = questions[current];
  const draft = drafts[question.id] ?? emptyDraft(question);
  const countdown = now < match.startedAt;
  const expired = now >= match.endsAt;
  const elapsed = (Math.min(now, match.endsAt) - match.startedAt) / 1000;
  const answeredCount = Object.keys(match.answers).length;
  const unanswered = questions.length - answeredCount;

  function handleSubmit() {
    if (!match) return;
    const result = submitAnswer(match, question.id, draft, Date.now());
    if (!result.ok) {
      setNotice(result.reason);
      return;
    }
    setNotice(null);
    setMatch(result.state);
    sessionStore.saveMatch(result.state);
    // Move to the next unanswered question.
    const nextIdx = questions.findIndex((q, i) => i > current && !result.state.answers[q.id]);
    if (nextIdx !== -1) window.setTimeout(() => setCurrent(nextIdx), 600);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {countdown && <CountdownOverlay ms={match.startedAt - now} />}

      {/* HUD */}
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border bg-card/80 px-4 py-3">
        <div className="mr-auto">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Manufacturing Engineering</div>
          <div className="font-display text-2xl font-bold uppercase leading-none">Machining Sprint</div>
        </div>
        <div className="hidden min-w-48 sm:block">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-mono">
              {answeredCount}/{questions.length}
            </span>
          </div>
          <Progress value={(answeredCount / questions.length) * 100} />
        </div>
        <MatchClock remainingMs={countdown ? match.config.durationSec * 1000 : remainingMs(match.endsAt, now)} totalMs={match.config.durationSec * 1000} />
        <Button variant="outline" onClick={() => setConfirmFinish(true)} disabled={countdown || expired}>
          <Flag /> Finish match
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          {/* Question navigator */}
          <nav aria-label="Questions" className="flex flex-wrap gap-2">
            {questions.map((q, i) => {
              const answered = Boolean(match.answers[q.id]);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-current={i === current ? "step" : undefined}
                  className={cn(
                    "h-10 min-w-10 cursor-pointer rounded-lg border px-3 font-mono text-sm font-bold transition",
                    i === current && "border-primary neon-ring",
                    answered ? "bg-success/15 text-success" : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </nav>

          <QuestionPanel
            question={question}
            index={current}
            total={questions.length}
            draft={draft}
            submitted={match.answers[question.id]}
            showHint={match.config.showFormulaHints}
            disabled={countdown || expired}
            onDraft={(d) => setDrafts((all) => ({ ...all, [question.id]: d }))}
            onSubmit={handleSubmit}
            onNavigate={setCurrent}
          />
          {notice && <p className="text-sm text-destructive">{notice}</p>}
          {answeredCount === questions.length && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-success/40 bg-success/10 px-4 py-3">
              <span className="text-sm text-success">All answers submitted. Review them or end the match now.</span>
              <Button variant="accent" onClick={() => end(match, "submitted")}>
                <Flag /> Final submit
              </Button>
            </div>
          )}
        </div>

        <LiveStandings runs={runs} questionCount={questions.length} elapsed={countdown ? 0 : elapsed} studentAnswered={answeredCount} />
      </div>

      {confirmFinish && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="animate-rise w-full max-w-md rounded-xl border bg-card p-6">
            <h2 className="font-display text-2xl font-bold uppercase">End the match?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {unanswered > 0
                ? `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. They will score zero.`
                : "Your recorded answers will be final."}{" "}
              Opponents keep their full time.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmFinish(false)}>
                Keep playing
              </Button>
              <Button onClick={() => end(match, "submitted")}>
                <Flag /> Final submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CountdownOverlay({ ms }: { ms: number }) {
  const n = Math.ceil(ms / 1000);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 backdrop-blur-sm">
      <div className="text-center">
        <div className="text-sm font-semibold uppercase tracking-[0.4em] text-muted-foreground">Match starts in</div>
        <div key={n} className="animate-rise neon-text font-display text-[10rem] font-bold leading-none text-accent">
          {n > 3 ? "READY" : n}
        </div>
      </div>
    </div>
  );
}
