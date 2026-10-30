import type { BotRun } from "./bot";
import type { Difficulty, Evaluation, StudentAnswer, Topic } from "./question";

export interface CompetitionInfo {
  id: string;
  name: string;
  discipline: string;
  description: string;
  available: boolean;
}

export interface MatchConfig {
  competitionId: string;
  difficulty: Difficulty;
  questionCount: number;
  durationSec: number;
  botIds: string[];
  showFormulaHints: boolean;
}

export interface AnswerRecord {
  answer: StudentAnswer;
  /** Active seconds the student spent on the question up to the latest submission. */
  timeSpent: number;
  submittedAt: number;
  revisions: number;
}

export type MatchStatus = "live" | "finished";

export interface MatchState {
  id: string;
  seed: number;
  config: MatchConfig;
  questionIds: string[];
  /** Epoch ms. */
  startedAt: number;
  /** Epoch ms. Submissions at or after this instant are rejected. */
  endsAt: number;
  answers: Record<string, AnswerRecord>;
  /** Active seconds per question, including time before any submission. */
  timeOnQuestion: Record<string, number>;
  status: MatchStatus;
  finishedAt?: number;
  endReason?: "submitted" | "timeout";
}

export interface QuestionScore {
  questionId: string;
  correctness: 0 | 1;
  correctnessPoints: number;
  difficultyPoints: number;
  timePoints: number;
  total: number;
}

export interface StudentQuestionResult extends QuestionScore {
  topic: Topic;
  answer?: StudentAnswer;
  evaluation: Evaluation;
  timeSpent: number;
}

export interface Standing {
  id: string;
  name: string;
  isStudent: boolean;
  score: number;
  correct: number;
  answered: number;
  timeTaken: number;
  rank: number;
}

export interface TopicPerformance {
  topic: Topic;
  correct: number;
  total: number;
}

export interface MatchResult {
  matchId: string;
  config: MatchConfig;
  questionIds: string[];
  endReason: "submitted" | "timeout";
  student: {
    score: number;
    maxScore: number;
    correct: number;
    answered: number;
    accuracy: number;
    timeTaken: number;
    perQuestion: StudentQuestionResult[];
    topics: TopicPerformance[];
    ratingBefore: number;
    ratingAfter: number;
    tier: string;
  };
  bots: BotRun[];
  standings: Standing[];
}
