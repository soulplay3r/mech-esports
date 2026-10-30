import "server-only";
import { z } from "zod";
import type { Question, StudentAnswer, Topic } from "@/types/question";
import { DIFFICULTIES, DIFFICULTY_LABELS, TOPICS, TOPIC_LABELS } from "@/types/question";
import { convertUnit, evaluateAnswer, formatStudentAnswer, withinTolerance } from "@/lib/game/evaluation";
import { PRACTICE_UNITS } from "@/lib/data/practice";
import { callClaude, type ClaudeClient, type ClaudeResult } from "./claude-client";

// ───────────────────────── Feature A: explain a question ─────────────────────────

const EXPLAIN_SYSTEM = `You are the Engineering Coach in Mech E-Sports, a competitive engineering game for undergraduate mechanical engineering students.
You explain competition questions after a match.

Rules:
- The approved reference solution and the official correct answer are the source of truth. Use their numbers exactly. Never contradict, recompute differently or override them, and never claim the student's answer was graded differently than stated.
- Do not invent new data or calculations beyond rearranging and explaining the reference solution.
- Use correct SI units throughout.
- Write in concise Markdown with these headings, in order:
  ### What this tests
  ### Formula
  ### Where your answer went wrong   (if the student was correct, title it "### Why your answer is right" instead)
  ### Step-by-step
  ### Correct answer
  ### Common mistakes
  ### On the shop floor   (one short, practical engineering example)
- Keep it under 350 words. Be encouraging and direct, like a coach after a match.`;

export function buildExplainPrompt(question: Question, answer: StudentAnswer | undefined): string {
  const evaluation = evaluateAnswer(question, answer);
  const lines = [
    `Topic: ${TOPIC_LABELS[question.topic]}`,
    `Difficulty: ${DIFFICULTY_LABELS[question.difficulty]}`,
    `Question: ${question.prompt}`,
    `Given parameters: ${question.parameters.map((p) => `${p.label} = ${p.value}`).join("; ")}`,
  ];
  if (question.kind === "mcq") {
    lines.push(`Options: ${question.options.map((o) => `(${o.id}) ${o.label}`).join("; ")}`);
  }
  lines.push(
    `Reference formula: ${question.formula}`,
    `Approved reference solution:\n${question.referenceSolution.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
    `Official correct answer: ${question.answerDisplay}`,
    `Student's answer: ${formatStudentAnswer(question, answer)}`,
    `Official grading result (final, computed by the game engine): ${evaluation.status.toUpperCase()}${evaluation.feedback ? ` – ${evaluation.feedback}` : ""}`,
  );
  if (evaluation.status === "unit-error") {
    lines.push("The grading engine flagged a unit error: focus the diagnosis on units.");
  }
  if (evaluation.status === "unanswered") {
    lines.push("The student did not answer in time: explain how to approach it quickly.");
  }
  return lines.join("\n");
}

export function explainQuestion(question: Question, answer: StudentAnswer | undefined, client?: ClaudeClient) {
  return callClaude(
    {
      system: EXPLAIN_SYSTEM,
      messages: [{ role: "user", content: buildExplainPrompt(question, answer) }],
      maxTokens: 4000,
      effort: "low",
    },
    client,
  );
}

// ───────────────────────── Feature B: AI-generated practice ─────────────────────────

/**
 * Formulas the server can recompute. Claude tags each practice question with
 * one of these and its inputs so the answer can be checked deterministically.
 */
export const PRACTICE_FORMULAS = {
  spindle_speed: { inputs: ["V_m_per_min", "D_mm"], unit: "RPM", fn: (v: Record<string, number>) => (1000 * v.V_m_per_min) / (Math.PI * v.D_mm) },
  cutting_speed: { inputs: ["D_mm", "N_rpm"], unit: "m/min", fn: (v: Record<string, number>) => (Math.PI * v.D_mm * v.N_rpm) / 1000 },
  machining_time: { inputs: ["L_mm", "f_mm_per_rev", "N_rpm"], unit: "min", fn: (v: Record<string, number>) => v.L_mm / (v.f_mm_per_rev * v.N_rpm) },
  milling_feed_rate: { inputs: ["fz_mm_per_tooth", "z_teeth", "N_rpm"], unit: "mm/min", fn: (v: Record<string, number>) => v.fz_mm_per_tooth * v.z_teeth * v.N_rpm },
  mrr_turning: { inputs: ["V_m_per_min", "f_mm_per_rev", "d_mm"], unit: "mm³/min", fn: (v: Record<string, number>) => v.V_m_per_min * 1000 * v.f_mm_per_rev * v.d_mm },
  mrr_milling: { inputs: ["w_mm", "d_mm", "F_mm_per_min"], unit: "mm³/min", fn: (v: Record<string, number>) => v.w_mm * v.d_mm * v.F_mm_per_min },
  throughput_scaling: { inputs: ["units", "gain_percent"], unit: "units", fn: (v: Record<string, number>) => v.units * (1 + v.gain_percent / 100) },
  output_per_time: { inputs: ["available_min", "cycle_min"], unit: "units", fn: (v: Record<string, number>) => v.available_min / v.cycle_min },
  taylor_speed: { inputs: ["C", "n", "T_min"], unit: "m/min", fn: (v: Record<string, number>) => v.C / v.T_min ** v.n },
} as const;

export type PracticeFormulaId = keyof typeof PRACTICE_FORMULAS;
const FORMULA_IDS = Object.keys(PRACTICE_FORMULAS) as PracticeFormulaId[];

