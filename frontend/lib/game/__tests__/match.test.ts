import { describe, expect, it } from "vitest";
import {
  addTimeOnQuestion,
  computeResult,
  createMatch,
  finishMatch,
  matchQuestions,
  selectQuestions,
  submitAnswer,
} from "@/lib/game/match-engine";
import { botStateAt, simulateBot } from "@/lib/game/bot-engine";
import { formatClock, isExpired, remainingMs } from "@/lib/game/timer";
import { DEFAULT_MATCH_CONFIG } from "@/lib/data/competitions";
import { BOTS, getBot } from "@/lib/data/bots";
import type { MatchState } from "@/types/competition";
import type { Question, StudentAnswer } from "@/types/question";

const T0 = 1_700_000_000_000;

function correctAnswer(q: Question): StudentAnswer {
  return q.kind === "numeric"
    ? { kind: "numeric", value: String(q.answer), unit: q.unit }
    : { kind: "mcq", optionId: q.correctOptionId };
}

function playPerfect(seed: number, secondsPerQuestion = 50): MatchState {
  let state = createMatch(DEFAULT_MATCH_CONFIG, seed, T0);
  let t = T0;
  for (const q of matchQuestions(state)) {
    state = addTimeOnQuestion(state, q.id, secondsPerQuestion);
    t += secondsPerQuestion * 1000;
    const r = submitAnswer(state, q.id, correctAnswer(q), t);
    if (!r.ok) throw new Error(r.reason);
    state = r.state;
  }
  return finishMatch(state, t, "submitted");
}

describe("question selection", () => {
  it("default sprint is the five intermediate topics in order", () => {
    expect(selectQuestions("intermediate", 5).map((q) => q.id)).toEqual([
      "cs-int-1",
      "mt-int-1",
      "fr-int-1",
      "mrr-int-1",
      "po-int-1",
    ]);
  });
  it("fills longer sprints from the nearest difficulty", () => {
    const qs = selectQuestions("intermediate", 8);
    expect(qs).toHaveLength(8);
    expect(qs.slice(5).every((q) => q.difficulty === "advanced")).toBe(true);
    expect(selectQuestions("beginner", 3).every((q) => q.difficulty === "beginner")).toBe(true);
  });
});

describe("timer", () => {
  it("counts down and expires", () => {
    expect(remainingMs(T0 + 600_000, T0)).toBe(600_000);
    expect(remainingMs(T0 + 600_000, T0 + 700_000)).toBe(0);
    expect(isExpired(T0 + 1000, T0 + 999)).toBe(false);
    expect(isExpired(T0 + 1000, T0 + 1000)).toBe(true);
    expect(formatClock(600_000)).toBe("10:00");
    expect(formatClock(65_001)).toBe("1:06");
    expect(formatClock(0)).toBe("0:00");
  });
});

