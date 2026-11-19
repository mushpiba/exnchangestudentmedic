// Build the intake bank from the Simtomi extract (data/simtomi) and NARU's rules (scripts/intake-rules.mjs).
//   node scripts/build-intake.mjs
// Writes src/intake/data/bank.json, src/intake/text/ko-KR.json (the translation source) and
// src/intake/names/<locale>.json (symptom names and search words from the data's own translations).
// Only questions reachable from a symptom's start list, its red flags and answer branches are kept, so the
// sampled disease questions never enter the flow (they are not complete rules).
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as R from "./intake-rules.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const symptoms = read("data/simtomi/symptoms.json");
const raw = read("data/simtomi/questions.json");
const history = read("data/simtomi/history.json");
const ui = read("scripts/intake-ui.ko.json");

const errors = [];
const fail = (msg) => errors.push(msg);
const fix = (s) => R.TEXT_FIXES.reduce((t, [re, to]) => t.replace(re, to), s).trim();

// ---- Korean text catalog: content strings get a hash id so identical wording is translated once.
const text = {};
const tid = (ko) => {
  const id = "x" + createHash("sha1").update(ko).digest("hex").slice(0, 8);
  if (text[id] && text[id] !== ko) fail(`text id collision ${id}`);
  text[id] = ko;
  return id;
};

const SYMPTOM = new Map(symptoms.map((s) => [s.id, s]));
const FEMALE_NF = new Set(["NF_LMP", "NF_LATE", "NF_ECTOPIC", "NF_HEAVY", "NF_DYSMEN", "NF_EC"]);
const MALE_NF = new Set(["NF_TORSION", "NF_TESTMASS", "NF_ED"]);
const sexOfQuestion = (id) => (id.startsWith("NF_") ? (FEMALE_NF.has(id) ? "F" : MALE_NF.has(id) ? "M" : undefined) : { F: "F", M: "M" }[id[3]]);
const sexOfSymptom = (id) => (id.startsWith("SGY") ? "F" : id.startsWith("SSX") ? "M" : undefined);

/** Normalised question: options carry kind add|opt|none|unknown|skip. */
function fromSimtomi(id) {
  const q = raw[id];
  return {
    t: q.t,
    q: fix(q.q),
    img: q.img,
    o: q.o.map((o) => {
      const n = fix(o.n);
      let k = o.k === "m" ? "add" : "opt";
      if (o.id === "NZZ000") k = "none";
      else if (o.id === "NZZ001" || /^잘\s*모르겠/.test(n)) k = "unknown";
      else if (/넘어가기$/.test(n)) k = "skip";
      return { n, k, add: o.k === "m" ? o.id : undefined, next: o.k === "m" ? [] : [...o.next], img: o.img, level: undefined };
    }),
  };
}

function fromRule(id, q) {
  return {
    t: q.t,
    q: q.q,
    img: null,
    o: q.o.map((o) => ({ n: o.n, k: o.none ? "none" : o.add ? "add" : "opt", add: o.add, next: o.next ?? [], img: null, level: o.level })),
  };
}

const questions = {};
for (const id of Object.keys(raw)) questions[id] = fromSimtomi(id);
for (const [id, q] of Object.entries(R.NEW_QUESTIONS)) {
  if (questions[id]) fail(`new question id clashes: ${id}`);
  questions[id] = fromRule(id, q);
}

// ---- Patches (option keys are texts after spelling fixes).
const findOption = (qid, q, name) => {
  const hits = q.o.filter((o) => o.n === name);
  if (hits.length !== 1) fail(`${qid}: option "${name}" matched ${hits.length}`);
  return hits[0];
};
for (const [qid, p] of Object.entries(R.PATCHES)) {
  const q = questions[qid];
  if (!q) { fail(`patch on missing question ${qid}`); continue; }
  if (p.q) q.q = p.q;
  if (p.t) q.t = p.t;
  for (const [name, change] of Object.entries(p.o ?? {})) {
    const o = findOption(qid, q, name);
    if (!o) continue;
    if (change.n) o.n = change.n;
    if (change.next) o.next = [...change.next];
    if (change.add) { o.k = "add"; o.add = change.add; o.next = []; }
    if (change.level) o.level = change.level;
    if (change.drop) o.drop = true;
  }
  for (const ins of p.insert ?? []) {
    const o = { n: ins.n, k: ins.none ? "none" : ins.add ? "add" : "opt", add: ins.add, next: ins.next ?? [], img: null, level: ins.level };
    if (ins.before) {
      const at = q.o.findIndex((x) => x.n === ins.before);
      if (at < 0) fail(`${qid}: insert before missing "${ins.before}"`);
      q.o.splice(at < 0 ? q.o.length : at, 0, o);
    } else q.o.push(o);
  }
  q.o = q.o.filter((o) => !o.drop);
  if (p.dedupe) q.o = q.o.filter((o, i) => q.o.findIndex((x) => x.n === o.n) === i);
}
for (const [qid, marks] of Object.entries(R.MARKS)) {
  const q = questions[qid];
  if (!q) { fail(`mark on missing question ${qid}`); continue; }
  for (const [name, level] of Object.entries(marks)) {
    const o = findOption(qid, q, name);
    if (o) o.level = level;
  }
}

