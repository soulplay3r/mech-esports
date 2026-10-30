import type { Evaluation, McqQuestion, NumericQuestion, Question, StudentAnswer } from "@/types/question";

/** Each unit maps to a physical dimension and a factor to that dimension's base unit. */
const UNITS: Record<string, { dimension: string; factor: number }> = {
  RPM: { dimension: "rotation", factor: 1 },
  "rev/s": { dimension: "rotation", factor: 60 },
  "m/min": { dimension: "velocity", factor: 1 },
  "m/s": { dimension: "velocity", factor: 60 },
  "mm/min": { dimension: "velocity", factor: 0.001 },
  "mm/rev": { dimension: "feed-per-rev", factor: 1 },
  min: { dimension: "time", factor: 1 },
  s: { dimension: "time", factor: 1 / 60 },
  h: { dimension: "time", factor: 60 },
  "mm³/min": { dimension: "volume-rate", factor: 1 },
  "cm³/min": { dimension: "volume-rate", factor: 1000 },
  "mm³/s": { dimension: "volume-rate", factor: 60 },
  "mm²/min": { dimension: "area-rate", factor: 1 },
  units: { dimension: "count", factor: 1 },
  "units/min": { dimension: "count-rate", factor: 1 },
};

/**
 * Converts `value` from one unit to another. Returns null when the units
 * are unknown or describe different physical quantities.
 */
export function convertUnit(value: number, from: string, to: string): number | null {
  const a = UNITS[from];
  const b = UNITS[to];
  if (!a || !b || a.dimension !== b.dimension) return null;
  return (value * a.factor) / b.factor;
}

/** Parses student input such as "637", "40,000", "4e4" or "3.2". */
export function parseNumber(raw: string): number | null {
  const cleaned = raw.trim().replace(/[,\s_]/g, "");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Within relative tolerance, with a tiny absolute floor so answers of 0 are comparable. */
export function withinTolerance(value: number, expected: number, tolerance: number): boolean {
  return Math.abs(value - expected) <= Math.max(Math.abs(expected) * tolerance, 1e-9);
}

export function evaluateNumeric(question: NumericQuestion, value: string, unit: string): Evaluation {
  const parsed = parseNumber(value);
  if (parsed === null) {
    return { status: "invalid", correctness: 0, feedback: "Answer is not a valid number." };
  }
  const converted = convertUnit(parsed, unit, question.unit);
  if (converted === null) {
    const sameNumber = withinTolerance(parsed, question.answer, question.tolerance);
    return {
      status: "unit-error",
      correctness: 0,
      feedback: sameNumber
        ? `Right magnitude, wrong unit: ${unit} does not describe this quantity.`
        : `${unit} does not describe this quantity.`,
    };
  }
  if (withinTolerance(converted, question.answer, question.tolerance)) {
    return { status: "correct", correctness: 1, feedback: "Correct." };
  }
  return { status: "incorrect", correctness: 0, feedback: "Value outside tolerance." };
}

export function evaluateMcq(question: McqQuestion, optionId: string): Evaluation {
  if (!question.options.some((o) => o.id === optionId)) {
    return { status: "invalid", correctness: 0, feedback: "Unknown option." };
  }
  return optionId === question.correctOptionId
    ? { status: "correct", correctness: 1, feedback: "Correct." }
    : { status: "incorrect", correctness: 0, feedback: "Incorrect option." };
}

export function evaluateAnswer(question: Question, answer: StudentAnswer | undefined): Evaluation {
  if (!answer) return { status: "unanswered", correctness: 0, feedback: "No answer submitted." };
  if (question.kind === "numeric" && answer.kind === "numeric") {
    return evaluateNumeric(question, answer.value, answer.unit);
  }
  if (question.kind === "mcq" && answer.kind === "mcq") {
    return evaluateMcq(question, answer.optionId);
  }
  return { status: "invalid", correctness: 0, feedback: "Answer type does not match question." };
}

export function formatStudentAnswer(question: Question, answer: StudentAnswer | undefined): string {
  if (!answer) return "No answer";
  if (answer.kind === "numeric") return `${answer.value} ${answer.unit}`;
  if (question.kind === "mcq") {
    return question.options.find((o) => o.id === answer.optionId)?.label ?? answer.optionId;
  }
  return answer.optionId;
}
