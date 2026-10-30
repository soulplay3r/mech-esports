import { describe, expect, it } from "vitest";
import { QUESTIONS, getQuestion } from "@/lib/data/questions";
import type { NumericQuestion } from "@/types/question";
import { convertUnit } from "@/lib/game/evaluation";

const numeric = (id: string) => getQuestion(id) as NumericQuestion;

/** Independently recompute every seeded answer from its parameters. */
describe("seeded question answers", () => {
  it("cutting speed → spindle speed (120 m/min, 60 mm)", () => {
    expect(numeric("cs-int-1").answer).toBeCloseTo((1000 * 120) / (Math.PI * 60), 1);
  });
  it("machining time (200 mm, 0.25 mm/rev, 400 RPM)", () => {
    expect(numeric("mt-int-1").answer).toBe(200 / (0.25 * 400));
  });
  it("milling feed rate (4 teeth, 0.1 mm, 500 RPM)", () => {
    expect(numeric("fr-int-1").answer).toBeCloseTo(0.1 * 4 * 500, 6);
  });
  it("turning MRR (100 m/min, 0.2 mm/rev, 2 mm)", () => {
    expect(numeric("mrr-int-1").answer).toBeCloseTo(100 * 1000 * 0.2 * 2, 6);
  });
  it("throughput +25%", () => {
    const q = getQuestion("po-int-1");
    expect(q?.kind).toBe("mcq");
    if (q?.kind !== "mcq") return;
    expect(q.options.find((o) => o.id === q.correctOptionId)?.label).toBe(`${(100 / 500) * 1.25 * 500} units`);
  });
  it("beginner answers", () => {
    expect(numeric("cs-beg-1").answer).toBeCloseTo((Math.PI * 50 * 500) / 1000, 2);
    expect(numeric("mt-beg-1").answer).toBe(150 / (0.3 * 500));
    expect(numeric("mrr-beg-1").answer).toBeCloseTo(50 * 1000 * 0.1 * 1, 6);
    expect(numeric("po-beg-1").answer).toBe((8 * 60) / 4);
  });
  it("advanced answers", () => {
    const n1 = (1000 * 100) / (Math.PI * 80);
    expect(numeric("mt-adv-1").answer).toBeCloseTo(255 / (0.2 * n1), 2);
    const n2 = (1000 * 50) / (Math.PI * 100);
    expect(numeric("fr-adv-1").answer).toBeCloseTo(0.05 * 8 * n2, 1);
    expect(numeric("mrr-adv-1").answer).toBeCloseTo(convertUnit(60 * 3 * 250, "mm³/min", "cm³/min")!, 6);
    expect(300 / 16 ** 0.25).toBe(150);
    expect(480 / Math.max(2.0, 2.5, 1.6)).toBe(192);
  });
});

describe("question pool integrity", () => {
  it("has unique ids, valid unit options and correct MCQ keys", () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) {
      expect(q.referenceSolution.length).toBeGreaterThan(0);
      if (q.kind === "numeric") {
        expect(q.unitOptions).toContain(q.unit);
        for (const u of q.unitOptions) expect(convertUnit(1, u, u)).toBe(1);
      } else {
        expect(q.options.map((o) => o.id)).toContain(q.correctOptionId);
      }
    }
  });
});
