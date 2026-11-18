// Symptom vocabulary for the intake. Category and department codes and about twenty symptom
// names come from the Simtomi language pack (src/i18n/simtomi); the rest are NARU's own.
import type { MessageKey } from "../i18n";

/** Category order shown in "browse". BFR is the shortcut list of common complaints. */
export const CATEGORIES = [
  "BFR", "BWH", "BNR", "BRE", "BEA", "BOR", "BDT", "BHV", "BGI", "BMS",
  "INJ", "BUR", "BOG", "BOP", "BPY", "BDM", "BAL", "BED", "BBR",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** loc: "area" asks where on the body (and which side); "side" asks only left/right. */
type Symptom = { cats: Category[]; loc?: "area" | "side"; pain?: boolean };

export const SYMPTOMS = {
  cold: { cats: ["BFR", "BRE"] },
  fever: { cats: ["BFR", "BWH"] },
  chills: { cats: ["BWH"] },
  fatigue: { cats: ["BWH"] },
  bodyAche: { cats: ["BWH"], pain: true },
  nightSweats: { cats: ["BWH"] },
  swollenGlands: { cats: ["BWH"], loc: "area" },
  appetiteLoss: { cats: ["BWH", "BGI"] },
  headache: { cats: ["BFR", "BNR"], pain: true },
  dizziness: { cats: ["BNR"] },
  numbness: { cats: ["BNR"], loc: "area" },
  fainting: { cats: ["BNR"] },
  cough: { cats: ["BFR", "BRE"] },
  sputum: { cats: ["BRE"] },
  rhinorrhea: { cats: ["BRE"] },
  nasalCongestion: { cats: ["BRE"] },
  soreThroat: { cats: ["BFR", "BRE", "BOR"], pain: true },
  shortBreath: { cats: ["BRE", "BHV"] },
  wheezing: { cats: ["BRE"] },
  sneezing: { cats: ["BRE", "BAL"] },
  earPain: { cats: ["BEA"], loc: "side", pain: true },
  hearingLoss: { cats: ["BEA"], loc: "side" },
  tinnitus: { cats: ["BEA"], loc: "side" },
  earDischarge: { cats: ["BEA"], loc: "side" },
  mouthUlcer: { cats: ["BOR"], pain: true },
  dysphagia: { cats: ["BOR"] },
  toothache: { cats: ["BDT"], loc: "side", pain: true },
  gumBleeding: { cats: ["BDT"] },
  gumSwelling: { cats: ["BDT"], loc: "side", pain: true },
  chestPain: { cats: ["BHV"], pain: true },
  palpitations: { cats: ["BHV"] },
  legSwelling: { cats: ["BHV"], loc: "side" },
  stomachache: { cats: ["BFR", "BGI"], loc: "area", pain: true },
  nausea: { cats: ["BGI"] },
  vomit: { cats: ["BGI"] },
  diarrhea: { cats: ["BFR", "BGI"] },
  constipation: { cats: ["BGI"] },
  heartburn: { cats: ["BGI"] },
  indigestion: { cats: ["BFR", "BGI"] },
  bloating: { cats: ["BGI"] },
  bloodyStool: { cats: ["BGI"] },
  lumbarPain: { cats: ["BMS"], pain: true },
  neckPain: { cats: ["BMS"], pain: true },
  shoulderPain: { cats: ["BMS"], loc: "side", pain: true },
  kneePain: { cats: ["BMS"], loc: "side", pain: true },
  musclePain: { cats: ["BFR", "BMS"], loc: "area", pain: true },
  jointSwelling: { cats: ["BMS"], loc: "area", pain: true },
  sprain: { cats: ["BMS", "INJ"], loc: "area", pain: true },
  cut: { cats: ["INJ"], loc: "area", pain: true },
  burn: { cats: ["INJ"], loc: "area", pain: true },
  bruise: { cats: ["INJ"], loc: "area", pain: true },
  insectBite: { cats: ["INJ", "BDM"], loc: "area" },
  headInjury: { cats: ["INJ"], pain: true },
  dysuria: { cats: ["BUR"], pain: true },
  frequentUrination: { cats: ["BUR"] },
  hematuria: { cats: ["BUR"] },
  flankPain: { cats: ["BUR"], loc: "side", pain: true },
  menstrualCramps: { cats: ["BFR", "BOG"], pain: true },
  irregularPeriod: { cats: ["BOG"] },
  abnormalDischarge: { cats: ["BOG"] },
  abnormalBleeding: { cats: ["BOG"] },
  redEye: { cats: ["BOP"], loc: "side" },
  eyePain: { cats: ["BOP"], loc: "side", pain: true },
  itchyEye: { cats: ["BOP", "BAL"], loc: "side" },
  blurredVision: { cats: ["BOP"], loc: "side" },
  eyeDischarge: { cats: ["BOP"], loc: "side" },
  anxiety: { cats: ["BPY"] },
  depressedMood: { cats: ["BPY"] },
  insomnia: { cats: ["BPY"] },
  rash: { cats: ["BFR", "BDM"], loc: "area" },
  itching: { cats: ["BDM"], loc: "area" },
  hives: { cats: ["BDM", "BAL"], loc: "area" },
  acne: { cats: ["BDM"], loc: "area" },
  rhinitis: { cats: ["BAL"] },
  allergyReaction: { cats: ["BAL"] },
  excessiveThirst: { cats: ["BED"] },
  weightChange: { cats: ["BED"] },
  breastLump: { cats: ["BBR"], loc: "side" },
  breastPain: { cats: ["BBR"], loc: "side", pain: true },
  hangover: { cats: ["BFR"] },
} satisfies Record<string, Symptom>;

export type SymptomId = keyof typeof SYMPTOMS;
export const symptomIds = Object.keys(SYMPTOMS) as SymptomId[];
export const symptomKey = (id: string) => ("sx." + id) as MessageKey;
export const categoryKey = (c: Category) => ("cat." + c) as MessageKey;
export const symptom = (id: string): Symptom | undefined => (SYMPTOMS as Record<string, Symptom>)[id];

export const AREAS = [
  "head", "face", "eye", "ear", "nose", "mouth", "throat", "neck", "shoulder", "chest",
  "upperAbdomen", "lowerAbdomen", "back", "lowerBack", "arm", "hand", "hip", "leg", "knee", "foot", "whole",
] as const;
export const SIDES = ["left", "right", "both"] as const;
export const sideKey = (s: string) => (s === "both" ? "side.both" : "side." + s) as MessageKey;

export const ONSETS = ["hours", "today", "yesterday", "days2to3", "week", "weeks2plus", "monthPlus", "unknown"] as const;
export const ALLERGY_KINDS = ["penicillin", "nsaid", "otherDrug", "food", "other"] as const;
export const PAST = [
  "hypertension", "diabetes", "asthma", "heartDisease", "liverDisease", "kidneyDisease",
  "thyroid", "tuberculosis", "hepatitisB", "epilepsy", "surgery", "none", "unknown",
] as const;
export const PREGNANCY = ["yes", "no", "unsure", "skip"] as const;

/** Simtomi pain scale labels exist for even numbers. */
export const vasKey = (n: number) => ("vas." + Math.min(10, Math.floor(n / 2) * 2)) as MessageKey;

/** Where to start for each category. Reference only — shown as "related departments". */
export const CATEGORY_DEPTS: Record<Category, string[]> = {
  BFR: ["JIM", "JFM"],
  BWH: ["JIM", "JFM"],
  BNR: ["JNL", "JIM"],
  BRE: ["JIM", "JEN"],
  BEA: ["JEN"],
  BOR: ["JEN", "JDT"],
  BDT: ["JDT"],
  BHV: ["JIM", "JIC"],
  BGI: ["JIM", "JIG"],
  BMS: ["JOS", "JRM"],
  INJ: ["JGS", "JOS", "JEM"],
  BUR: ["JUR", "JIM"],
  BOG: ["JOG"],
  BOP: ["JOP"],
  BPY: ["JPY", "JFM"],
  BDM: ["JDM"],
  BAL: ["JIA", "JDM", "JEN"],
  BED: ["JIE", "JIM"],
  BBR: ["JGB", "JOG"],
};

/** Most specific category first: BFR is a shortcut list, not a body system. */
export function departmentsFor(id: string): string[] {
  const cats = symptom(id)?.cats.filter((c) => c !== "BFR") ?? [];
  const list = (cats.length ? cats : ["BFR" as const]).flatMap((c) => CATEGORY_DEPTS[c]);
  return [...new Set(list)].slice(0, 3);
}
export const deptKey = (d: string) => ("dept." + d) as MessageKey;