// ---- Symptoms.
const start = (s) => R.SYMPTOM_PATCHES[s.id]?.start ?? s.start;
const catsOf = (s) => {
  const cats = s.cats.map((c) => R.CATEGORY_MAP[c]).filter(Boolean);
  if (!cats.length) cats.push(R.PREFIX_CATEGORY[s.id.slice(0, 3)] ?? "BZZ");
  if (R.COMMON.includes(s.id)) cats.unshift("BFR");
  return [...new Set(cats)];
};

// ---- Reachability from every symptom (start list, red flags, subBlock branches, added symptoms).
const reach = new Set();
const walk = (qids) => {
  const stack = [...qids];
  while (stack.length) {
    const id = stack.pop();
    if (reach.has(id)) continue;
    if (!questions[id]) { fail(`missing question ${id}`); continue; }
    reach.add(id);
    for (const o of questions[id].o) {
      for (const n of o.next) stack.push(n);
      if (o.k === "add" && !SYMPTOM.has(o.add)) fail(`${id}: adds unknown symptom ${o.add}`);
    }
  }
};
for (const s of symptoms) {
  if (!start(s).length) fail(`symptom ${s.id} has no start question`);
  walk([...start(s), ...(R.RED_FLAGS[s.id] ?? [])]);
}
for (const [sid, list] of Object.entries(R.RED_FLAGS)) {
  if (!SYMPTOM.has(sid)) fail(`red flags for unknown symptom ${sid}`);
  for (const q of list) if (!questions[q]) fail(`red flag ${q} missing`);
}
for (const id of Object.keys(R.NEW_QUESTIONS)) if (!reach.has(id)) fail(`new question never reached: ${id}`);
for (const [sid, list] of Object.entries(R.ASSOC_RULES)) for (const t of [sid, ...list]) if (!SYMPTOM.has(t)) fail(`assoc rule unknown ${t}`);
for (const t of [...R.COMMON, ...Object.values(R.NARU_TO_SIMTOMI).filter(Boolean)]) if (!SYMPTOM.has(t)) fail(`unknown symptom ${t}`);

// ---- Output.
const outQuestions = {};
for (const id of [...reach].sort()) {
  const q = questions[id];
  const sex = sexOfQuestion(id);
  outQuestions[id] = {
    t: q.t,
    q: tid(q.q),
    ...(q.img ? { img: q.img } : {}),
    ...(sex ? { sex } : {}),
    o: q.o.map((o) => ({
      x: tid(o.n),
      k: o.k,
      ...(o.add ? { add: o.add } : {}),
      ...(o.next.length ? { next: o.next } : {}),
      ...(o.level ? { level: o.level } : {}),
      ...(o.img ? { img: o.img } : {}),
    })),
  };
}

const hist = {};
const outHistory = {};
for (const [sid, h] of Object.entries(history)) {
  outHistory[sid] = {};
  for (const kind of ["past", "drug", "family"]) {
    outHistory[sid][kind] = h[kind].map((o) => {
      const key = kind[0] + ":" + o.id;
      const id = tid(fix(o.n));
      if (hist[key] && hist[key] !== id) fail(`history ${key} has two texts`);
      hist[key] = id;
      return key;
    });
  }
}

const outSymptoms = {};
for (const s of symptoms) {
  const sex = sexOfSymptom(s.id);
  outSymptoms[s.id] = {
    cats: catsOf(s),
    start: start(s),
    ...(R.RED_FLAGS[s.id] ? { flags: R.RED_FLAGS[s.id] } : {}),
    ...(sex ? { sex } : {}),
  };
}

// Symptom names: the data's own translations, plus NARU corrections. Korean names also go to the text catalog.
const names = {};
for (const s of symptoms) {
  for (const [locale, v] of Object.entries(s.names)) {
    const n = R.NAME_PATCHES[locale]?.[s.id] ?? (locale === "ko-KR" ? fix(v.n) : v.n);
    (names[locale] ??= {})[s.id] = [n, ...v.r.filter((r) => r !== n)];
  }
  text["s." + s.id] = fix(s.names["ko-KR"].n);
}
Object.assign(text, ui);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const bank = {
  symptoms: outSymptoms,
  questions: outQuestions,
  history: outHistory,
  hist,
  common: R.COMMON,
  assoc: R.ASSOC_RULES,
  naru: R.NARU_TO_SIMTOMI,
};
const write = (p, data) => {
  mkdirSync(dirname(join(root, p)), { recursive: true });
  writeFileSync(join(root, p), JSON.stringify(data, null, p.endsWith("bank.json") ? 0 : 1) + "\n");
};
write("src/intake/data/bank.json", bank);
write("src/intake/text/ko-KR.json", Object.fromEntries(Object.entries(text).sort(([a], [b]) => a.localeCompare(b))));
for (const [locale, list] of Object.entries(names)) write(`src/intake/names/${locale}.json`, list);

const levels = {};
for (const q of Object.values(outQuestions)) for (const o of q.o) if (o.level) levels[o.level] = (levels[o.level] ?? 0) + 1;
console.log(`symptoms ${symptoms.length}, questions kept ${reach.size} of ${Object.keys(questions).length}, texts ${Object.keys(text).length}`);
console.log("danger options", levels);
