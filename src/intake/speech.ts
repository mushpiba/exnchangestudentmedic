// What a spoken sentence can be turned into without sending it anywhere.
//
// Matching whole names against the sentence does not work: the names students actually use are phrases
// ("배가 아프다", "눈이 빨개짐") and nobody says them word for word -- they say "배가 너무 아프고". So a name
// is matched word by word instead. Both sides are cut into words, each word is reduced to its stem, and a
// name counts as said when enough of its stems are in the sentence. A name of one word must match a whole
// word of the sentence; a name of several needs at least two of its words, which is what keeps a single
// shared word like "허리" from dragging in every name that contains it.
//
// This is still matching, not understanding. It is wrong often enough that nothing starts from it: the
// screen after shows what it heard and the student corrects it. The sentence is kept as the student's own
// words either way, and a question that can raise a warning is never filled in from speech -- those are
// asked out loud, every time.
import { normalize } from "../lib/text";
import type { IntakeText } from "./text";
import { plan, settle, setMain, setOwnWords, sexOk, visibleOptions, type Answer, type Flow, type Sex } from "./engine";
import { isClinicOnly } from "./clinical";

/** Korean glues these onto the end of a noun; they carry no meaning for matching. */
const PARTICLES = ["이", "가", "은", "는", "을", "를", "도", "만", "에", "의", "와", "과", "로", "서", "랑"];

/** Words that appear inside symptom names but say nothing on their own. Body parts are not filler:
 *  dropping "등" from "등 통증" would leave "통증", and then every sentence with a pain word matches it. */
const FILLER = new Set(["것", "수", "및", "그", "좀"]);

/**
 * Korean conjugates where English would not, so the same symptom word arrives in several shapes and the
 * two-syllable stem below does not catch them all. These are the ones that actually occur in the symptom
 * names: pain, swelling, itching, aching, numbness, tightness, burning.
 */
const SAME: Record<string, string> = {
  아파: "아프", 아픔: "아프", 아픈: "아프", 아퍼: "아프", 아프: "아프",
  부어: "붓", 부음: "붓", 부었: "붓", 부은: "붓", 붓기: "붓",
  가려: "가렵", 가렴: "가렵", 가렵: "가렵", 간지: "가렵",
  쑤셔: "쑤시", 쑤심: "쑤시", 쑤시: "쑤시",
  저려: "저리", 저림: "저리", 저리: "저리",
  답답: "답답", 답한: "답답",
  쓰려: "쓰리", 쓰림: "쓰리", 쓰라: "쓰리", 쓰리: "쓰리",
};

/** One word reduced to what it is about: particle off, two syllables, then the shapes above folded in. */
function stem(word: string): string {
  let w = normalize(word);
  for (const p of PARTICLES) if (w.length > p.length + 1 && w.endsWith(p)) { w = w.slice(0, -p.length); break; }
  if (w.length > 2) w = w.slice(0, 2);
  if (w.length === 2) for (const p of PARTICLES) if (w.endsWith(p)) { w = w.slice(0, 1); break; }
  return SAME[w] ?? w;
}

