import type { Question } from "@/types/question";

/**
 * Seeded question pool for the Machining Sprint.
 *
 * Every numerical answer below has been hand-verified and is re-checked in
 * `lib/game/__tests__/questions.test.ts` from the stated parameters.
 * The intermediate tier is the default five-question sprint.
 */
export const QUESTIONS: Question[] = [
  // ───────────── Intermediate (default sprint) ─────────────
  {
    id: "cs-int-1",
    kind: "numeric",
    topic: "cutting-speed",
    difficulty: "intermediate",
    title: "Spindle Speed from Cutting Speed",
    prompt:
      "A lathe operates at a cutting speed of 120 m/min. The workpiece diameter is 60 mm. Calculate the spindle speed.",
    parameters: [
      { label: "Cutting speed V", value: "120 m/min" },
      { label: "Workpiece diameter D", value: "60 mm" },
    ],
    formula: "N = (1000 × V) / (π × D)",
    formulaHint: "Spindle speed N = (1000 × V) / (π × D), with V in m/min and D in mm.",
    referenceSolution: [
      "Use N = (1000 × V) / (π × D). The factor 1000 converts V from m/min to mm/min so units cancel with D in mm.",
      "N = (1000 × 120) / (π × 60) = 120000 / 188.50",
      "N ≈ 636.6 RPM, which rounds to approximately 637 RPM.",
    ],
    answerDisplay: "≈ 637 RPM",
    answer: 636.62,
    unit: "RPM",
    unitOptions: ["RPM", "rev/s", "m/min"],
    tolerance: 0.01,
  },
  {
    id: "mt-int-1",
    kind: "numeric",
    topic: "machining-time",
    difficulty: "intermediate",
    title: "Turning Pass Machining Time",
    prompt:
      "A workpiece of length 200 mm is turned at a feed of 0.25 mm/rev and a spindle speed of 400 RPM. Calculate the machining time for one pass.",
    parameters: [
      { label: "Length of cut L", value: "200 mm" },
      { label: "Feed f", value: "0.25 mm/rev" },
      { label: "Spindle speed N", value: "400 RPM" },
    ],
    formula: "T = L / (f × N)",
    formulaHint: "Machining time T = L / (f × N). f × N is the tool's linear feed rate in mm/min.",
    referenceSolution: [
      "Tool feed rate = f × N = 0.25 mm/rev × 400 rev/min = 100 mm/min.",
      "T = L / (f × N) = 200 mm / 100 mm/min",
      "T = 2 min.",
    ],
    answerDisplay: "2 min",
    answer: 2,
    unit: "min",
    unitOptions: ["min", "s", "h"],
    tolerance: 0.01,
  },
  {
    id: "fr-int-1",
    kind: "numeric",
    topic: "feed-rate",
    difficulty: "intermediate",
    title: "Milling Table Feed Rate",
    prompt:
      "A milling cutter has four teeth. The feed per tooth is 0.1 mm and the spindle speed is 500 RPM. Calculate the table feed rate.",
    parameters: [
      { label: "Number of teeth z", value: "4" },
      { label: "Feed per tooth f_z", value: "0.1 mm/tooth" },
      { label: "Spindle speed N", value: "500 RPM" },
    ],
    formula: "F = f_z × z × N",
    formulaHint: "Feed rate F = f_z × z × N.",
    referenceSolution: [
      "Use F = f_z × z × N.",
      "F = 0.1 mm/tooth × 4 teeth/rev × 500 rev/min",
      "F = 200 mm/min.",
    ],
    answerDisplay: "200 mm/min",
    answer: 200,
    unit: "mm/min",
    unitOptions: ["mm/min", "mm/rev", "m/min"],
    tolerance: 0.01,
  },
  {
    id: "mrr-int-1",
    kind: "numeric",
    topic: "material-removal-rate",
    difficulty: "intermediate",
    title: "Turning Material Removal Rate",
    prompt:
      "In a turning operation the cutting speed is 100 m/min, the feed is 0.2 mm/rev and the depth of cut is 2 mm. Convert the cutting speed to mm/min, then calculate the material removal rate.",
    parameters: [
      { label: "Cutting speed V", value: "100 m/min" },
      { label: "Feed f", value: "0.2 mm/rev" },
      { label: "Depth of cut d", value: "2 mm" },
    ],
    formula: "MRR = V × f × d (V in mm/min)",
    formulaHint: "MRR = V × f × d. Convert V to mm/min first (× 1000).",
    referenceSolution: [
      "Convert cutting speed: V = 100 m/min × 1000 = 100000 mm/min.",
      "MRR = V × f × d = 100000 × 0.2 × 2",
      "MRR = 40000 mm³/min (= 40 cm³/min).",
    ],
    answerDisplay: "40,000 mm³/min",
    answer: 40000,
    unit: "mm³/min",
    unitOptions: ["mm³/min", "cm³/min", "mm²/min"],
    tolerance: 0.01,
  },
  {
    id: "po-int-1",
    kind: "mcq",
    topic: "production-optimization",
    difficulty: "intermediate",
    title: "Throughput Improvement",
    prompt:
      "A production line produces 100 units in 500 minutes. A process improvement increases throughput by 25%. How many units can be produced in the same 500 minutes?",
    parameters: [
      { label: "Current output", value: "100 units / 500 min" },
      { label: "Throughput gain", value: "+25%" },
    ],
    formula: "New output = Current output × (1 + gain)",
    formulaHint: "Throughput is units per unit time. Scale the current output by (1 + gain).",
    referenceSolution: [
      "Current throughput = 100 units / 500 min = 0.2 units/min.",
      "New throughput = 0.2 × 1.25 = 0.25 units/min.",
      "Output in 500 min = 0.25 × 500 = 125 units.",
    ],
    answerDisplay: "125 units",
    options: [
      { id: "a", label: "80 units" },
      { id: "b", label: "120 units" },
      { id: "c", label: "125 units" },
      { id: "d", label: "133 units" },
    ],
    correctOptionId: "c",
  },

  // ───────────── Beginner ─────────────
  {
    id: "cs-beg-1",
    kind: "numeric",
    topic: "cutting-speed",
    difficulty: "beginner",
    title: "Surface Cutting Speed",
    prompt:
      "A 50 mm diameter bar is turned at a spindle speed of 500 RPM. Calculate the cutting speed at the workpiece surface.",
    parameters: [
      { label: "Diameter D", value: "50 mm" },
      { label: "Spindle speed N", value: "500 RPM" },
    ],
    formula: "V = (π × D × N) / 1000",
    formulaHint: "V = (π × D × N) / 1000 gives V in m/min when D is in mm.",
    referenceSolution: [
      "Use V = (π × D × N) / 1000.",
      "V = (π × 50 × 500) / 1000 = 78539.8 / 1000",
      "V ≈ 78.5 m/min.",
    ],
    answerDisplay: "≈ 78.5 m/min",
    answer: 78.54,
    unit: "m/min",
    unitOptions: ["m/min", "m/s", "RPM"],
    tolerance: 0.01,
  },
  {
    id: "mt-beg-1",
    kind: "numeric",
    topic: "machining-time",
    difficulty: "beginner",
    title: "Single Pass Time",
    prompt:
      "A shaft is turned over a length of 150 mm with a feed of 0.3 mm/rev at 500 RPM. How long does one pass take?",
    parameters: [
      { label: "Length L", value: "150 mm" },
      { label: "Feed f", value: "0.3 mm/rev" },
      { label: "Spindle speed N", value: "500 RPM" },
    ],
    formula: "T = L / (f × N)",
    formulaHint: "T = L / (f × N).",
    referenceSolution: [
      "Feed rate f × N = 0.3 × 500 = 150 mm/min.",
      "T = 150 mm / 150 mm/min",
      "T = 1 min.",
    ],
    answerDisplay: "1 min",
    answer: 1,
    unit: "min",
    unitOptions: ["min", "s", "h"],
    tolerance: 0.01,
  },
  {
    id: "fr-beg-1",
    kind: "mcq",
    topic: "feed-rate",
    difficulty: "beginner",
    title: "Milling Feed Relationship",
    prompt:
      "Which expression gives the table feed rate F (mm/min) of a milling cutter with z teeth, feed per tooth f_z (mm/tooth) and spindle speed N (RPM)?",
    parameters: [{ label: "Variables", value: "z, f_z, N" }],
    formula: "F = f_z × z × N",
    formulaHint: "Think about units: mm/tooth × teeth/rev × rev/min.",
    referenceSolution: [
      "Each revolution advances the table by f_z for every tooth: f_z × z mm/rev.",
      "Multiplying by N rev/min gives mm/min.",
      "So F = f_z × z × N.",
    ],
    answerDisplay: "F = f_z × z × N",
    options: [
      { id: "a", label: "F = f_z × N / z" },
      { id: "b", label: "F = f_z × z × N" },
      { id: "c", label: "F = z × N / f_z" },
      { id: "d", label: "F = π × f_z × z" },
    ],
    correctOptionId: "b",
  },
  {
    id: "mrr-beg-1",
    kind: "numeric",
    topic: "material-removal-rate",
    difficulty: "beginner",
    title: "Light Finishing MRR",
    prompt:
      "A finishing pass uses a cutting speed of 50 m/min, a feed of 0.1 mm/rev and a depth of cut of 1 mm. Calculate the material removal rate.",
    parameters: [
      { label: "Cutting speed V", value: "50 m/min" },
      { label: "Feed f", value: "0.1 mm/rev" },
      { label: "Depth of cut d", value: "1 mm" },
    ],
    formula: "MRR = V × f × d (V in mm/min)",
    formulaHint: "MRR = V × f × d with V converted to mm/min.",
    referenceSolution: [
      "V = 50 m/min × 1000 = 50000 mm/min.",
      "MRR = 50000 × 0.1 × 1",
      "MRR = 5000 mm³/min.",
    ],
    answerDisplay: "5,000 mm³/min",
    answer: 5000,
    unit: "mm³/min",
    unitOptions: ["mm³/min", "cm³/min", "mm²/min"],
    tolerance: 0.01,
  },
  {
    id: "po-beg-1",
    kind: "numeric",
    topic: "production-optimization",
    difficulty: "beginner",
    title: "Parts per Shift",
    prompt:
      "A CNC cell has a cycle time of 4 minutes per part. How many parts does it produce in an 8-hour shift with no downtime?",
    parameters: [
      { label: "Cycle time", value: "4 min/part" },
      { label: "Shift length", value: "8 h" },
    ],
    formula: "Output = Available time / Cycle time",
    formulaHint: "Convert the shift to minutes, then divide by the cycle time.",
    referenceSolution: [
      "Available time = 8 h × 60 = 480 min.",
      "Output = 480 min / 4 min per part",
      "Output = 120 parts.",
    ],
    answerDisplay: "120 units",
    answer: 120,
    unit: "units",
    unitOptions: ["units", "units/min"],
    tolerance: 0.001,
  },

  // ───────────── Advanced ─────────────
  {
    id: "cs-adv-1",
    kind: "mcq",
    topic: "cutting-speed",
    difficulty: "advanced",
    title: "Taylor Tool Life Speed",
    prompt:
      "A carbide tool follows Taylor's tool life equation V × Tⁿ = C with n = 0.25 and C = 300 (V in m/min, T in min). What cutting speed gives a tool life of 16 minutes?",
    parameters: [
      { label: "Taylor exponent n", value: "0.25" },
      { label: "Taylor constant C", value: "300" },
      { label: "Target tool life T", value: "16 min" },
    ],
    formula: "V = C / Tⁿ",
    formulaHint: "Rearrange V × Tⁿ = C to V = C / Tⁿ.",
    referenceSolution: [
      "Rearrange Taylor's equation: V = C / Tⁿ.",
      "Tⁿ = 16^0.25 = 2.",
      "V = 300 / 2 = 150 m/min.",
    ],
    answerDisplay: "150 m/min",
    options: [
      { id: "a", label: "75 m/min" },
      { id: "b", label: "150 m/min" },
      { id: "c", label: "18.75 m/min" },
      { id: "d", label: "1200 m/min" },
    ],
    correctOptionId: "b",
  },
  {
    id: "mt-adv-1",
    kind: "numeric",
    topic: "machining-time",
    difficulty: "advanced",
    title: "Machining Time with Approach & Overtravel",
    prompt:
      "An 80 mm diameter bar, 250 mm long, is turned at a cutting speed of 100 m/min with a feed of 0.2 mm/rev. Allow 3 mm approach and 2 mm overtravel. Calculate the machining time for one pass.",
    parameters: [
      { label: "Diameter D", value: "80 mm" },
      { label: "Workpiece length", value: "250 mm" },
      { label: "Approach + overtravel", value: "3 mm + 2 mm" },
      { label: "Cutting speed V", value: "100 m/min" },
      { label: "Feed f", value: "0.2 mm/rev" },
    ],
    formula: "N = (1000 × V) / (π × D);  T = (L + A + O) / (f × N)",
    formulaHint: "Find N first, then T = total tool travel / (f × N).",
    referenceSolution: [
      "N = (1000 × 100) / (π × 80) = 100000 / 251.33 ≈ 397.9 RPM.",
      "Total travel = 250 + 3 + 2 = 255 mm. Feed rate = 0.2 × 397.9 ≈ 79.58 mm/min.",
      "T = 255 / 79.58 ≈ 3.20 min.",
    ],
    answerDisplay: "≈ 3.20 min",
    answer: 3.204,
    unit: "min",
    unitOptions: ["min", "s", "h"],
    tolerance: 0.015,
  },
  {
    id: "fr-adv-1",
    kind: "numeric",
    topic: "feed-rate",
    difficulty: "advanced",
    title: "Feed Rate from Cutting Speed",
    prompt:
      "A 100 mm diameter face mill with 8 inserts runs at a cutting speed of 50 m/min with a feed per tooth of 0.05 mm. Calculate the table feed rate.",
    parameters: [
      { label: "Cutter diameter D", value: "100 mm" },
      { label: "Teeth z", value: "8" },
      { label: "Cutting speed V", value: "50 m/min" },
      { label: "Feed per tooth f_z", value: "0.05 mm/tooth" },
    ],
    formula: "N = (1000 × V) / (π × D);  F = f_z × z × N",
    formulaHint: "Compute spindle speed from V and D, then F = f_z × z × N.",
    referenceSolution: [
      "N = (1000 × 50) / (π × 100) = 50000 / 314.16 ≈ 159.2 RPM.",
      "F = 0.05 × 8 × 159.2",
      "F ≈ 63.7 mm/min.",
    ],
    answerDisplay: "≈ 63.7 mm/min",
    answer: 63.66,
    unit: "mm/min",
    unitOptions: ["mm/min", "mm/rev", "m/min"],
    tolerance: 0.015,
  },
  {
    id: "mrr-adv-1",
    kind: "numeric",
    topic: "material-removal-rate",
    difficulty: "advanced",
    title: "Face Milling MRR",
    prompt:
      "A face milling pass removes material across a width of 60 mm at a depth of 3 mm with a table feed of 250 mm/min. Calculate the material removal rate in cm³/min.",
    parameters: [
      { label: "Width of cut w", value: "60 mm" },
      { label: "Depth of cut d", value: "3 mm" },
      { label: "Table feed F", value: "250 mm/min" },
    ],
    formula: "MRR = w × d × F",
    formulaHint: "MRR = w × d × F; 1 cm³ = 1000 mm³.",
    referenceSolution: [
      "MRR = w × d × F = 60 × 3 × 250 = 45000 mm³/min.",
      "Convert: 45000 mm³/min ÷ 1000 = 45 cm³/min.",
      "MRR = 45 cm³/min.",
    ],
    answerDisplay: "45 cm³/min (45,000 mm³/min)",
    answer: 45,
    unit: "cm³/min",
    unitOptions: ["cm³/min", "mm³/min", "mm²/min"],
    tolerance: 0.01,
  },
  {
    id: "po-adv-1",
    kind: "mcq",
    topic: "production-optimization",
    difficulty: "advanced",
    title: "Bottleneck Throughput",
    prompt:
      "A three-station serial line has station cycle times of 2.0, 2.5 and 1.6 min/unit. Ignoring downtime, what is the maximum output in a 480-minute shift?",
    parameters: [
      { label: "Station cycle times", value: "2.0 / 2.5 / 1.6 min" },
      { label: "Shift length", value: "480 min" },
    ],
    formula: "Output = Available time / Bottleneck cycle time",
    formulaHint: "A serial line can only run as fast as its slowest station.",
    referenceSolution: [
      "The bottleneck is the slowest station: 2.5 min/unit.",
      "Output = 480 min / 2.5 min per unit",
      "Output = 192 units.",
    ],
    answerDisplay: "192 units",
    options: [
      { id: "a", label: "79 units" },
      { id: "b", label: "192 units" },
      { id: "c", label: "240 units" },
      { id: "d", label: "300 units" },
    ],
    correctOptionId: "b",
  },
];

const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export function getQuestion(id: string): Question | undefined {
  return BY_ID.get(id);
}
