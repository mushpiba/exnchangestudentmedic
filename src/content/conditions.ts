// Mini encyclopedia: structured so each condition reuses shared, translated phrases.
// Draft content — must be reviewed by a clinician before the pilot.
import type { MessageKey } from "../i18n";
import type { SymptomId } from "./symptoms";

export type FlagLevel = "emergency" | "urgent";

export const FLAGS: Record<string, FlagLevel> = {
  breathing: "emergency",
  chestPain: "emergency",
  confusion: "emergency",
  worstHeadache: "emergency",
  weakness: "emergency",
  facialSwelling: "emergency",
  bloodStoolVomit: "emergency",
  severeAbdomen: "emergency",
  headInjury: "emergency",
  selfHarm: "emergency",
  heavyBleeding: "emergency",
  visionLoss: "emergency",
  pregnancyPain: "emergency",
  stiffNeckFever: "emergency",
  numbnessWeakness: "emergency",
  highFever: "urgent",
  dehydration: "urgent",
  longLasting: "urgent",
  spreadingRedness: "urgent",
  flankFever: "urgent",
  swellingFever: "urgent",
};
export const flagKey = (f: string) => ("flag." + f) as MessageKey;
export const careKey = (c: string) => ("care." + c) as MessageKey;

type Condition = {
  name: MessageKey;
  symptoms: SymptomId[];
  care: string[];
  flags: (keyof typeof FLAGS)[];
  depts: string[];
  /** Simtomi OTC categories; empty when the usual treatment needs a prescription. */
  otc: string[];
};

