"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Gauge, Lightbulb, ListChecks, Lock, Play, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BotCard } from "@/components/arena/bot-card";
import { OptionGroup } from "@/components/arena/option-group";
import { BOTS } from "@/lib/data/bots";
import { COMPETITIONS, DEFAULT_MATCH_CONFIG, DURATION_OPTIONS, QUESTION_COUNT_OPTIONS } from "@/lib/data/competitions";
import { createMatch, validateConfig } from "@/lib/game/match-engine";
import { sessionStore } from "@/lib/game/session-store";
import { newSeed } from "@/lib/utils/random";
import { cn } from "@/lib/utils/cn";
import type { MatchConfig } from "@/types/competition";
import { DIFFICULTIES, DIFFICULTY_LABELS } from "@/types/question";

/** Seconds of 3-2-1 countdown before the clock starts. */
const COUNTDOWN_MS = 3500;

export default function ArenaPage() {
  const router = useRouter();
  const [config, setConfig] = useState<MatchConfig>(DEFAULT_MATCH_CONFIG);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const saved = sessionStore.loadConfig();
    if (saved && !validateConfig(saved)) setConfig(saved);
  }, []);

  const error = validateConfig(config);
  const update = (patch: Partial<MatchConfig>) => setConfig((c) => ({ ...c, ...patch }));
  const toggleBot = (id: string) =>
    update({ botIds: config.botIds.includes(id) ? config.botIds.filter((b) => b !== id) : [...config.botIds, id] });

  function start() {
    if (error) return;
    setStarting(true);
    const ordered = { ...config, botIds: BOTS.filter((b) => config.botIds.includes(b.id)).map((b) => b.id) };
    sessionStore.clearMatch();
    sessionStore.saveConfig(ordered);
    sessionStore.saveMatch(createMatch(ordered, newSeed(), Date.now() + COUNTDOWN_MS));
    router.push("/competition");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            <Swords className="size-4" /> The Arena
          </div>
          <h1 className="mt-1 font-display text-5xl font-bold uppercase">Choose your competition</h1>
        </div>
        <Badge variant="outline">Manufacturing Engineering</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COMPETITIONS.map((c) => (
          <div
            key={c.id}
            className={cn(
              "relative flex flex-col rounded-xl border bg-card/80 p-5 transition",
              c.available ? "border-primary/70 neon-ring" : "opacity-55",
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{c.discipline}</span>
              {c.available ? <Badge variant="success">Live</Badge> : <Badge variant="outline"><Lock /> Coming soon</Badge>}
            </div>
            <div className="font-display text-2xl font-bold uppercase leading-tight">{c.name}</div>
            <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px]">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-bold uppercase">Select opponents</h2>
            <span className="text-sm text-muted-foreground">{config.botIds.length} of {BOTS.length} selected</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {BOTS.map((bot) => (
              <BotCard key={bot.id} bot={bot} selected={config.botIds.includes(bot.id)} onToggle={() => toggleBot(bot.id)} />
            ))}
          </div>
        </section>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-2xl">Machining Sprint</CardTitle>
            <p className="text-sm text-muted-foreground">Defaults: 5 questions · 10 minutes · 3 opponents.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <OptionGroup
              label="Difficulty"
              icon={Gauge}
              value={config.difficulty}
              options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_LABELS[d] }))}
              onChange={(difficulty) => update({ difficulty })}
            />
            <OptionGroup
              label="Questions"
              icon={ListChecks}
              value={config.questionCount}
              options={QUESTION_COUNT_OPTIONS.map((n) => ({ value: n, label: String(n) }))}
              onChange={(questionCount) => update({ questionCount })}
            />
            <OptionGroup
              label="Duration"
              icon={Clock}
              value={config.durationSec}
              options={DURATION_OPTIONS.map((d) => ({ value: d.sec, label: d.label }))}
              onChange={(durationSec) => update({ durationSec })}
            />
            <OptionGroup
              label="Formula hints"
              icon={Lightbulb}
              value={config.showFormulaHints}
              options={[
                { value: true, label: "On" },
                { value: false, label: "Off" },
              ]}
              onChange={(showFormulaHints) => update({ showFormulaHints })}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button size="xl" className="w-full" disabled={Boolean(error) || starting} onClick={start}>
              <Play className="size-5" /> {starting ? "Loading arena…" : "Start match"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Scoring: 70% correctness · 20% difficulty · 10% speed. Speed only counts on correct answers.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
