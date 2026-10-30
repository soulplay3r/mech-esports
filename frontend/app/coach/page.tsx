"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ai-coach/markdown";
import { CoachOffline } from "@/components/ai-coach/coach-offline";
import { postCoach, useCoachAvailable } from "@/components/ai-coach/use-coach";
import { cn } from "@/lib/utils/cn";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Why does cutting speed fall with tool wear? Explain Taylor's equation.",
  "How do I choose feed and depth of cut for roughing vs finishing?",
  "What is the difference between accuracy and precision in metrology?",
  "How do I find the bottleneck and takt time on a production line?",
  "When should I pick carbide over HSS tooling?",
  "Explain Cp and Cpk with a worked example.",
];

/** Keep the history sent to the server within the route's limits. */
const MAX_HISTORY = 12;

export default function CoachPage() {
  const enabled = useCoachAvailable();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  async function send(text: string) {
    const content = text.trim().slice(0, 2000);
    if (!content || loading) return;
    const next = [...turns, { role: "user" as const, content }];
    setTurns(next);
    setInput("");
    setError(null);
    setLoading(true);
    const res = await postCoach<{ reply: string }>("/api/ai/chat", { messages: next.slice(-MAX_HISTORY) });
    setLoading(false);
    if (res.ok) setTurns([...next, { role: "assistant", content: res.data.reply }]);
    else setError(res.message);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-3xl flex-col px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            <Sparkles className="size-4" /> Powered by Claude
          </div>
          <h1 className="mt-1 font-display text-4xl font-bold uppercase sm:text-5xl">Engineering Coach</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Machining, manufacturing processes, materials, production planning, metrology and quality engineering.
          </p>
        </div>
        {turns.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => { setTurns([]); setError(null); }}>
            <Trash2 /> Clear
          </Button>
        )}
      </div>

      {enabled === false && <CoachOffline />}

      <div className="flex-1 space-y-4 py-4">
        {turns.length === 0 && enabled !== false && (
          <div className="grid gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={!enabled}
                className="cursor-pointer rounded-lg border bg-card/80 p-3 text-left text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}>
            {t.role === "user" ? (
              <div className="max-w-[85%] whitespace-pre-wrap rounded-xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-white">{t.content}</div>
            ) : (
              <div className="w-full max-w-[95%] rounded-xl rounded-bl-sm border bg-card/80 px-4 py-3">
                <Markdown>{t.content}</Markdown>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Coach is working it out…
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div ref={bottom} />
      </div>

      <form
        className="sticky bottom-4 flex gap-2 rounded-xl border bg-card/95 p-2 backdrop-blur"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          placeholder={enabled === false ? "Coach offline" : "Ask about machining, materials, metrology…"}
          maxLength={2000}
          rows={1}
          disabled={!enabled}
          className="min-h-11 resize-none border-0 bg-transparent focus-visible:ring-0"
        />
        <Button type="submit" size="icon" className="size-11" disabled={!enabled || loading || !input.trim()} aria-label="Send">
          <Send />
        </Button>
      </form>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">AI responses can contain mistakes. Check critical numbers.</p>
    </div>
  );
}
