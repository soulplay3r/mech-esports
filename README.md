# MECH E-SPORTS

**Engineering is a sport.** Compete. Prove. Dominate.

A single-player engineering esports prototype for mechanical engineering students. Pick the **Machining Sprint**, go up against three AI engineering opponents in a timed challenge, see where you rank, and use the Claude-powered **Engineering Coach** to understand your mistakes.

The app lives in [`frontend/`](frontend) (Next.js App Router, TypeScript strict, Tailwind CSS v4, shadcn/ui, Lucide, Anthropic TypeScript SDK).

## What's in the prototype

| Screen | Route | What it does |
| --- | --- | --- |
| Landing | `/` | Hero, sprint preview, bot opponents, sample leaderboard, coach preview. No sign-up. |
| Arena lobby | `/arena` | Competitions (Machining Sprint live, three marked coming soon). Pick difficulty, question count, duration, formula hints and opponents. |
| Competition | `/competition` | 3-2-1 countdown, a timer that survives a refresh, question navigator, numerical answers with a unit selector, multiple-choice answers, revisions until final submit, live bot standings and match feed. |
| Results | `/results` | Winner banner, score, ranking, accuracy, time, match rating and tier, performance by topic, answer review with reference solutions, Claude explanations, AI practice. |
| Coach | `/coach` | Chat with Claude about machining, manufacturing, materials, production planning, metrology and quality. |

Default sprint: **5 questions · 10 minutes · Intermediate · 3 bots** (Alex the Speedster, Riya the Precision Engineer, Max the Specialist).

## How the game works

All gameplay is deterministic and runs without any AI calls.

- **Questions** (`lib/data/questions.ts`): 15 original questions, 5 topics × 3 difficulties. Every answer is recomputed from its parameters in `lib/game/__tests__/questions.test.ts`.
- **Evaluation** (`lib/game/evaluation.ts`): relative tolerance (±1–1.5%), number parsing (`40,000`, `4e4`), unit conversion between compatible units (e.g. `40 cm³/min` = `40000 mm³/min`, `120 s` = `2 min`). A unit that describes the wrong quantity is graded as a **unit error**.
- **Scoring** (`lib/game/scoring.ts`): 1000 points per match, split across the questions. Each question's points are 70% correctness, 20% difficulty and 10% time efficiency. Difficulty and time points only count on correct answers, so speed can never beat accuracy.
- **Bots** (`lib/game/bot-engine.ts`): each bot has a rating, per-difficulty accuracy, topic strengths, a speed profile (log-normal response times), a match-level "form" swing and a blunder rate. A seeded PRNG simulates the bot's whole match. Bots are scored by the same `scoreQuestion` as the student. Over 2,000 simulated matches each bot wins roughly a third of bot-only matches, and a strong student wins often but not always.
- **Match engine** (`lib/game/match-engine.ts`): pure functions (`createMatch`, `submitAnswer`, `finishMatch`, `computeResult`). Submissions are rejected before the countdown ends and after the clock expires.
- **Persistence** (`lib/game/session-store.ts`): `sessionStorage` is the only storage boundary. A server store such as Supabase can replace it without changes to the engine.

## Claude integration

Server-side only. The key never reaches the browser.

- `lib/ai/claude-client.ts`: SDK client with a 50 s timeout, 1 retry, a model taken from `ANTHROPIC_MODEL` (default `claude-opus-5-5`), effort control, server-side refusal fallbacks (`fallbacks: "default"`) on models that support them, and typed error mapping.
- `lib/ai/engineering-coach.ts`:
  - **Explain** (`POST /api/ai/explain`): the client sends only a question id and the student's raw answer. The server loads the question, the approved reference solution and the official answer from seed data, and re-grades the answer itself. Claude is told the reference solution is the source of truth and that the engine's verdict is final.
  - **Practice** (`POST /api/ai/practice`): uses structured JSON output, validated with Zod. Claude tags each problem with one of 9 known formulas and its inputs, and the server recomputes the answer. Problems that fail the check are dropped. The rest are labelled *AI-generated practice · Answer verified* and are never added to the competition pool.
  - **Ask Claude** (`POST /api/ai/chat`): scoped engineering tutor.
- `GET /api/ai/status`: reports whether a key is configured, so the UI can disable coach features up front.
- Request validation (Zod), a 32 KB body limit, token limits, and a basic per-IP rate limit (in-memory, per instance).
- With no API key, every coach feature shows an "Engineering Coach offline" message and the game still works fully.

## Run locally

Requires Node 20+.

```bash
cd frontend
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY to enable the coach (optional)
npm run dev                  # http://localhost:3000
```

```bash
npm test          # vitest: engine, scoring, timer, bots, Claude client/routes (mocked SDK)
npm run typecheck
npm run lint
npm run build
```

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | No (needed for the coach) | Server-only. Never prefix with `NEXT_PUBLIC_`. |
| `ANTHROPIC_MODEL` | No | Defaults to `claude-opus-5-5`. |

## Deploy to Vercel

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. Set **Root Directory** to `frontend`. The framework preset (Next.js) is detected automatically.
3. Under **Environment Variables**, add `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`).
4. Deploy. The AI routes set `maxDuration = 60`.

Or from the CLI:

```bash
cd frontend
npx vercel --prod
```

## Out of scope (intentionally)

No accounts, authentication, profiles, uploads, multiplayer, admin, recruiter, payments or notifications.
