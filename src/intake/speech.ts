// What a spoken sentence can be turned into without sending it anywhere.
//
// This is text matching, not understanding: a symptom counts as said when one of its names appears in the
// sentence, and a question counts as answered when one of its options does. That is enough for the part
// students find hardest -- finding their symptom among 261 and remembering what came with it -- and it is
// deliberately not enough to be trusted on its own. So nothing here starts the intake by itself: the
// screen shows what it heard and the student corrects it. The sentence is also kept as the student's own
// words, and a question that can raise a warning is never filled in from speech. Those are asked, always.
import { normalize } from "../lib/text";
import type { IntakeText } from "./text";
import { plan, settle, setMain, setOwnWords, sexOk, visibleOptions, type Answer, type Flow, type Sex } from "./engine";
import { isClinicOnly } from "./clinical";

/** Korean glues a particle onto the word. A one-syllable name is only taken when a token is exactly it. */
const PARTICLES = ["", "이", "가", "은", "는", "을", "를", "도", "만", "에", "의", "와", "과", "로", "으로", "부터", "에서", "이나", "랑", "이랑", "하고"];

type Heard = { full: string; tokens: string[] };
const listen = (text: string): Heard => ({
  full: normalize(text),
  tokens: text.split(/\s+/).map(normalize).filter(Boolean),
});

/** The word a token is built on: "무릎이" is about 무릎, "열이" about 열. */
function stem(token: string): string {
  for (const p of PARTICLES) if (p && token.length > p.length && token.endsWith(p)) return token.slice(0, -p.length);
  return token;
}

type Hit = { text: string; whole: boolean };
const NOTHING: Hit = { text: "", whole: false };

/** The piece of the sentence this name accounts for, and whether the whole name was in there. */
function said(hay: Heard, name: string): Hit {
  const n = normalize(name);
  if (!n) return NOTHING;
  // Two syllables or more may sit anywhere in the sentence; one syllable only as a word of its own,
  // so that "열이 나요" finds fever while "열심히" does not.
  if (n.length >= 2 && hay.full.includes(n)) return { text: n, whole: true };
  for (const token of hay.tokens) {
    if (token.startsWith(n) && PARTICLES.includes(token.slice(n.length))) return { text: n, whole: true };
  }
  // "무릎이" is not inside "무릎 통증", but it is what that name is about. Only a hint, though: one body
  // part prefixes every name that starts with it, so these never add a symptom of their own accord.
  for (const token of hay.tokens) {
    const base = stem(token);
    if (base.length >= 2 && n.startsWith(base)) return { text: base, whole: false };
  }
  return NOTHING;
}

export type Speech = {
  flow: Flow;
  /** Symptoms found in the sentence, the first of them the main one. */
  found: string[];
  /** Onset id the sentence named ("yesterday"), or "" when it named none. */
  onset: string;
  /** How many questions the sentence answered by itself, the onset included. */
  filled: number;
};

/** Symptom ids the sentence names, the one it describes most closely first. */
export function symptomsIn(x: IntakeText, text: string, sex: Sex): string[] {
  const hay = listen(text);
  if (!hay.full) return [];
  const ids = Object.keys(x.bank.symptoms);
  // "기침" is the name of one symptom and also a search word of "기침 시 피섞인 가래" and of "재채기".
  // A word that is some symptom's own name belongs to that symptom: saying it must not drag in the
  // others, because a student who said "cough" has not said they are coughing blood.
  const owned = new Map(ids.map((sid) => [normalize(x.sn(sid)), sid]));
  const hits: { sid: string; whole: number; len: number; at: number; own: number; size: number }[] = [];
  for (const sid of ids) {
    if (!sexOk(sex, x.bank.symptoms[sid])) continue;
    const mine = normalize(x.sn(sid));
    let best = NOTHING;
    for (const name of x.names(sid)) {
      const hit = said(hay, name);
      if (!hit.text) continue;
      const claimed = owned.get(hit.text);
      if (claimed && claimed !== sid) continue;
      const better = Number(hit.whole) - Number(best.whole) || hit.text.length - best.text.length;
      if (better > 0) best = hit;
    }
    if (!best.text) continue;
    // A name heard whole beats one only hinted at; then said first, then the symptom actually called that.
    hits.push({
      sid, whole: Number(best.whole), len: best.text.length,
      at: hay.full.indexOf(best.text), own: best.text === mine ? 1 : 0, size: mine.length,
    });
  }
  return hits
    .sort((a, b) => b.whole - a.whole || b.len - a.len || a.at - b.at || b.own - a.own || a.size - b.size)
    .map((h) => h.sid);
}

