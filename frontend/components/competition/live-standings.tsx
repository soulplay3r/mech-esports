"use client";

import { CheckCircle2, Lock, Radio } from "lucide-react";
import { BotAvatar, StudentAvatar } from "@/components/arena/bot-avatar";
import { Progress } from "@/components/ui/progress";
import { botStateAt, type BotLiveState } from "@/lib/game/bot-engine";
import { getBot } from "@/lib/data/bots";
import { cn } from "@/lib/utils/cn";
import type { BotRun, BotStatus } from "@/types/bot";

const STATUS_STYLE: Record<BotStatus, { label: string; cls: string }> = {
  waiting: { label: "Waiting", cls: "text-muted-foreground border-border" },
  thinking: { label: "Thinking", cls: "text-accent border-accent/40 bg-accent/10" },
  answered: { label: "Answered", cls: "text-success border-success/40 bg-success/10" },
  completed: { label: "Completed", cls: "text-[#8fb8ff] border-primary/40 bg-primary/15" },
};

function ThinkingDots() {
  return (
    <span className="ml-0.5 inline-flex gap-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1 rounded-full bg-current" style={{ animation: `pulse-dot 1.2s ${i * 0.15}s infinite` }} />
      ))}
    </span>
  );
}

export function StatusPill({ status }: { status: BotStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", s.cls)}>
      {s.label}
      {status === "thinking" && <ThinkingDots />}
      {status === "completed" && <CheckCircle2 className="size-3" />}
    </span>
  );
}

export function LiveStandings({
  runs,
  questionCount,
  elapsed,
  studentAnswered,
}: {
  runs: BotRun[];
  questionCount: number;
  elapsed: number;
  studentAnswered: number;
}) {
  const bots = runs
    .map((run) => ({ run, bot: getBot(run.botId)!, state: botStateAt(run, questionCount, elapsed) }))
    .sort((a, b) => b.state.score - a.state.score || b.state.answered - a.state.answered);

  const feed = runs
    .flatMap((run) => run.events.filter((e) => e.answeredAt <= elapsed).map((e) => ({ ...e, botId: run.botId })))
    .sort((a, b) => b.answeredAt - a.answeredAt)
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border bg-card/80">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-display text-sm font-bold uppercase tracking-widest">Live standings</span>
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-destructive">
            <Radio className="size-3 animate-pulse" /> Live
          </span>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center gap-3 bg-primary/10 px-4 py-3">
            <StudentAvatar size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold uppercase">You</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="size-3" /> Sealed
                </span>
              </div>
              <Progress value={(studentAnswered / questionCount) * 100} className="mt-1.5 h-1" />
              <div className="mt-1 text-[11px] text-muted-foreground">
                {studentAnswered}/{questionCount} submitted · score revealed at the final whistle
              </div>
            </div>
          </div>
          {bots.map(({ run, bot, state }) => (
            <BotRow key={run.botId} name={bot.name} avatar={<BotAvatar bot={bot} size="sm" />} state={state} questionCount={questionCount} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card/80 px-4 py-3">
        <div className="mb-2 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">Match feed</div>
        {feed.length === 0 ? (
          <p className="text-xs text-muted-foreground">Opponents are working on their first answers…</p>
        ) : (
          <ul className="space-y-1.5">
            {feed.map((e) => (
              <li key={`${e.botId}-${e.questionId}`} className="animate-rise text-xs">
                <span className="font-semibold">{getBot(e.botId)!.name}</span>{" "}
                <span className="text-muted-foreground">locked in Q{e.questionIndex + 1}</span>{" "}
                <span className={e.correct ? "text-success" : "text-destructive"}>{e.correct ? `+${e.points}` : "+0"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function BotRow({
  name,
  avatar,
  state,
  questionCount,
}: {
  name: string;
  avatar: React.ReactNode;
  state: BotLiveState;
  questionCount: number;
}) {
  return (
    <div key={`${name}-${state.answered}`} className={cn("flex items-center gap-3 px-4 py-3", state.status === "answered" && "animate-flash")}>
      {avatar}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display font-bold uppercase">{name}</span>
          <span className="font-mono text-lg font-bold leading-none">{state.score}</span>
        </div>
        <Progress value={(state.answered / questionCount) * 100} className="mt-1.5 h-1" />
        <div className="mt-1 flex items-center justify-between">
          <StatusPill status={state.status} />
          <span className="font-mono text-[11px] text-muted-foreground">
            {state.currentQuestion === null ? `${questionCount}/${questionCount}` : `Q${state.currentQuestion + 1}/${questionCount}`}
          </span>
        </div>
      </div>
    </div>
  );
}