export const CONDITIONS: Record<string, Condition> = {
  cold: {
    name: "cond.cold.name",
    symptoms: ["cough", "rhinorrhea", "nasalCongestion", "soreThroat", "sneezing", "fever"],
    care: ["rest", "fluids", "humidify", "saltGargle", "handwashing"],
    flags: ["breathing", "highFever", "longLasting"],
    depts: ["JIM", "JFM", "JEN"],
    otc: ["UR", "FE"],
  },
  flu: {
    name: "cond.flu.name",
    symptoms: ["fever", "chills", "bodyAche", "headache", "cough", "fatigue"],
    care: ["rest", "fluids", "mask", "isolate"],
    flags: ["breathing", "chestPain", "confusion", "highFever", "dehydration"],
    depts: ["JIM", "JFM"],
    otc: ["FE"],
  },
  covid19: {
    name: "cond.covid19.name",
    symptoms: ["fever", "cough", "soreThroat", "fatigue", "bodyAche"],
    care: ["selfTest", "rest", "fluids", "mask", "isolate"],
    flags: ["breathing", "chestPain", "confusion", "highFever"],
    depts: ["JIM", "JFM"],
    otc: ["FE"],
  },
  rhinitis: {
    name: "cond.rhinitis.name",
    symptoms: ["sneezing", "rhinorrhea", "nasalCongestion", "itchyEye"],
    care: ["avoidTriggers", "mask", "salineRinse", "humidify"],
    flags: ["breathing", "longLasting"],
    depts: ["JEN", "JIA"],
    otc: ["AL"],
  },
  gastroenteritis: {
    name: "cond.gastroenteritis.name",
    symptoms: ["diarrhea", "vomit", "nausea", "stomachache", "fever"],
    care: ["oralRehydration", "lightMeals", "handwashing", "rest"],
    flags: ["dehydration", "bloodStoolVomit", "severeAbdomen", "highFever"],
    depts: ["JIM", "JIG"],
    otc: ["GI"],
  },
  indigestion: {
    name: "sx.indigestion",
    symptoms: ["indigestion", "bloating", "nausea", "heartburn"],
    care: ["lightMeals", "avoidLateMeals", "avoidAlcohol"],
    flags: ["chestPain", "bloodStoolVomit", "severeAbdomen", "longLasting"],
    depts: ["JIM", "JIG"],
    otc: ["GI"],
  },
  heartburn: {
    name: "cond.heartburn.name",
    symptoms: ["heartburn", "indigestion", "cough", "soreThroat"],
    care: ["avoidLateMeals", "avoidAlcohol", "lightMeals"],
    flags: ["chestPain", "bloodStoolVomit", "longLasting"],
    depts: ["JIM", "JIG"],
    otc: ["GI"],
  },
  headache: {
    name: "sx.headache",
    symptoms: ["headache", "neckPain", "dizziness", "nausea"],
    care: ["rest", "fluids", "screenBreak", "sleepRoutine"],
    flags: ["worstHeadache", "weakness", "stiffNeckFever", "headInjury", "confusion"],
    depts: ["JNL", "JIM", "JFM"],
    otc: ["MS"],
  },
  musclePain: {
    name: "cond.musclePain.name",
    symptoms: ["musclePain", "lumbarPain", "neckPain", "shoulderPain"],
    care: ["coldCompress", "warmCompress", "stretch", "rest"],
    flags: ["numbnessWeakness", "highFever", "longLasting"],
    depts: ["JOS", "JRM", "JAN"],
    otc: ["MS"],
  },
  menstrualCramps: {
    name: "sx.menstrualCramps",
    symptoms: ["menstrualCramps", "stomachache", "lumbarPain", "nausea"],
    care: ["warmCompress", "rest", "exercise"],
    flags: ["heavyBleeding", "pregnancyPain", "severeAbdomen"],
    depts: ["JOG"],
    otc: ["MS", "WW"],
  },
  rash: {
    name: "cond.rash.name",
    symptoms: ["rash", "itching", "hives"],
    care: ["avoidScratch", "lukewarmShower", "avoidTriggers"],
    flags: ["facialSwelling", "spreadingRedness", "highFever"],
    depts: ["JDM", "JIA"],
    otc: ["AL", "DM"],
  },
  conjunctivitis: {
    name: "cond.conjunctivitis.name",
    symptoms: ["redEye", "itchyEye", "eyeDischarge", "eyePain"],
    care: ["eyeHygiene", "handwashing", "noContacts"],
    flags: ["visionLoss", "longLasting"],
    depts: ["JOP"],
    otc: ["OT"],
  },
  toothache: {
    name: "cond.toothache.name",
    symptoms: ["toothache", "gumSwelling", "gumBleeding"],
    care: ["dentalHygiene", "saltGargle"],
    flags: ["swellingFever", "facialSwelling"],
    depts: ["JDT", "JOM"],
    otc: ["DN", "MS"],
  },
  constipation: {
    name: "sx.constipation",
    symptoms: ["constipation", "bloating", "stomachache"],
    care: ["fiberWater", "exercise", "fluids"],
    flags: ["bloodStoolVomit", "severeAbdomen", "longLasting"],
    depts: ["JIM", "JIG", "JGC"],
    otc: ["GI"],
  },
  uti: {
    name: "cond.uti.name",
    symptoms: ["dysuria", "frequentUrination", "hematuria"],
    care: ["fluids", "noHolding"],
    flags: ["flankFever", "highFever"],
    depts: ["JUR", "JIM", "JOG"],
    otc: [],
  },
  hangover: {
    name: "sx.hangover",
    symptoms: ["hangover", "headache", "nausea", "vomit"],
    care: ["fluids", "rest", "lightMeals", "avoidAlcohol"],
    flags: ["confusion", "bloodStoolVomit", "dehydration"],
    depts: ["JIM"],
    otc: ["GI"],
  },
  stress: {
    name: "cond.stress.name",
    symptoms: ["anxiety", "depressedMood", "insomnia", "fatigue"],
    care: ["talkSomeone", "sleepRoutine", "exercise", "avoidAlcohol"],
    flags: ["selfHarm"],
    depts: ["JPY", "JFM"],
    otc: [],
  },
};

export const summaryKey = (id: string) => ("cond." + id + ".summary") as MessageKey;
export const otcKey = (o: string) => ("otc." + o) as MessageKey;

/** Conditions that mention a symptom, for "related information" on the card. */
export const conditionsFor = (symptomId: string) =>
  Object.entries(CONDITIONS)
    .filter(([, c]) => (c.symptoms as string[]).includes(symptomId))
    .map(([id]) => id);
