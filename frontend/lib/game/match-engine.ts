import type {
  MatchConfig,
  MatchResult,
  MatchState,
  Standing,
  StudentQuestionResult,
  TopicPerformance,
} from "@/types/competition";
import type { Difficulty, Question, StudentAnswer, Topic } from "@/types/question";
import { DIFFICULTIES, TOPICS } from "@/types/question";
import { BOTS, getBot } from "@/lib/data/bots";
import { QUESTIONS, getQuestion } from "@/lib/data/questions";
import { evaluateAnswer } from "./evaluation";
import { maxScoreFor, scoreQuestion } from "./scoring";
import { simulateBot } from "./bot-engine";
import { isExpired } from "./timer";

export const STUDENT_BASE_RATING = 1500;
const RATING_K = 24;

/**
 * Picks questions for a match: first one per topic at the chosen difficulty,
 * then the nearest difficulties, always walking topics in a fixed order so the
 * sprint covers every topic before repeating one.
 */
export function selectQuestions(difficulty: Difficulty, count: number, pool: Question[] = QUESTIONS): Question[] {
  const target = DIFFICULTIES.indexOf(difficulty);
  const ranked = [...pool].sort((a, b) => {
    const da = Math.abs(DIFFICULTIES.indexOf(a.difficulty) - target);
    const db = Math.abs(DIFFICULTIES.indexOf(b.difficulty) - target);
    if (da !== db) return da - db;
    // Prefer harder over easier when equally distant.
    const ha = DIFFICULTIES.indexOf(a.difficulty) < target ? 1 : 0;
    const hb = DIFFICULTIES.indexOf(b.difficulty) < target ? 1 : 0;
    if (ha !== hb) return ha - hb;
    return TOPICS.indexOf(a.topic) - TOPICS.indexOf(b.topic);
  });
  return ranked.slice(0, Math.min(count, ranked.length));
}

export function validateConfig(config: MatchConfig): string | null {
  if (!DIFFICULTIES.includes(config.difficulty)) return "Unknown difficulty.";
  if (!Number.isInteger(config.questionCount) || config.questionCount < 1 || config.questionCount > QUESTIONS.length) {
    return "Invalid number of questions.";
  }
  if (config.durationSec < 60 || config.durationSec > 3600) return "Invalid duration.";
  if (config.botIds.length < 1) return "Select at least one opponent.";
  if (config.botIds.some((id) => !getBot(id))) return "Unknown opponent.";
  return null;
}

/** `startAt` may be in the future to leave room for a pre-match countdown. */
export function createMatch(config: MatchConfig, seed: number, startAt: number): MatchState {
  const error = validateConfig(config);
  if (error) throw new Error(error);
  const questions = selectQuestions(config.difficulty, config.questionCount);
  return {
    id: `m_${seed.toString(36)}_${startAt.toString(36)}`,
    seed,
    config,
    questionIds: questions.map((q) => q.id),
    startedAt: startAt,
    endsAt: startAt + config.durationSec * 1000,
    answers: {},
    timeOnQuestion: {},
    status: "live",
  };
}

export function matchQuestions(state: Pick<MatchState, "questionIds">): Question[] {
  return state.questionIds.map((id) => {
    const q = getQuestion(id);
    if (!q) throw new Error(`Unknown question ${id}`);
    return q;
  });
}

export type SubmitResult = { ok: true; state: MatchState } | { ok: false; reason: string };

/** Records (or revises) an answer. Rejected once the match has ended or expired. */
export function submitAnswer(state: MatchState, questionId: string, answer: StudentAnswer, now: number): SubmitResult {
  if (state.status !== "live") return { ok: false, reason: "The match is over." };
  if (now < state.startedAt) return { ok: false, reason: "The match hasn't started yet." };
  if (isExpired(state.endsAt, now)) return { ok: false, reason: "Time is up. Submissions are closed." };
  if (!state.questionIds.includes(questionId)) return { ok: false, reason: "Question is not part of this match." };
  const previous = state.answers[questionId];
  return {
    ok: true,
    state: {
      ...state,
      answers: {
        ...state.answers,
        [questionId]: {
          answer,
          timeSpent: state.timeOnQuestion[questionId] ?? 0,
          submittedAt: now,
          revisions: previous ? previous.revisions + 1 : 0,
        },
      },
    },
  };
}

/** Adds active viewing time to a question. Ignored after the match ends. */
export function addTimeOnQuestion(state: MatchState, questionId: string, seconds: number): MatchState {
  if (state.status !== "live" || seconds <= 0) return state;
  return {
    ...state,
    timeOnQuestion: { ...state.timeOnQuestion, [questionId]: (state.timeOnQuestion[questionId] ?? 0) + seconds },
  };
}

