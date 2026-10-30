import type { BotProfile } from "@/types/bot";

export const BOTS: BotProfile[] = [
  {
    id: "alex",
    name: "Alex",
    title: "The Speedster",
    initials: "AX",
    accent: "from-amber-400 to-orange-600",
    rating: 1480,
    tagline: "First to lock in. Not always right.",
    traits: ["Fast responses", "Medium accuracy", "Strong in straightforward calculations"],
    accuracy: { beginner: 0.84, intermediate: 0.66, advanced: 0.42 },
    topicBonus: { "cutting-speed": 0.08, "machining-time": 0.08, "feed-rate": 0.08 },
    speed: 0.32,
    speedSpread: 0.35,
    formVariance: 0.08,
    blunderRate: 0.05,
  },
  {
    id: "riya",
    name: "Riya",
    title: "The Precision Engineer",
    initials: "RY",
    accent: "from-cyan-300 to-sky-600",
    rating: 1620,
    tagline: "Checks every unit twice.",
    traits: ["Slower responses", "High accuracy", "Strong in manufacturing concepts"],
    accuracy: { beginner: 0.94, intermediate: 0.82, advanced: 0.62 },
    topicBonus: { "production-optimization": 0.08, "material-removal-rate": 0.05 },
    speed: 0.68,
    speedSpread: 0.25,
    formVariance: 0.06,
    blunderRate: 0.02,
  },
  {
    id: "max",
    name: "Max",
    title: "The Specialist",
    initials: "MX",
    accent: "from-fuchsia-400 to-violet-700",
    rating: 1710,
    tagline: "Lives for advanced machining problems.",
    traits: ["High difficulty capability", "Strong in advanced machining calculations", "Occasionally makes mistakes"],
    accuracy: { beginner: 0.86, intermediate: 0.8, advanced: 0.8 },
    topicBonus: { "machining-time": 0.06, "feed-rate": 0.06, "material-removal-rate": 0.04 },
    speed: 0.5,
    speedSpread: 0.4,
    formVariance: 0.1,
    blunderRate: 0.1,
  },
];

const BY_ID = new Map(BOTS.map((b) => [b.id, b]));

export function getBot(id: string): BotProfile | undefined {
  return BY_ID.get(id);
}

export const DEFAULT_BOT_IDS = BOTS.map((b) => b.id);
