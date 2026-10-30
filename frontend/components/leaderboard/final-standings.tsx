import { Crown, Medal } from "lucide-react";
import { BotAvatar, StudentAvatar } from "@/components/arena/bot-avatar";
import { getBot } from "@/lib/data/bots";
import { formatDuration } from "@/lib/game/timer";
import { cn } from "@/lib/utils/cn";
import type { Standing } from "@/types/competition";

const RANK_STYLE = ["text-warning", "text-slate-300", "text-amber-600", "text-muted-foreground"];

export function FinalStandings({ standings, questionCount }: { standings: Standing[]; questionCount: number }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border bg-card/80">
      {standings.map((s, i) => {
        const bot = getBot(s.id);
        return (
          <div
            key={s.id}
            className={cn("animate-rise flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5", s.isStudent && "bg-primary/10")}
            style={{ animationDelay: `${150 + i * 120}ms` }}
          >
            <span className={cn("w-7 font-display text-3xl font-bold", RANK_STYLE[i] ?? "text-muted-foreground")}>{s.rank}</span>
            {bot ? <BotAvatar bot={bot} size="sm" /> : <StudentAvatar size="sm" />}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-display text-lg font-bold uppercase leading-none">
                {s.name} {i === 0 ? <Crown className="size-4 text-warning" /> : i < 3 ? <Medal className={cn("size-4", RANK_STYLE[i])} /> : null}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {s.correct}/{questionCount} correct · {s.answered < questionCount ? `${s.answered} answered · ` : ""}
                {formatDuration(s.timeTaken)}
              </div>
            </div>
            <span className="ml-auto font-mono text-2xl font-bold tabular-nums">{s.score}</span>
          </div>
        );
      })}
    </div>
  );
}
