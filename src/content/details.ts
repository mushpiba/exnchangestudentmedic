// Symptom detail questions, written for NARU from general clinical history-taking (character, timing,
// what makes it worse, spread, and warning signs). Generated from scratchpad details_bank.py; edit there or here.
// Each question's wording lives in i18n as dt.<id>, dt.<id>.label (card label) and dt.<id>.<option>.
import type { MessageKey } from "../i18n";
import { SYMPTOMS } from "./symptoms";

export type DetailQuestion = { many: boolean; options: string[]; danger: string[] };

export const DETAILS = {
  painQuality: { many: true, options: ["stabbing", "throbbing", "cramping", "burning", "dull", "pressing", "pricking"], danger: [] },
  painPattern: { many: false, options: ["constant", "comesGoes", "worsening", "improving"], danger: [] },
  painWorse: { many: true, options: ["moving", "breathing", "afterMeal", "hungry", "night", "lying", "pressed", "strain", "none"], danger: [] },
  painSpread: { many: false, options: ["no", "yes", "unsure"], danger: [] },
  feverInfo: { many: true, options: ["chills", "sweat", "tookMeds", "over3days", "rash", "stiffNeck", "confused"], danger: ["stiffNeck", "confused"] },
  cough: { many: false, options: ["dry", "wet", "barking"], danger: [] },
  sputum: { many: true, options: ["clear", "yellow", "green", "brown", "blood"], danger: ["blood"] },
  coughMore: { many: true, options: ["night", "morning", "wheeze", "chest", "fits", "vomitAfter", "nightBreath", "stridor", "breathless"], danger: ["stridor", "breathless"] },
  nose: { many: true, options: ["clear", "thick", "blocked", "sneeze", "itchy", "smell", "nosebleed"], danger: [] },
  throat: { many: true, options: ["swallow", "hoarse", "scratchy", "spots", "saliva", "mouth"], danger: ["saliva", "mouth"] },
  headWhere: { many: true, options: ["forehead", "temples", "back", "whole", "oneSide", "eyes"], danger: [] },
  headSudden: { many: false, options: ["yes", "no"], danger: ["yes"] },
  headWith: { many: true, options: ["nausea", "light", "aura", "fever", "stiffNeck", "weakness", "double"], danger: ["stiffNeck", "weakness", "double"] },
  stool: { many: true, options: ["watery", "loose", "hard", "mucus", "pale", "blood", "black", "noGas"], danger: ["blood", "black", "noGas"] },
  diarrheaCount: { many: false, options: ["few", "some", "many"], danger: [] },
  vomiting: { many: false, options: ["none", "few", "many", "noWater", "blood"], danger: ["noWater", "blood"] },
  food: { many: false, options: ["yes", "no", "unsure"], danger: [] },
  skin: { many: true, options: ["itchy", "spreading", "blisters", "pus", "warm", "flaky", "faceSwelling"], danger: ["faceSwelling"] },
  skinTrigger: { many: true, options: ["drug", "food", "cosmetic", "bite", "plantAnimal", "none"], danger: [] },
  urine: { many: true, options: ["pain", "often", "urgent", "blood", "cloudy", "flank", "fever"], danger: [] },
  dizzyType: { many: false, options: ["spinning", "lightheaded", "faint", "unsteady"], danger: [] },
  dizzyWith: { many: true, options: ["standing", "ear", "nausea", "fainted", "speech", "seizure"], danger: ["fainted", "speech", "seizure"] },
  eye: { many: true, options: ["red", "itchy", "discharge", "light", "foreign", "lens", "vision"], danger: ["vision"] },
  ear: { many: true, options: ["pain", "discharge", "blocked", "hearing", "ringing", "water"], danger: [] },
  lastPeriod: { many: false, options: ["week", "month", "late", "unknown"], danger: [] },
  periodMore: { many: true, options: ["heavy", "irregular", "painful", "spotting", "soaking"], danger: ["soaking"] },
  injuryHow: { many: false, options: ["fall", "hit", "twist", "cut", "sport", "traffic", "hot"], danger: [] },
  injuryLook: { many: true, options: ["swelling", "bruise", "cantMove", "bleeding", "numb", "deformed"], danger: ["deformed"] },
  headHit: { many: true, options: ["headache", "unconscious", "vomit", "confused"], danger: ["unconscious", "vomit", "confused"] },
  mood: { many: true, options: ["sleep", "appetite", "worry", "down", "focus", "panic", "energetic", "voices", "watched", "selfHarm", "harmOthers"], danger: ["selfHarm", "harmOthers"] },
  tooth: { many: true, options: ["cold", "chew", "rest", "gum", "broken", "filling", "wisdom", "breath", "face"], danger: ["face"] },
  chest: { many: true, options: ["pressed", "breathing", "palpitations", "breathless", "exertion", "sweat", "radiates", "atRest"], danger: ["breathless", "sweat", "radiates", "atRest"] },
  painStart: { many: false, options: ["sudden", "gradual", "unsure"], danger: [] },
  breathLevel: { many: false, options: ["hardWork", "littleWork", "rest"], danger: ["rest"] },
  stomachMore: { many: true, options: ["burning", "afterMeal", "lying", "bloated", "earlyFull", "noAppetite"], danger: [] },
  weight: { many: false, options: ["lost", "gained", "same"], danger: [] },
  dentalHistory: { many: true, options: ["anesthesia", "extraction", "none"], danger: [] },
  dentalWant: { many: false, options: ["painOnly", "all", "insurance", "discuss"], danger: [] },
  sexActive: { many: false, options: ["yes", "no", "skip"], danger: [] },
  breastfeeding: { many: false, options: ["yes", "no", "na"], danger: [] },
  currentTreatment: { many: false, options: ["yes", "no"], danger: [] },
  recentSurgery: { many: false, options: ["yes", "no"], danger: [] },
  transfusion: { many: false, options: ["yes", "no", "unsure"], danger: [] },
  smoking: { many: false, options: ["yes", "quit", "no"], danger: [] },
  alcohol: { many: false, options: ["no", "sometimes", "often"], danger: [] },
  travel: { many: false, options: ["yes", "no"], danger: [] },
  sickContact: { many: false, options: ["yes", "no", "unsure"], danger: [] },
  immune: { many: false, options: ["yes", "no", "unsure"], danger: [] },
  interpreter: { many: false, options: ["yes", "no"], danger: [] },
  family: { many: true, options: ["hypertension", "diabetes", "heart", "stroke", "cancer", "tuberculosis", "asthma", "none", "unknown"], danger: [] },
} satisfies Record<string, DetailQuestion>;
export type DetailId = keyof typeof DETAILS;

