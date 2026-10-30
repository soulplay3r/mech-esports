import Link from "next/link";
import { ArrowRight, Bot, Clock, Crown, Gauge, ListChecks, Sparkles, Swords, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BotCard } from "@/components/arena/bot-card";
import { BotAvatar, StudentAvatar } from "@/components/arena/bot-avatar";
import { BOTS } from "@/lib/data/bots";
import { TOPICS, TOPIC_LABELS } from "@/types/question";

const SAMPLE_BOARD = [
  { id: "riya", score: 912, correct: 5 },
  { id: "you", score: 868, correct: 5 },
  { id: "alex", score: 741, correct: 4 },
  { id: "max", score: 702, correct: 4 },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

      {/* Hero */}
      <section className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
        <div className="animate-rise">
          <Badge variant="accent" className="mb-6">
            <Swords /> Season 0 · Manufacturing Engineering
          </Badge>
          <h1 className="font-display text-6xl font-bold uppercase leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl">
            Engineering
            <br />
            is a <span className="neon-text bg-gradient-to-r from-primary via-sky-400 to-accent bg-clip-text text-transparent">sport.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
            Think like an engineer. Compete against the best. Prove what you know.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="xl">
              <Link href="/arena">
                Enter the Arena <ArrowRight className="size-5" />
              </Link>
            </Button>
            <span className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Compete. Prove. Dominate.
            </span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No sign-up. Jump straight into a match.</p>
        </div>

        {/* Live match preview */}
        <Card className="animate-rise relative self-center overflow-hidden [animation-delay:120ms]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Manufacturing Engineering</div>
              <CardTitle className="mt-1 text-2xl">Machining Sprint</CardTitle>
            </div>
            <div className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 font-mono text-2xl font-bold text-accent">7:42</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border bg-surface-2 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">Q1 · Cutting Speed</Badge>
              </div>
              <p className="text-sm">
                A lathe operates at a cutting speed of <b className="text-accent">120 m/min</b>. The workpiece diameter is{" "}
                <b className="text-accent">60 mm</b>. Calculate spindle speed.
              </p>
            </div>
            {[
              { bot: BOTS[0], status: "Answered", q: 3, cls: "text-success" },
              { bot: BOTS[1], status: "Thinking…", q: 2, cls: "text-accent" },
              { bot: BOTS[2], status: "Thinking…", q: 2, cls: "text-accent" },
            ].map(({ bot, status, q, cls }) => (
              <div key={bot.id} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
                <BotAvatar bot={bot} size="sm" />
                <span className="font-display font-bold uppercase">{bot.name}</span>
                <span className={`text-xs font-semibold ${cls}`}>{status}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">Q{q}/5</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Sprint preview */}
      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SectionHeading icon={Gauge} eyebrow="Featured competition" title="Machining Sprint" />
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: ListChecks, label: "Questions", value: "5" },
            { icon: Clock, label: "Time limit", value: "10 min" },
            { icon: Gauge, label: "Difficulty", value: "Intermediate" },
            { icon: Swords, label: "Opponents", value: "3 AI bots" },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="p-5">
              <Icon className="mb-3 size-5 text-accent" />
              <div className="font-display text-3xl font-bold uppercase">{value}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
            </Card>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {TOPICS.map((t, i) => (
            <span key={t} className="rounded-md border bg-card px-3 py-1.5 text-sm">
              <span className="mr-2 font-mono text-xs text-accent">0{i + 1}</span>
              {TOPIC_LABELS[t]}
            </span>
          ))}
        </div>
      </section>

      {/* Bots */}
      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SectionHeading icon={Bot} eyebrow="Your rivals" title="AI engineering opponents" />
        <div className="grid gap-4 md:grid-cols-3">
          {BOTS.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      </section>

      {/* Leaderboard + Coach */}
      <section className="relative mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <div>
          <SectionHeading icon={Trophy} eyebrow="Sample result" title="Leaderboard" />
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {SAMPLE_BOARD.map((row, i) => {
                const bot = BOTS.find((b) => b.id === row.id);
                return (
                  <div key={row.id} className={`flex items-center gap-4 px-5 py-3 ${row.id === "you" ? "bg-primary/10" : ""}`}>
                    <span className="w-6 font-display text-2xl font-bold text-muted-foreground">{i + 1}</span>
                    {bot ? <BotAvatar bot={bot} size="sm" /> : <StudentAvatar size="sm" />}
                    <span className="font-display text-lg font-bold uppercase">{bot?.name ?? "You"}</span>
                    {i === 0 && <Crown className="size-4 text-warning" />}
                    <span className="ml-auto text-xs text-muted-foreground">{row.correct}/5 correct</span>
                    <span className="w-14 text-right font-mono text-lg font-bold">{row.score}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
        <div>
          <SectionHeading icon={Sparkles} eyebrow="Powered by Claude" title="Engineering Coach" />
          <Card className="h-[calc(100%-4.5rem)]">
            <CardContent className="space-y-3 p-5">
              <div className="ml-auto w-fit max-w-[85%] rounded-lg rounded-br-sm bg-primary px-4 py-2 text-sm">
                Why was 2000 RPM wrong?
              </div>
              <div className="max-w-[90%] rounded-lg rounded-bl-sm border bg-surface-2 px-4 py-3 text-sm text-muted-foreground">
                <p className="mb-1 font-semibold text-foreground">Where your answer went wrong</p>
                You used N = 1000V / D and skipped the π. The circumference of a 60 mm workpiece is π × 60 = 188.5 mm, so
                N = 120000 / 188.5 ≈ <span className="font-semibold text-accent">637 RPM</span>.
              </div>
              <p className="pt-2 text-xs text-muted-foreground">
                After every match, Claude walks you through your mistakes using the approved reference solution, then builds a
                personalised practice set for your weakest topics.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-8 text-center sm:px-6">
        <h2 className="font-display text-4xl font-bold uppercase sm:text-5xl">Ready to compete?</h2>
        <Button asChild size="xl" className="mt-6">
          <Link href="/arena">
            Enter the Arena <ArrowRight className="size-5" />
          </Link>
        </Button>
      </section>
    </div>
  );
}

function SectionHeading({ icon: Icon, eyebrow, title }: { icon: typeof Bot; eyebrow: string; title: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
        <Icon className="size-4" /> {eyebrow}
      </div>
      <h2 className="mt-1 font-display text-3xl font-bold uppercase sm:text-4xl">{title}</h2>
    </div>
  );
}