const words = (text: string) =>
  text
    .split(/[\s/·,.;:!?()[\]{}"'‘’“”、。，]+/)
    .map((w) => w.trim())
    .filter(Boolean);

type Heard = { stems: Set<string>; order: string[]; full: string };
function listen(text: string): Heard {
  const order = words(text).map(stem).filter(Boolean);
  return { stems: new Set(order), order, full: normalize(text) };
}

/** How many of this name's words the sentence contains, and whether every one of them is there. */
function overlap(hay: Heard, name: string): { hits: number; all: boolean; at: number } {
  const parts = words(name).map(stem).filter((w) => w && !FILLER.has(w));
  if (!parts.length) return { hits: 0, all: false, at: -1 };
  let hits = 0;
  let at = Infinity;
  for (const p of parts) {
    // A name word matches a word of the sentence outright, or -- inside a longer name, where the other
    // words still have to match -- shares its opening with one. Two syllables at least: otherwise "시"
    // from "기침 시 피섞인 가래" answers to "시작됐어요" and the sentence names a symptom nobody said.
    const i = hay.order.findIndex(
      (w) => w === p || (parts.length > 1 && Math.min(w.length, p.length) >= 2 && (w.startsWith(p) || p.startsWith(w))),
    );
    if (i < 0) continue;
    hits++;
    at = Math.min(at, i);
  }
  const enough = parts.length === 1 ? hits === 1 : hits >= 2;
  return { hits: enough ? hits : 0, all: hits === parts.length, at: at === Infinity ? -1 : at };
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

type Score = { sid: string; hits: number; all: number; own: number; at: number; size: number };

function score(x: IntakeText, text: string, sex: Sex): Score[] {
  const hay = listen(text);
  if (!hay.order.length) return [];
  const ids = Object.keys(x.bank.symptoms);
  // "기침" is one symptom's own name and also a search word of "기침 시 피섞인 가래". A word that is some
  // symptom's name belongs to it: saying "cough" must not say "coughing blood".
  const owned = new Map(ids.map((sid) => [normalize(x.sn(sid)), sid]));
  const out: Score[] = [];
  for (const sid of ids) {
    if (!sexOk(sex, x.bank.symptoms[sid])) continue;
    let best: Score | null = null;
    for (const name of x.rawNames(sid)) {
      const claimed = owned.get(normalize(name));
      if (claimed && claimed !== sid) continue;
      const { hits, all, at } = overlap(hay, name);
      if (!hits) continue;
      const own = normalize(name) === normalize(x.sn(sid)) ? 1 : 0;
      const next: Score = { sid, hits, all: Number(all), own, at, size: normalize(x.sn(sid)).length };
      if (!best || next.hits > best.hits || (next.hits === best.hits && next.all > best.all)) best = next;
    }
    if (best) out.push(best);
  }
  // Said first wins: people lead with what they came about, and a longer match later in the sentence is
  // usually the second complaint. Then more of the name heard, the whole name, its own name, and finally
  // the plainer name -- which is what lands "배가 아프다" on 복통 rather than on 복부 팽만감.
  return out.sort((a, b) => a.at - b.at || b.hits - a.hits || b.all - a.all || b.own - a.own || a.size - b.size);
}

/** Symptom ids the sentence names, the one it describes most closely first. */
export const symptomsIn = (x: IntakeText, text: string, sex: Sex) => score(x, text, sex).map((s) => s.sid);

/** How many Korean time words map onto which of the onset question's answers. */
const UNIT: Record<string, (n: number) => string> = {
  시간: () => "hours",
  일: (n) => (n <= 1 ? "yesterday" : n <= 3 ? "days2to3" : n <= 10 ? "week" : "weeks2plus"),
  주: (n) => (n <= 1 ? "week" : "weeks2plus"),
  주일: (n) => (n <= 1 ? "week" : "weeks2plus"),
  개월: () => "monthPlus",
  달: () => "monthPlus",
  년: () => "monthPlus",
};
const WORD: Record<string, string> = { 오늘: "today", 아침: "today", 어제: "yesterday", 엊그제: "days2to3", 그저께: "days2to3", 일주일: "week", 한달: "monthPlus" };

/** The onset the sentence names: a number with a time word, a plain day word, or the question's own text. */
export function onsetIn(text: string, labels: Record<string, string>): string {
  const flat = normalize(text);
  const number = flat.match(/(\d+)\s*(시간|주일|개월|달|주|일|년)/);
  if (number) {
    const map = UNIT[number[2]];
    if (map) return map(Number(number[1]));
  }
  for (const [word, id] of Object.entries(WORD)) if (flat.includes(word)) return id;
  const hay = listen(text);
  let best = { id: "", hits: 0 };
  for (const [id, label] of Object.entries(labels)) {
    if (id === "unknown") continue;
    const { hits, all } = overlap(hay, label);
    if (all && hits > best.hits) best = { id, hits };
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
      return overlap(hay, x.it(o.x)).all;
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
  const ranked = score(x, text, sex);
  const found = ranked.map((s) => s.sid);
  const [main, ...rest] = found;
  let flow = main ? setMain(x.bank, main, sex, age) : setOwnWords(text.trim(), sex, age);
  if (main) {
    // Only names heard in full ride along, and only where that means something: either two of the name's
    // words were said, or the symptom's own name was. One shared word like "가려움" belongs to a dozen
    // names, and a guess here becomes a symptom on a card a doctor will read.
    const also = rest
      .filter((sid) => {
        const s = ranked.find((r) => r.sid === sid);
        return s?.all && (s.hits >= 2 || s.own);
      })
      .slice(0, 4);
    flow = settle(x.bank, { ...flow, manual: also, order: also });
  }
  const answers = answersIn(x, flow, text);
  const onset = onsetIn(text, onsetLabels);
  if (onset) answers.G_ONSET = { kind: "values", values: [onset] };
  return { flow: { ...flow, answers }, found, onset, filled: Object.keys(answers).length };
}