export const practiceQuestionSchema = z.object({
  title: z.string().min(3).max(120),
  topic: z.enum(TOPICS as [Topic, ...Topic[]]),
  difficulty: z.enum(DIFFICULTIES as [string, ...string[]]),
  problem: z.string().min(20).max(1200),
  formula: z.string().min(1).max(200),
  answer: z.number().finite(),
  unit: z.enum(PRACTICE_UNITS),
  steps: z.array(z.string().min(1).max(400)).min(2).max(8),
  calculation: z.object({
    formula_id: z.enum(FORMULA_IDS as [PracticeFormulaId, ...PracticeFormulaId[]]),
    inputs: z.array(z.object({ name: z.string(), value: z.number().finite() })).max(6),
  }),
});

export const practiceResponseSchema = z.object({ questions: z.array(practiceQuestionSchema).min(1).max(5) });

export type PracticeQuestion = z.infer<typeof practiceQuestionSchema> & { verified: boolean };

/** JSON schema handed to Claude's structured output; mirrors `practiceQuestionSchema`. */
export const PRACTICE_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "topic", "difficulty", "problem", "formula", "answer", "unit", "steps", "calculation"],
        properties: {
          title: { type: "string" },
          topic: { type: "string", enum: TOPICS },
          difficulty: { type: "string", enum: DIFFICULTIES },
          problem: { type: "string" },
          formula: { type: "string" },
          answer: { type: "number" },
          unit: { type: "string", enum: PRACTICE_UNITS },
          steps: { type: "array", items: { type: "string" } },
          calculation: {
            type: "object",
            additionalProperties: false,
            required: ["formula_id", "inputs"],
            properties: {
              formula_id: { type: "string", enum: FORMULA_IDS },
              inputs: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["name", "value"],
                  properties: { name: { type: "string" }, value: { type: "number" } },
                },
              },
            },
          },
        },
      },
    },
  },
};

const PRACTICE_SYSTEM = `You write original practice problems for undergraduate mechanical engineering students preparing for a manufacturing engineering competition (machining).
Every problem must be technically accurate, use realistic shop-floor values and SI units, and be solvable with exactly one of these formulas, identified by formula_id with inputs named exactly as listed:
${FORMULA_IDS.map((id) => `- ${id}: inputs ${PRACTICE_FORMULAS[id].inputs.join(", ")}; result in ${PRACTICE_FORMULAS[id].unit}`).join("\n")}
The "answer" must equal the formula evaluated on the inputs (you may express it in an equivalent unit from the allowed list, e.g. s instead of min). Round the answer to 3 significant figures. Steps must show the substitution and arithmetic.`;

/** Recomputes the answer from the declared formula and inputs. */
export function verifyPracticeAnswer(q: z.infer<typeof practiceQuestionSchema>): boolean {
  const spec = PRACTICE_FORMULAS[q.calculation.formula_id];
  const values: Record<string, number> = {};
  for (const input of q.calculation.inputs) values[input.name] = input.value;
  if (!spec.inputs.every((name) => Number.isFinite(values[name]))) return false;
  const expected = spec.fn(values);
  if (!Number.isFinite(expected) || expected <= 0) return false;
  const answerInFormulaUnit = convertUnit(q.answer, q.unit, spec.unit);
  if (answerInFormulaUnit === null) return false;
  return withinTolerance(answerInFormulaUnit, expected, 0.01);
}

export type PracticeResult =
  | { ok: true; questions: PracticeQuestion[]; rejected: number }
  | Extract<ClaudeResult, { ok: false }>;

/** Parses and validates Claude's practice JSON, keeping only questions whose answers verify. */
export function parsePracticeResponse(text: string): { questions: PracticeQuestion[]; rejected: number } | null {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  const parsed = practiceResponseSchema.safeParse(json);
  if (!parsed.success) return null;
  const verified = parsed.data.questions.filter(verifyPracticeAnswer).slice(0, 3);
  return {
    questions: verified.map((q) => ({ ...q, verified: true })),
    rejected: parsed.data.questions.length - verified.length,
  };
}

export async function generatePractice(
  weakTopics: Topic[],
  difficulty: string,
  client?: ClaudeClient,
): Promise<PracticeResult> {
  const topics = weakTopics.length ? weakTopics : TOPICS;
  const result = await callClaude(
    {
      system: PRACTICE_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Write 4 practice problems at ${difficulty} difficulty. Focus on the student's weak topics: ${topics
            .map((t) => TOPIC_LABELS[t])
            .join(", ")}. Spread the problems across these topics and vary the numbers and contexts (lathe, milling, drilling, production cells).`,
        },
      ],
      maxTokens: 12000,
      effort: "medium",
      jsonSchema: PRACTICE_JSON_SCHEMA,
    },
    client,
  );
  if (!result.ok) return result;
  const parsed = parsePracticeResponse(result.text);
  if (!parsed || parsed.questions.length === 0) {
    return { ok: false, code: "upstream", message: "The coach's practice set failed validation. Try generating again." };
  }
  return { ok: true, ...parsed };
}

// ───────────────────────── Feature C: Ask Claude ─────────────────────────

const CHAT_SYSTEM = `You are the Engineering Coach in Mech E-Sports, a competitive engineering game for mechanical engineering students.
Answer questions about machining, manufacturing processes, materials, production planning, metrology and quality engineering at undergraduate mechanical engineering level.
Use formulas, short worked examples with real numbers, and correct SI units. Use Markdown, keep answers focused (under 300 words unless the student asks for depth).
If a question is outside mechanical and manufacturing engineering, briefly say you only coach those topics and suggest a related question.`;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export function askCoach(history: ChatTurn[], client?: ClaudeClient) {
  return callClaude({ system: CHAT_SYSTEM, messages: history, maxTokens: 4000, effort: "low" }, client);
}
