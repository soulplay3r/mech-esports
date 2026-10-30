import { Check, Gauge, Target, Zap } from "lucide-react";
import type { BotProfile } from "@/types/bot";
import { cn } from "@/lib/utils/cn";
import { BotAvatar } from "./bot-avatar";

function Meter({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Zap }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="w-16 text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

export function BotCard({
  bot,
  selected,
  onToggle,
  compact = false,
}: {
  bot: BotProfile;
  selected?: boolean;
  onToggle?: () => void;
  compact?: boolean;
}) {
  const interactive = Boolean(onToggle);
  const avgAccuracy = (bot.accuracy.beginner + bot.accuracy.intermediate + bot.accuracy.advanced) / 3;
  const Comp = interactive ? "button" : "div";
  return (
    <Comp
      type={interactive ? "button" : undefined}
      onClick={onToggle}
      aria-pressed={interactive ? selected : undefined}
      className={cn(
        "group relative flex w-full flex-col gap-3 rounded-xl border bg-card/80 p-4 text-left transition",
        interactive && "cursor-pointer hover:border-primary/50",
        selected && "border-primary/70 neon-ring",
        interactive && !selected && "opacity-60 hover:opacity-100",
      )}
    >
      {interactive && (
        <span
          className={cn(
            "absolute right-3 top-3 grid size-5 place-items-center rounded-full border",
            selected ? "border-primary bg-primary text-white" : "border-border",
          )}
        >
          {selected && <Check className="size-3" strokeWidth={3} />}
        </span>
      )}
      <div className="flex items-center gap-3">
        <BotAvatar bot={bot} />
        <div>
          <div className="font-display text-xl font-bold uppercase leading-none">{bot.name}</div>
          <div className="mt-1 text-xs font-medium text-accent">{bot.title}</div>
        </div>
        <div className="ml-auto mr-6 text-right">
          <div className="font-mono text-lg font-bold leading-none">{bot.rating}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rating</div>
        </div>
      </div>
      {!compact && <p className="text-sm text-muted-foreground">{bot.tagline}</p>}
      <div className="space-y-1.5">
        <Meter label="Speed" value={1 - bot.speed} icon={Zap} />
        <Meter label="Accuracy" value={avgAccuracy} icon={Target} />
        <Meter label="Advanced" value={bot.accuracy.advanced} icon={Gauge} />
      </div>
      {!compact && (
        <ul className="flex flex-wrap gap-1.5">
          {bot.traits.map((t) => (
            <li key={t} className="rounded border border-border bg-secondary/60 px-2 py-0.5 text-[11px] text-muted-foreground">
              {t}
            </li>
          ))}
        </ul>
      )}
    </Comp>
  );
}
