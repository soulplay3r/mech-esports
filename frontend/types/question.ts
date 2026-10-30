export type Topic =
  | "cutting-speed"
  | "machining-time"
  | "feed-rate"
  | "material-removal-rate"
  | "production-optimization";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface QuestionParameter {
  label: string;
  value: string;
}

interface BaseQuestion {
  id: string;
  topic: Topic;
  difficulty: Difficulty;
  title: string;
  prompt: string;
  parameters: QuestionParameter[];
  /** Reference formula, always shown after the match. */
  formula: string;
  /** Hint shown during the match when hints are permitted. */
  formulaHint?: string;
  /** Approved, verified reference solution steps. Source of truth for the coach. */
  referenceSolution: string[];
  /** Displayed correct answer, e.g. "≈ 637 RPM". */
  answerDisplay: string;
}

export interface NumericQuestion extends BaseQuestion {
  kind: "numeric";
  answer: number;
  /** Canonical unit of `answer`. */
  unit: string;
  /** Units offered in the selector. Must include `unit`. */
  unitOptions: string[];
  /** Relative tolerance, e.g. 0.01 = ±1%. */
  tolerance: number;
}

export interface McqOption {
  id: string;
  label: string;
}

export interface McqQuestion extends BaseQuestion {
  kind: "mcq";
  options: McqOption[];
  correctOptionId: string;
}

export type Question = NumericQuestion | McqQuestion;

export type StudentAnswer =
  | { kind: "numeric"; value: string; unit: string }
  | { kind: "mcq"; optionId: string };

export type EvaluationStatus = "correct" | "incorrect" | "unit-error" | "invalid" | "unanswered";

export interface Evaluation {
  status: EvaluationStatus;
  /** 1 when correct, 0 otherwise. Correctness is binary; partial credit is not awarded. */
  correctness: 0 | 1;
  feedback: string;
}

export const TOPIC_LABELS: Record<Topic, string> = {
  "cutting-speed": "Cutting Speed",
  "machining-time": "Machining Time",
  "feed-rate": "Feed Rate",
  "material-removal-rate": "Material Removal Rate",
  "production-optimization": "Production Optimization",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const TOPICS = Object.keys(TOPIC_LABELS) as Topic[];
export const DIFFICULTIES = Object.keys(DIFFICULTY_LABELS) as Difficulty[];