/** Asked of everyone on the history step (kept apart from the symptom's own questions). */
export const GENERAL: DetailId[] = ["breastfeeding", "currentTreatment", "recentSurgery", "transfusion", "smoking", "alcohol", "travel", "sickContact", "immune", "interpreter"];

/** Shared questions for any symptom that is pain. */
const PAIN: DetailId[] = ["painStart", "painQuality", "painPattern", "painWorse", "painSpread"];

const BY_SYMPTOM: Partial<Record<keyof typeof SYMPTOMS, DetailId[]>> = {
  fever: ["feverInfo"],
  chills: ["feverInfo"],
  cold: ["nose", "throat", "cough"],
  cough: ["cough", "sputum", "coughMore"],
  sputum: ["cough", "sputum", "coughMore"],
  rhinorrhea: ["nose"],
  nasalCongestion: ["nose"],
  sneezing: ["nose"],
  rhinitis: ["nose", "eye"],
  soreThroat: ["throat"],
  dysphagia: ["throat"],
  wheezing: ["breathLevel", "coughMore"],
  shortBreath: ["breathLevel", "chest", "coughMore"],
  headache: ["headWhere", "headSudden", "headWith"],
  dizziness: ["dizzyType", "dizzyWith"],
  fainting: ["dizzyType", "dizzyWith"],
  stomachache: ["vomiting", "stool", "food"],
  nausea: ["vomiting", "food"],
  vomit: ["vomiting", "food"],
  diarrhea: ["diarrheaCount", "stool", "food"],
  constipation: ["stool"],
  bloodyStool: ["stool"],
  hangover: ["vomiting"],
  heartburn: ["stomachMore"],
  indigestion: ["stomachMore"],
  bloating: ["stomachMore", "stool"],
  appetiteLoss: ["stomachMore", "weight"],
  weightChange: ["weight"],
  rash: ["skin", "skinTrigger"],
  itching: ["skin", "skinTrigger"],
  hives: ["skin", "skinTrigger"],
  acne: ["skin"],
  insectBite: ["skin"],
  allergyReaction: ["skin", "skinTrigger"],
  dysuria: ["urine"],
  frequentUrination: ["urine"],
  hematuria: ["urine"],
  flankPain: ["urine"],
  redEye: ["eye"],
  eyePain: ["eye"],
  itchyEye: ["eye"],
  blurredVision: ["eye"],
  eyeDischarge: ["eye"],
  earPain: ["ear"],
  hearingLoss: ["ear"],
  tinnitus: ["ear"],
  earDischarge: ["ear"],
  menstrualCramps: ["lastPeriod", "periodMore"],
  irregularPeriod: ["lastPeriod", "periodMore", "sexActive"],
  abnormalBleeding: ["lastPeriod", "periodMore", "sexActive"],
  abnormalDischarge: ["lastPeriod", "sexActive"],
  sprain: ["injuryHow", "injuryLook"],
  cut: ["injuryHow", "injuryLook"],
  burn: ["injuryHow", "injuryLook"],
  bruise: ["injuryHow", "injuryLook"],
  headInjury: ["injuryHow", "headHit"],
  anxiety: ["mood"],
  depressedMood: ["mood"],
  insomnia: ["mood"],
  toothache: ["tooth", "dentalHistory", "dentalWant"],
  gumBleeding: ["tooth", "dentalWant"],
  gumSwelling: ["tooth", "dentalHistory", "dentalWant"],
  chestPain: ["chest", "breathLevel"],
  palpitations: ["chest"],
};

/** Detail questions for a main symptom: its own first, then the shared pain questions. */
export function detailsFor(symptom: string): DetailId[] {
  const own = BY_SYMPTOM[symptom as keyof typeof SYMPTOMS] ?? [];
  const pain = (SYMPTOMS as Record<string, { pain?: boolean }>)[symptom]?.pain ? PAIN : [];
  return [...new Set([...own, ...pain])].filter((id) => id !== "family" && !GENERAL.includes(id));
}

export const detailKey = (id: string) => ("dt." + id) as MessageKey;
export const detailLabelKey = (id: string) => ("dt." + id + ".label") as MessageKey;
export const optionKey = (id: string, option: string) => ("dt." + id + "." + option) as MessageKey;
export const isDanger = (id: string, option: string) => (DETAILS as Record<string, DetailQuestion>)[id]?.danger.includes(option) ?? false;
