import { describe, expect, it } from "vitest";
import { convertUnit, evaluateAnswer, evaluateMcq, evaluateNumeric, parseNumber } from "@/lib/game/evaluation";
import { getQuestion } from "@/lib/data/questions";
import type { McqQuestion, NumericQuestion } from "@/types/question";

const spindle = getQuestion("cs-int-1") as NumericQuestion; // 636.62 RPM, ±1%
const mrr = getQuestion("mrr-int-1") as NumericQuestion; // 40000 mm³/min
const time = getQuestion("mt-int-1") as NumericQuestion; // 2 min
const throughput = getQuestion("po-int-1") as McqQuestion;

describe("parseNumber", () => {
  it("accepts common numeric formats", () => {
    expect(parseNumber("637")).toBe(637);
    expect(parseNumber(" 40,000 ")).toBe(40000);
    expect(parseNumber("4e4")).toBe(40000);
    expect(parseNumber(".5")).toBe(0.5);
    expect(parseNumber("636.6")).toBe(636.6);
  });
  it("rejects garbage", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("6.3.7")).toBeNull();
    expect(parseNumber("637rpm")).toBeNull();
  });
});

describe("numerical evaluation with tolerance and rounding", () => {
  it("accepts rounded answers within tolerance", () => {
    expect(evaluateNumeric(spindle, "637", "RPM").status).toBe("correct");
    expect(evaluateNumeric(spindle, "636.6", "RPM").status).toBe("correct");
    expect(evaluateNumeric(spindle, "640", "RPM").status).toBe("correct"); // 0.53% off
  });
  it("rejects values outside tolerance", () => {
    expect(evaluateNumeric(spindle, "650", "RPM").status).toBe("incorrect"); // 2.1% off
    expect(evaluateNumeric(spindle, "2000", "RPM").status).toBe("incorrect"); // forgot π
  });
  it("flags invalid input", () => {
    expect(evaluateNumeric(spindle, "six hundred", "RPM")).toMatchObject({ status: "invalid", correctness: 0 });
  });
});

describe("unit handling", () => {
  it("converts between compatible units", () => {
    expect(convertUnit(40, "cm³/min", "mm³/min")).toBe(40000);
    expect(convertUnit(120, "s", "min")).toBe(2);
    expect(convertUnit(200, "mm/min", "m/min")).toBeCloseTo(0.2);
    expect(convertUnit(1, "mm/rev", "mm/min")).toBeNull();
  });
  it("accepts a correct value in an equivalent unit", () => {
    expect(evaluateNumeric(mrr, "40", "cm³/min").status).toBe("correct");
    expect(evaluateNumeric(time, "120", "s").status).toBe("correct");
    expect(evaluateNumeric(spindle, "10.61", "rev/s").status).toBe("correct");
  });
  it("marks a dimensionally wrong unit as a unit error, even with the right number", () => {
    const e = evaluateNumeric(spindle, "637", "m/min");
    expect(e.status).toBe("unit-error");
    expect(e.correctness).toBe(0);
    expect(e.feedback).toMatch(/wrong unit/);
  });
  it("treats a wrong magnitude in a compatible unit as incorrect", () => {
    expect(evaluateNumeric(mrr, "40000", "cm³/min").status).toBe("incorrect");
  });
});

describe("multiple-choice evaluation", () => {
  it("scores the correct option only", () => {
    expect(evaluateMcq(throughput, "c").status).toBe("correct");
    expect(evaluateMcq(throughput, "b").status).toBe("incorrect");
    expect(evaluateMcq(throughput, "z").status).toBe("invalid");
  });
  it("handles missing and mismatched answers", () => {
    expect(evaluateAnswer(throughput, undefined).status).toBe("unanswered");
    expect(evaluateAnswer(throughput, { kind: "numeric", value: "125", unit: "units" }).status).toBe("invalid");
  });
});
