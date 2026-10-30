import { Timer } from "lucide-react";
import { formatClock } from "@/lib/game/timer";
import { cn } from "@/lib/utils/cn";

export function MatchClock({ remainingMs, totalMs }: { remainingMs: number; totalMs: number }) {
  const fraction = totalMs > 0 ? remainingMs / totalMs : 0;
  const critical = remainingMs <= 30_000;
  const low = remainingMs <= 120_000;
  return (
    <div
      role="timer"
      aria-label={`Time remaining ${formatClock(remainingMs)}`}
      className={cn(
        "relative flex items-center gap-2 overflow-hidden rounded-lg border px-4 py-2",
        critical ? "border-destructive/60 bg-destructive/10 text-destructive" : low ? "border-warning/50 bg-warning/10 text-warning" : "border-accent/40 bg-accent/10 text-accent",
      )}
    >
      <Timer className={cn("size-5", critical && "animate-pulse")} />
      <span className="font-mono text-3xl font-bold tabular-nums">{formatClock(remainingMs)}</span>
      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-current/60 transition-[width] duration-300" style={{ width: `${fraction * 100}%` }} />
    </div>
  );
}