describe("match lifecycle", () => {
  it("records, revises and rejects submissions after expiry", () => {
    let state = createMatch(DEFAULT_MATCH_CONFIG, 42, T0);
    expect(state.endsAt - state.startedAt).toBe(600_000);
    const [q1] = matchQuestions(state);
    const first = submitAnswer(state, q1.id, { kind: "numeric", value: "600", unit: "RPM" }, T0 + 10_000);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = submitAnswer(first.state, q1.id, { kind: "numeric", value: "637", unit: "RPM" }, T0 + 20_000);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    state = second.state;
    expect(state.answers[q1.id].revisions).toBe(1);

    const late = submitAnswer(state, q1.id, { kind: "numeric", value: "1", unit: "RPM" }, T0 + 600_000);
    expect(late).toEqual({ ok: false, reason: "Time is up. Submissions are closed." });
  });

  it("auto-ends as a timeout when finished after expiry", () => {
    const state = createMatch(DEFAULT_MATCH_CONFIG, 1, T0);
    const done = finishMatch(state, T0 + 999_999, "submitted");
    expect(done.endReason).toBe("timeout");
    expect(done.finishedAt).toBe(state.endsAt);
    const r = computeResult(done);
    expect(r.student.score).toBe(0);
    expect(r.student.answered).toBe(0);
    expect(r.endReason).toBe("timeout");
  });

  it("rejects submissions during the pre-match countdown", () => {
    const state = createMatch(DEFAULT_MATCH_CONFIG, 1, T0 + 3000);
    expect(submitAnswer(state, state.questionIds[0], { kind: "mcq", optionId: "a" }, T0).ok).toBe(false);
  });

  it("rejects submissions once finished", () => {
    const state = finishMatch(createMatch(DEFAULT_MATCH_CONFIG, 1, T0), T0 + 5000, "submitted");
    expect(submitAnswer(state, state.questionIds[0], { kind: "mcq", optionId: "a" }, T0 + 6000).ok).toBe(false);
  });

  it("computes a complete result with standings", () => {
    const result = computeResult(playPerfect(7));
    expect(result.student.correct).toBe(5);
    expect(result.student.accuracy).toBe(1);
    expect(result.standings).toHaveLength(4);
    expect(result.standings.map((s) => s.rank)).toEqual([1, 2, 3, 4]);
    const scores = result.standings.map((s) => s.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(result.student.score).toBeLessThanOrEqual(result.student.maxScore);
    expect(result.student.topics).toHaveLength(5);
  });

  it("is deterministic for the same seed", () => {
    expect(computeResult(playPerfect(99))).toEqual(computeResult(playPerfect(99)));
  });
});

describe("bot simulation", () => {
  const questions = selectQuestions("intermediate", 5);

  it("never fabricates impossible scores", () => {
    for (let seed = 0; seed < 300; seed++) {
      for (const bot of BOTS) {
        const run = simulateBot(bot, questions, 600, seed);
        expect(run.events.length).toBeLessThanOrEqual(5);
        for (const e of run.events) {
          expect(e.answeredAt).toBeLessThanOrEqual(600);
          expect(e.points).toBeGreaterThanOrEqual(0);
          expect(e.points).toBeLessThanOrEqual(200);
          if (!e.correct) expect(e.points).toBe(0);
        }
        const times = run.events.map((e) => e.answeredAt);
        expect([...times].sort((a, b) => a - b)).toEqual(times);
      }
    }
  });

  it("bots answer at different times and Alex is fastest on average", () => {
    const avgFinish: Record<string, number> = {};
    for (const bot of BOTS) {
      let sum = 0;
      for (let seed = 0; seed < 200; seed++) sum += simulateBot(bot, questions, 600, seed).events[0]?.answeredAt ?? 600;
      avgFinish[bot.id] = sum / 200;
    }
    expect(avgFinish.alex).toBeLessThan(avgFinish.max);
    expect(avgFinish.max).toBeLessThan(avgFinish.riya);
    const run = BOTS.map((b) => simulateBot(b, questions, 600, 5).events[0].answeredAt);
    expect(new Set(run).size).toBe(3);
  });

  it("produces varied outcomes: every bot wins sometimes and the strongest does not always win", () => {
    const wins: Record<string, number> = { alex: 0, riya: 0, max: 0 };
    const scoreSets = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const runs = BOTS.map((b) => simulateBot(b, questions, 600, seed));
      const totals = runs.map((r) => r.events.reduce((s, e) => s + e.points, 0));
      scoreSets.add(totals.join(","));
      wins[runs[totals.indexOf(Math.max(...totals))].botId]++;
    }
    expect(wins.alex).toBeGreaterThan(0);
    expect(wins.riya).toBeGreaterThan(0);
    expect(wins.max).toBeGreaterThan(0);
    expect(wins.max).toBeLessThan(450);
    expect(scoreSets.size).toBeGreaterThan(100);
  });

  it("gives a strong student a realistic but not guaranteed chance", () => {
    let studentWins = 0;
    const mixedWins = new Set<string>();
    for (let seed = 0; seed < 300; seed++) {
      const perfect = computeResult(playPerfect(seed, 80));
      if (perfect.standings[0].isStudent) studentWins++;
      // A student who gets one wrong should lose sometimes.
      let s = createMatch(DEFAULT_MATCH_CONFIG, seed, T0);
      const qs = matchQuestions(s);
      qs.forEach((q, i) => {
        s = addTimeOnQuestion(s, q.id, 80);
        const ans = i === 0 ? ({ kind: "numeric", value: "1", unit: "RPM" } as const) : correctAnswer(q);
        const r = submitAnswer(s, q.id, ans, T0 + (i + 1) * 80_000);
        if (r.ok) s = r.state;
      });
      mixedWins.add(computeResult(finishMatch(s, T0 + 400_000, "submitted")).standings[0].id);
    }
    expect(studentWins).toBeGreaterThan(150);
    expect(mixedWins.size).toBeGreaterThan(1);
  });

  it("reports live statuses as the match unfolds", () => {
    const run = simulateBot(getBot("riya")!, questions, 600, 3);
    expect(botStateAt(run, 5, 0).status).toBe("waiting");
    expect(botStateAt(run, 5, 1).status).toBe("thinking");
    const first = run.events[0];
    expect(botStateAt(run, 5, first.answeredAt + 0.5).status).toBe("answered");
    expect(botStateAt(run, 5, first.answeredAt + 0.5).answered).toBe(1);
    expect(botStateAt(run, 5, first.answeredAt + 5).status).toBe("thinking");
    const fast = simulateBot(getBot("alex")!, questions, 600, 3);
    if (fast.events.length === 5) expect(botStateAt(fast, 5, 600).status).toBe("completed");
  });
});