export function finishMatch(state: MatchState, now: number, reason: "submitted" | "timeout"): MatchState {
  if (state.status === "finished") return state;
  const expired = isExpired(state.endsAt, now);
  return {
    ...state,
    status: "finished",
    finishedAt: Math.min(now, state.endsAt),
    endReason: expired ? "timeout" : reason,
  };
}

function tierFor(fraction: number): string {
  if (fraction >= 0.85) return "Diamond";
  if (fraction >= 0.7) return "Platinum";
  if (fraction >= 0.5) return "Gold";
  if (fraction >= 0.3) return "Silver";
  return "Bronze";
}

function expectedScore(rating: number, opponent: number): number {
  return 1 / (1 + 10 ** ((opponent - rating) / 400));
}

/** Deterministically scores the student and the bots and ranks everyone. */
export function computeResult(state: MatchState): MatchResult {
  if (state.status !== "finished" || state.finishedAt === undefined) {
    throw new Error("Match is not finished.");
  }
  const { config } = state;
  const questions = matchQuestions(state);
  const timeBudget = config.durationSec / questions.length;

  const perQuestion: StudentQuestionResult[] = questions.map((q) => {
    const record = state.answers[q.id];
    const evaluation = evaluateAnswer(q, record?.answer);
    const timeSpent = record?.timeSpent ?? state.timeOnQuestion[q.id] ?? 0;
    const score = scoreQuestion({
      questionId: q.id,
      correctness: evaluation.correctness,
      difficulty: q.difficulty,
      responseTime: timeSpent,
      timeBudget,
      questionCount: questions.length,
    });
    return { ...score, topic: q.topic, answer: record?.answer, evaluation, timeSpent };
  });

  const studentScore = perQuestion.reduce((s, r) => s + r.total, 0);
  const studentCorrect = perQuestion.filter((r) => r.correctness === 1).length;
  const studentAnswered = perQuestion.filter((r) => r.answer).length;
  const studentTime = (state.finishedAt - state.startedAt) / 1000;

  const bots = config.botIds.map((id) => simulateBot(getBot(id)!, questions, config.durationSec, state.seed));

  const rows: Omit<Standing, "rank">[] = [
    {
      id: "you",
      name: "You",
      isStudent: true,
      score: studentScore,
      correct: studentCorrect,
      answered: studentAnswered,
      timeTaken: studentTime,
    },
    ...bots.map((run) => {
      const complete = run.events.length === questions.length;
      return {
        id: run.botId,
        name: getBot(run.botId)!.name,
        isStudent: false,
        score: run.events.reduce((s, e) => s + e.points, 0),
        correct: run.events.filter((e) => e.correct).length,
        answered: run.events.length,
        timeTaken: complete ? run.events[run.events.length - 1].answeredAt : config.durationSec,
      };
    }),
  ];
  rows.sort((a, b) => b.score - a.score || b.correct - a.correct || a.timeTaken - b.timeTaken);
  const standings: Standing[] = rows.map((r, i) => ({ ...r, rank: i + 1 }));

  const me = standings.find((s) => s.isStudent)!;
  const ratingDelta = standings
    .filter((s) => !s.isStudent)
    .reduce((sum, bot) => {
      const actual = me.rank < bot.rank ? 1 : 0;
      return sum + RATING_K * (actual - expectedScore(STUDENT_BASE_RATING, getBot(bot.id)!.rating));
    }, 0);

  const topics: TopicPerformance[] = TOPICS.flatMap((topic: Topic) => {
    const rowsForTopic = perQuestion.filter((r) => r.topic === topic);
    if (rowsForTopic.length === 0) return [];
    return [{ topic, total: rowsForTopic.length, correct: rowsForTopic.filter((r) => r.correctness === 1).length }];
  });

  const maxScore = maxScoreFor(questions.map((q) => q.difficulty));

  return {
    matchId: state.id,
    config,
    questionIds: state.questionIds,
    endReason: state.endReason ?? "submitted",
    student: {
      score: studentScore,
      maxScore,
      correct: studentCorrect,
      answered: studentAnswered,
      accuracy: questions.length ? studentCorrect / questions.length : 0,
      timeTaken: studentTime,
      perQuestion,
      topics,
      ratingBefore: STUDENT_BASE_RATING,
      ratingAfter: Math.round(STUDENT_BASE_RATING + ratingDelta),
      tier: tierFor(studentScore / maxScore),
    },
    bots,
    standings,
  };
}

export function botsFor(config: MatchConfig) {
  return BOTS.filter((b) => config.botIds.includes(b.id));
}