/** Symptoms whose name was heard whole. Only these join the complaint by themselves. */
function heardWhole(x: IntakeText, text: string, sex: Sex): Set<string> {
  const hay = listen(text);
  const owned = new Map(Object.keys(x.bank.symptoms).map((sid) => [normalize(x.sn(sid)), sid]));
  const out = new Set<string>();
  for (const sid of Object.keys(x.bank.symptoms)) {
    if (!sexOk(sex, x.bank.symptoms[sid])) continue;
    for (const name of x.names(sid)) {
      const hit = said(hay, name);
      if (!hit.whole) continue;
      const claimed = owned.get(hit.text);
      if (claimed && claimed !== sid) continue;
      out.add(sid);
      break;
    }
  }
  return out;
}

/** The onset the sentence names, matched against the words the onset question itself offers. */
export function onsetIn(text: string, labels: Record<string, string>): string {
  const hay = listen(text);
  let best = { id: "", len: 0 };
  for (const [id, label] of Object.entries(labels)) {
    if (id === "unknown") continue;
    const hit = said(hay, label);
    const len = hit.whole ? hit.text.length : 0;
    if (len > best.len) best = { id, len };
  }
  return best.id;
}

/** Answers the sentence gives by itself, for the questions this flow is about to ask. */
function answersIn(x: IntakeText, flow: Flow, text: string): Record<string, Answer> {
  const hay = listen(text);
  const out: Record<string, Answer> = {};
  for (const step of plan(x.bank, flow).steps) {
    if (isClinicOnly(step.qid)) continue;
    const q = x.bank.questions[step.qid];
    // A question that can raise a warning is asked, never assumed.
    if (q.o.some((o) => o.level)) continue;
    const picked = visibleOptions(x.bank, flow, step.qid, step.owner).filter((i) => {
      const o = q.o[i];
      if (o.k === "none" || o.k === "unknown" || o.k === "skip") return false;
      const hit = said(hay, x.it(o.x));
      return hit.whole && hit.text.length >= 2;
    });
    if (!picked.length) continue;
    // One answer means one option: two matches in a single-choice question is a coin toss, so ask it.
    if (q.t !== "MM" && picked.length > 1) continue;
    out[step.key] = { kind: "pick", options: picked };
  }
  return out;
}

/** Build the flow a spoken sentence describes. With no symptom in it, the sentence becomes the complaint. */
export function hear(x: IntakeText, text: string, sex: Sex, age: string, onsetLabels: Record<string, string>): Speech {
  const found = symptomsIn(x, text, sex);
  const [main, ...rest] = found;
  let flow = main ? setMain(x.bank, main, sex, age) : setOwnWords(text.trim(), sex, age);
  if (main) {
    // Only symptoms named outright ride along. A word like "가슴" is the start of a dozen names and would
    // otherwise drag them all in, turning one sentence into fifty questions.
    const whole = heardWhole(x, text, sex);
    const also = rest.filter((sid) => whole.has(sid)).slice(0, 4);
    flow = settle(x.bank, { ...flow, manual: also, order: also });
  }
  const answers = answersIn(x, flow, text);
  const onset = onsetIn(text, onsetLabels);
  if (onset) answers.G_ONSET = { kind: "values", values: [onset] };
  return { flow: { ...flow, answers }, found, onset, filled: Object.keys(answers).length };
}
