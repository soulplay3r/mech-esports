import type { Difficulty } from "@/types/question";
import type { QuestionScore } from "@/types/competition";
import { clamp } from "@/lib/utils/random";

/**
 * Scoring weights. Correctness dominates; difficulty and time bonuses are only
 * awarded on correct answers, so speed can never outweigh engineering accuracy.
 */
export const SCORING_WEIGHTS = {
  correctness: 0.7,
  difficulty: 0.2,
  time: 0.1,
} as const;

/** Total points available in a match, split evenly across questions. */
export const MATCH_MAX_POINTS = 1000;

export const DIFFICULTY_FACTOR: Record<Difficulty, number> = {
  beginner: 0.5,
  intermediate: 0.75,
  advanced: 1,
};

export interface ScoreInput {
  questionId: string;
  correctness: 0 | 1;
  difficulty: Difficulty;
  /** Seconds spent answering. */
  responseTime: number;
  /** Seconds available per question (match duration / question count). */
  timeBudget: number;
  questionCount: number;
}

/** 1 for an instant answer, falling linearly to 0 at the full per-question budget. */
export function timeEfficiency(responseTime: number, timeBudget: number): number {
  if (timeBudget <= 0) return 0;
  return clamp(1 - responseTime / timeBudget, 0, 1);
}

export function scoreQuestion(input: ScoreInput): QuestionScore {
  const perQuestion = MATCH_MAX_POINTS / input.questionCount;
  const c = input.correctness;
  const correctnessPoints = perQuestion * SCORING_WEIGHTS.correctness * c;
  const difficultyPoints = perQuestion * SCORING_WEIGHTS.difficulty * DIFFICULTY_FACTOR[input.difficulty] * c;
  const timePoints = perQuestion * SCORING_WEIGHTS.time * timeEfficiency(input.responseTime, input.timeBudget) * c;
  return {
    questionId: input.questionId,
    correctness: c,
    correctnessPoints,
    difficultyPoints,
    timePoints,
    total: Math.round(correctnessPoints + difficultyPoints + timePoints),
  };
}

export function maxScoreFor(difficulties: Difficulty[]): number {
  const per = MATCH_MAX_POINTS / difficulties.length;
  return Math.round(
    difficulties.reduce(
      (sum, d) => sum + per * (SCORING_WEIGHTS.correctness + SCORING_WEIGHTS.difficulty * DIFFICULTY_FACTOR[d] + SCORING_WEIGHTS.time),
      0,
    ),
  );
}
