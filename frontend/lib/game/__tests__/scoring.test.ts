import { describe, expect, it } from "vitest";
import { MATCH_MAX_POINTS, SCORING_WEIGHTS, maxScoreFor, scoreQuestion, timeEfficiency } from "@/lib/game/scoring";

const base = { questionId: "q", difficulty: "intermediate" as const, timeBudget: 120, questionCount: 5 };

describe("scoring engine", () => {
  it("uses 70/20/10 weights", () => {
    expect(SCORING_WEIGHTS.correctness + SCORING_WEIGHTS.difficulty + SCORING_WEIGHTS.time).toBeCloseTo(1);
    const s = scoreQuestion({ ...base, correctness: 1, responseTime: 0 });
    const per = MATCH_MAX_POINTS / 5;
    expect(s.correctnessPoints).toBeCloseTo(per * 0.7);
    expect(s.difficultyPoints).toBeCloseTo(per * 0.2 * 0.75);
    expect(s.timePoints).toBeCloseTo(per * 0.1);
    expect(s.total).toBe(190);
  });

  it("awards nothing for a wrong answer, however fast", () => {
    expect(scoreQuestion({ ...base, correctness: 0, responseTime: 1 }).total).toBe(0);
  });

  it("never lets speed outweigh accuracy", () => {
    const slowCorrect = scoreQuestion({ ...base, correctness: 1, responseTime: 120 });
    const fastWrong = scoreQuestion({ ...base, correctness: 0, responseTime: 0 });
    expect(slowCorrect.total).toBeGreaterThan(fastWrong.total);
    // Max time bonus is smaller than the gap between correct and incorrect.
    expect(slowCorrect.total).toBeGreaterThan(MATCH_MAX_POINTS / 5 * SCORING_WEIGHTS.time);
  });

  it("rewards harder questions", () => {
    const easy = scoreQuestion({ ...base, difficulty: "beginner", correctness: 1, responseTime: 60 });
    const hard = scoreQuestion({ ...base, difficulty: "advanced", correctness: 1, responseTime: 60 });
    expect(hard.total).toBeGreaterThan(easy.total);
  });

  it("clamps time efficiency between 0 and 1", () => {
    expect(timeEfficiency(0, 120)).toBe(1);
    expect(timeEfficiency(60, 120)).toBe(0.5);
    expect(timeEfficiency(500, 120)).toBe(0);
    expect(timeEfficiency(10, 0)).toBe(0);
  });

  it("computes the maximum achievable score", () => {
    expect(maxScoreFor(Array(5).fill("intermediate"))).toBe(950);
    expect(maxScoreFor(Array(5).fill("advanced"))).toBe(1000);
  });
});
