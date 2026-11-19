// The whole intake sequence: the symptom questions from the engine, then NARU's general block
// (onset, history from the Simtomi data, allergies, medicines, pregnancy, lifestyle, notes).
// Also turns the answers into summary rows and the staff card's lines. Only real answers appear.
import type { MessageKey } from "../i18n";
import { CATEGORY_DEPTS, type Category } from "../content/symptoms";
import { detailLabelKey, optionKey } from "../content/details";
import type { Card, Line, Value } from "../state/card";
import { historyOptions, isYesItem, plan, type Bank, type Flow, type Level, type Step } from "./engine";

export const LIFE = ["travel", "sickContact", "smoking", "alcohol", "interpreter"] as const;
export const HISTORY_KINDS = ["past", "drug", "family"] as const;
export type HistoryKind = (typeof HISTORY_KINDS)[number];
export const historyStep = (kind: HistoryKind) => "G_" + kind.toUpperCase();

/** History list for the chosen symptoms; a symptom written in the student's own words uses a general list. */
export function historyFor(bank: Bank, flow: Flow, kind: HistoryKind): string[] {
  if (flow.main) return historyOptions(bank, flow, kind);
  return bank.history.SWH002?.[kind] ?? [];
}

export function generalSteps(bank: Bank, flow: Flow): string[] {
  if (!flow.main && !flow.mainText) return [];
  const out = ["G_ONSET"];
  for (const kind of HISTORY_KINDS) if (historyFor(bank, flow, kind).length) out.push(historyStep(kind));
  out.push("G_ALLERGY", "G_MEDS");
  if (flow.sex !== "M") out.push("G_PREG");
  for (const id of LIFE) out.push("G_LIFE_" + id);
  out.push("G_NOTES");
  return out;
}

export function sequence(bank: Bank, flow: Flow): Step[] {
  return [...plan(bank, flow).steps, ...generalSteps(bank, flow).map((key) => ({ key, qid: key, owner: "" }))];
}

/** The step on screen: the one being revisited, else the first unanswered. null = everything answered. */
export function currentStep(bank: Bank, flow: Flow): Step | null {
  const seq = sequence(bank, flow);
  if (flow.cursor) {
    const s = seq.find((x) => x.key === flow.cursor);
    if (s) return s;
  }
  return seq.find((s) => !flow.answers[s.key]) ?? null;
}

/** The answered step before `key` (or before the first unanswered step). */
export function previousStep(bank: Bank, flow: Flow, key: string | null): Step | null {
  const seq = sequence(bank, flow);
  const at = key ? seq.findIndex((s) => s.key === key) : seq.findIndex((s) => !flow.answers[s.key]);
  for (let i = (at < 0 ? seq.length : at) - 1; i >= 0; i--) if (flow.answers[seq[i].key]) return seq[i];
  return null;
}

export const answeredSteps = (bank: Bank, flow: Flow) => sequence(bank, flow).filter((s) => flow.answers[s.key]).length;

const SHOWN: Level[] = ["emergency", "crisis", "assault", "urgent"];
const k = (key: string, params?: Record<string, string | number>): Value => ({ key: key as MessageKey, params });

/** A summary row: a card line that knows which step to reopen. */
export type Row = Line & { key: string; owner: string; level?: Level };

/** One row per answered symptom question (skips and "associated symptom" lists are left out). */
export function answerRows(bank: Bank, flow: Flow): Row[] {
  const rows: Row[] = [];
  for (const step of plan(bank, flow).steps) {
    const a = flow.answers[step.key];
    const q = bank.questions[step.qid];
    if (!a || a.kind === "skip" || q.t === "F") continue;
    let values: Value[] = [];
    let levels: Level[] = [];
    if (a.kind === "pick") {
      const picked = a.options.map((i) => q.o[i]).filter(Boolean);
      values = picked.map((o) => ({ it: o.x }));
      levels = picked.map((o) => o.level).filter((l): l is Level => !!l);
      if (isYesItem(q)) values = [{ it: "ui.yes" }, ...values];
    } else if (a.kind === "no") {
      const none = q.o.find((o) => o.k === "none");
      values = [{ it: none && !isYesItem(q) ? none.x : "ui.ansNo" }];
    } else if (a.kind === "unknown") values = [{ it: "ui.ansUnknown" }];
    if (!values.length) continue;
    const level = SHOWN.find((l) => levels.includes(l)) ?? (levels.includes("note") ? "note" : undefined);
    rows.push({
      key: step.key,
      owner: step.owner,
      label: "card.chief",
      labelIt: q.q,
      about: step.owner !== flow.main ? step.owner : undefined,
      values,
      danger: !!level && level !== "note",
      note: level === "note",
      level,
    });
  }
  // Warning signs first, then items marked for staff, then the rest in the order asked.
  const rank = (r: Row) => (r.danger ? 0 : r.note ? 1 : 2);
  return rows.map((r, i) => ({ r, i })).sort((a, b) => rank(a.r) - rank(b.r) || a.i - b.i).map(({ r }) => r);
}

/** History rows (past illness, medicines, family). */
export function historyRows(bank: Bank, flow: Flow): Row[] {
  const label = { past: "ui.card.past", drug: "ui.card.drug", family: "ui.card.family" } as const;
  const rows: Row[] = [];
  for (const kind of HISTORY_KINDS) {
    const key = historyStep(kind);
    const a = flow.answers[key];
    if (!a || a.kind === "skip") continue;
    const values: Value[] =
      a.kind === "values" ? a.values.map((v) => ({ it: bank.hist[v] })) : a.kind === "unknown" ? [k("common.unknown")] : [k("common.none")];
    if (values.length) rows.push({ key, owner: "", label: "card.past", labelIt: label[kind], values });
  }
  return rows;
}

/** Card lines for the staff card: chief complaint, associated symptoms, onset, answers, history. */
export function flowLines(bank: Bank, flow: Flow, card: Card): Line[] {
  const lines: Line[] = [];
  // Age first: it is the one thing a clinician reads before the complaint itself.
  if (flow.age) lines.push({ label: "card.age", values: [k("card.ageValue", { n: flow.age })] });
  if (flow.main) lines.push({ label: "card.chief", values: [{ sym: flow.main }] });
  else if (flow.mainText) lines.push({ label: "card.chief", values: [{ text: flow.mainText }], original: true });
  const assoc = plan(bank, flow).associated;
  if (assoc.length) lines.push({ label: "card.associated", values: assoc.map((sym) => ({ sym })) });
  if (card.onset) lines.push({ label: "card.onset", values: [k("onset." + card.onset)] });
  lines.push(...answerRows(bank, flow), ...historyRows(bank, flow));
  return lines;
}

/** Departments to suggest, from the main symptom's categories (same table NARU already uses). */
export function departments(bank: Bank, flow: Flow): string[] {
  const cats = (bank.symptoms[flow.main]?.cats ?? []).filter((c) => c !== "BFR" && c in CATEGORY_DEPTS) as Category[];
  return [...new Set(cats.flatMap((c) => CATEGORY_DEPTS[c]))].slice(0, 3);
}

/** NARU's older symptom id for the main symptom (info pages and department hints use it). */
export function naruId(bank: Bank, sid: string): string {
  return Object.entries(bank.naru).find(([, v]) => v === sid)?.[0] ?? "";
}

/** Lines for the NARU lifestyle questions (already translated as dt.* keys). */
export function lifeLabel(id: string) {
  return detailLabelKey(id);
}
export { optionKey };
