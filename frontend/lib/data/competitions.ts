import type { CompetitionInfo, MatchConfig } from "@/types/competition";
import { DEFAULT_BOT_IDS } from "./bots";

export const COMPETITIONS: CompetitionInfo[] = [
  {
    id: "machining-sprint",
    name: "Machining Sprint",
    discipline: "Manufacturing Engineering",
    description: "Cutting speed, machining time, feed rate, MRR and production optimization under the clock.",
    available: true,
  },
  {
    id: "production-optimization",
    name: "Production Optimization",
    discipline: "Manufacturing Engineering",
    description: "Line balancing, bottlenecks, OEE and takt time.",
    available: false,
  },
  {
    id: "metrology-challenge",
    name: "Metrology Challenge",
    discipline: "Manufacturing Engineering",
    description: "Tolerances, fits, gauges and measurement uncertainty.",
    available: false,
  },
  {
    id: "materials-engineering",
    name: "Materials Engineering",
    discipline: "Manufacturing Engineering",
    description: "Stress-strain, heat treatment and material selection.",
    available: false,
  },
];

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  competitionId: "machining-sprint",
  difficulty: "intermediate",
  questionCount: 5,
  durationSec: 600,
  botIds: DEFAULT_BOT_IDS,
  showFormulaHints: true,
};

export const QUESTION_COUNT_OPTIONS = [3, 5, 8];
export const DURATION_OPTIONS = [
  { sec: 300, label: "5 min" },
  { sec: 600, label: "10 min" },
  { sec: 900, label: "15 min" },
];
