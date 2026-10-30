import type { Difficulty, Topic } from "./question";

export interface BotProfile {
  id: string;
  name: string;
  title: string;
  initials: string;
  /** Tailwind gradient classes for the avatar. */
  accent: string;
  rating: number;
  tagline: string;
  traits: string[];
  /** Base probability of a correct answer by difficulty. */
  accuracy: Record<Difficulty, number>;
  /** Added to accuracy for topics the bot is strong in. */
  topicBonus: Partial<Record<Topic, number>>;
  /** Mean response time as a fraction of the per-question time budget. */
  speed: number;
  /** Relative spread of response times (coefficient of variation). */
  speedSpread: number;
  /** Standard deviation of the match-level "form" swing applied to accuracy. */
  formVariance: number;
  /** Chance of an unforced error on any question, regardless of skill. */
  blunderRate: number;
}

export type BotStatus = "waiting" | "thinking" | "answered" | "completed";

export interface BotAnswerEvent {
  questionId: string;
  questionIndex: number;
  /** Seconds since match start at which the bot locked in this answer. */
  answeredAt: number;
  /** Seconds the bot spent on this question. */
  responseTime: number;
  correct: boolean;
  points: number;
}

export interface BotRun {
  botId: string;
  /** Match-level form modifier that was drawn for this bot. */
  form: number;
  /** Answers that fit within the match duration, in order. */
  events: BotAnswerEvent[];
}
