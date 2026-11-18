// Imports the medical vocabulary of the Simtomi 1.3.19 language pack into NARU keys.
// Usage: node scripts/import-simtomi.mjs [path-to-simtomi-json-dir]
// Output: src/i18n/simtomi/<locale>.json (13 locales). Re-run when the source pack changes.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2] ?? join(root, "../../assets/flutter_assets/assets/json");
const out = join(root, "src/i18n/simtomi");

const categories = "BFR BWH BNR BRE BEA BOR BDT BHV BGI BMS BUR BOG BOP BPY BDM BAL BED BBR BIM BZZ".split(" ");
const departments =
  "JIM JGS JPD JOS JEN JOP JDM JNL JPY JDT JRM JUR JOG JAN JNS JFM JCS JPS JIC JIP JIG JIE JIH JII JIN JIR JIA JRO JOM JEM JKM JGH JGG JGC JGV JGB".split(" ");
const otc = "UR MS FE TR GI AL DM DN PD MM WW OT NU BG ZD ZZ".split(" ");
const forms = "pill drink liquid candy powder cream spray patch drop mix gargle suppository etc chew".split(" ");

/** NARU key -> Simtomi key */
const map = {
  ...Object.fromEntries(categories.map((c) => ["cat." + c, c])),
  ...Object.fromEntries(departments.map((d) => ["dept." + d, d])),
  ...Object.fromEntries(otc.map((o) => ["otc." + o, "OTC_" + o])),
  ...Object.fromEntries(forms.map((f) => ["form." + f, "OTC_form_" + f])),
  ...Object.fromEntries([0, 2, 4, 6, 8, 10].map((n) => ["vas." + n, "vas_" + n])),
  "sx.cold": "Sx_cold",
  "sx.rhinitis": "Sx_rhinitis",
  "sx.musclePain": "Sx_musclePain",
  "sx.menstrualCramps": "Sx_menstrualCramps",
  "sx.indigestion": "Sx_indigestion",
  "sx.abdominalPain": "Sx_abdominalPain",
  "sx.constipation": "Sx_constipation",
  "sx.hangover": "Sx_hangover",
  "sx.rash": "Sx_rash",
  "sx.headache": "ESx_headache",
  "sx.cough": "ESx_cough",
  "sx.rhinorrhea": "ESx_rhinorrhea",
  "sx.fever": "ESx_fever",
  "sx.stomachache": "ESx_stomachache",
  "sx.diarrhea": "ESx_diarrhea",
  "sx.vomit": "ESx_vomit",
  "sx.heartburn": "ESx_heartburn",
  "sx.lumbarPain": "ESx_lumbarpain",
  "sx.neckPain": "ESx_neckpain",
  "sx.kneePain": "ESx_kneepain",
  "cond.cold.name": "cold",
  "cond.flu.name": "flu",
  "cond.covid19.name": "covid_19",
  "q.main": "cc_most",
  "q.onset": "Q_period",
  "q.pain": "Q_pain",
  "q.area": "Q_pain_area",
  "q.associated": "Q_accompanying",
  "q.past": "Q_past",
  "q.meds": "Q_medicine",
  "q.toDoctor": "Q_to_doctor",
  "q.recheck": "recheck",
  "card.chief": "chiefComplain",
  "card.associated": "associatedSx",
  "card.other": "otherInfo",
  "card.vital": "vitalSign",
  "card.temperature": "temperature",
  "card.past": "pastHx",
  "card.drug": "drugHx",
  "card.onset": "onset",
  "side.right": "right",
  "side.left": "left",
  "disclaimer.notDiagnosis": "itsnotdiagnosis",
  "disclaimer.severe": "emergency_comment",
  "disclaimer.otc": "OTC_warrant",
  "otc.definition": "OTC_definition",
  "otc.title": "OTC",
  "place.er": "emergency",
  "place.kmed": "korean_medicine",
  "place.publicHealth": "public_health_center",
  "place.night": "pharmacy_night_time",
  "place.allYear": "pharmacy_24_hours",
  "info.overview": "disease_overview",
  "info.treatment": "disease_treatment",
  "info.prevention": "disease_prevention",
  "info.relatedDept": "related_department",
  "info.title": "mini_encyclopedia",
  "med.camera": "camera",
  "med.album": "album",
  "med.searchHint": "medicine_search_hint",
};

const files = {
  "ko-KR": "ko_KR", "en-US": "en_US", "ru-RU": "ru_RU", "ja-JP": "ja_JP", "zh-CN": "zh_CN",
  "zh-TW": "zh_TW", "vi-VN": "vi_VN", "es-ES": "es_ES", "fr-FR": "fr_FR", "mn-MN": "mn_MN",
  "ne-NP": "ne_NP", "ar-SA": "ar_SA", "ur-PK": "ur_PK",
};

mkdirSync(out, { recursive: true });
for (const [locale, file] of Object.entries(files)) {
  const pack = JSON.parse(readFileSync(join(source, file + ".json"), "utf8"))[file];
  const result = {};
  const missing = [];
  for (const [key, from] of Object.entries(map)) {
    const value = pack[from]?.trim();
    if (value) result[key] = value;
    else missing.push(key);
  }
  writeFileSync(join(out, locale + ".json"), JSON.stringify(result, null, 1) + "\n");
  console.log(locale, Object.keys(result).length, "keys", missing.length ? "missing: " + missing.join(",") : "");
}
