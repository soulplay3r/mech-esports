import type { BotAnswerEvent, BotProfile, BotRun, BotStatus } from "@/types/bot";
import type { Difficulty, Question } from "@/types/question";
import { clamp, createRng, hashString, normal } from "@/lib/utils/random";
import { scoreQuestion } from "./scoring";

/** Harder questions take longer for everyone. */
const DIFFICULTY_TIME_FACTOR: Record<Difficulty, number> = {
  beginner: 0.8,
  intermediate: 1,
  advanced: 1.25,
};

const MIN_RESPONSE_SEC = 6;
/** How long a bot shows the "answered" flash before it starts thinking again. */
export const ANSWERED_FLASH_SEC = 2.5;

export function correctProbability(profile: BotProfile, question: Question, form: number): number {
  const base = profile.accuracy[question.difficulty] + (profile.topicBonus[question.topic] ?? 0) + form;
  return clamp(base, 0.05, 0.97);
}

/**
 * Simulates a bot's whole match up front from a seed. No AI calls: correctness
 * and timing come from the bot's probability profile and a seeded PRNG, and
 * points come from the same scoring engine the student uses.
 */
export function simulateBot(
  profile: BotProfile,
  questions: Question[],
  durationSec: number,
  matchSeed: number,
): BotRun {
  const rng = createRng(matchSeed ^ hashString(profile.id));
  const form = normal(rng) * profile.formVariance;
  const timeBudget = durationSec / questions.length;
  const events: BotAnswerEvent[] = [];
  let clock = 0;

  questions.forEach((question, index) => {
    const mean = profile.speed * timeBudget * DIFFICULTY_TIME_FACTOR[question.difficulty];
    const sigma = profile.speedSpread;
    const responseTime = Math.max(MIN_RESPONSE_SEC, mean * Math.exp(sigma * normal(rng) - (sigma * sigma) / 2));
    const knows = rng() < correctProbability(profile, question, form);
    const blunder = rng() < profile.blunderRate;
    clock += responseTime;
    if (clock > durationSec) return;
    const correct = knows && !blunder;
    const score = scoreQuestion({
      questionId: question.id,
      correctness: correct ? 1 : 0,
      difficulty: question.difficulty,
      responseTime,
      timeBudget,
      questionCount: questions.length,
    });
    events.push({
      questionId: question.id,
      questionIndex: index,
      answeredAt: clock,
      responseTime,
      correct,
      points: score.total,
    });
  });

  return { botId: profile.id, form, events };
}

export interface BotLiveState {
  status: BotStatus;
  answered: number;
  correct: number;
  score: number;
  /** Index of the question the bot is working on, or null when done. */
  currentQuestion: number | null;
}

/** The bot's visible state at `elapsed` seconds into the match. */
export function botStateAt(run: BotRun, questionCount: number, elapsed: number): BotLiveState {
  if (elapsed <= 0) {
    return { status: "waiting", answered: 0, correct: 0, score: 0, currentQuestion: 0 };
  }
  const done = run.events.filter((e) => e.answeredAt <= elapsed);
  const score = done.reduce((s, e) => s + e.points, 0);
  const correct = done.filter((e) => e.correct).length;
  const answered = done.length;
  if (answered === questionCount) {
    return { status: "completed", answered, correct, score, currentQuestion: null };
  }
  const last = done[done.length - 1];
  const status: BotStatus = last && elapsed - last.answeredAt < ANSWERED_FLASH_SEC ? "answered" : "thinking";
  return { status, answered, correct, score, currentQuestion: answered };
}
