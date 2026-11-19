// The conversational intake as pure functions over the bank (src/intake/data/bank.json).
//
// The question sequence is never stored: it is derived from the answers every time. Each answered option
// contributes its follow-up questions (`next`), and "add symptom" options contribute that symptom's own
// questions. So when an answer changes, questions that only followed the old answer disappear from the
// sequence, and `settle` removes their stored answers too.

export type Level = "emergency" | "crisis" | "assault" | "urgent" | "note";
export type OptionKind = "add" | "opt" | "none" | "unknown" | "skip";
export type Sex = "F" | "M" | "";

export type BankOption = { x: string; k: OptionKind; add?: string; next?: string[]; level?: Level; img?: string };
export type BankQuestion = { t: string; q: string; img?: string; sex?: "F" | "M"; o: BankOption[] };
export type BankSymptom = { cats: string[]; start: string[]; flags?: string[]; sex?: "F" | "M" };
export type Bank = {
  symptoms: Record<string, BankSymptom>;
  questions: Record<string, BankQuestion>;
  history: Record<string, { past: string[]; drug: string[]; family: string[] }>;
  hist: Record<string, string>;
  common: string[];
  assoc: Record<string, string[]>;
  naru: Record<string, string | null>;
};

/**
 * An answer. `pick` holds option indices of the question. `no` is an explicit no (a yes-item answered no, or
 * "none of these"). `unknown` and `skip` are kept apart from `no`.
 */
export type Answer =
  | { kind: "pick"; options: number[] }
  /** History lists: option keys, since the list itself changes with the chosen symptoms. */
  | { kind: "values"; values: string[] }
  | { kind: "no" }
  | { kind: "unknown" }
  | { kind: "skip" };

export type Flow = {
  /** Main symptom (Simtomi id), or "" with `mainText` when the student wrote their own words. */
  main: string;
  mainText: string;
  sex: Sex;
  /** Associated symptoms added by hand, in the order added. */
  manual: string[];
  /** Order in which associated symptoms joined (by hand or through an answer). */
  order: string[];
  answers: Record<string, Answer>;
  /** Step being revisited; null means "the first unanswered step". */
  cursor: string | null;
};

export const emptyFlow = (): Flow => ({ main: "", mainText: "", sex: "", manual: [], order: [], answers: {}, cursor: null });

/** A question in the sequence. `owner` is the symptom it was asked for. */
export type Step = { key: string; qid: string; owner: string };

const PER_SYMPTOM = /^(S|BODY_)/; // pain scale and body maps are asked again for each symptom

export const stepKey = (q: BankQuestion, qid: string, owner: string) => (PER_SYMPTOM.test(q.t) ? owner + "|" + qid : qid);

export const sexOk = (sex: Sex, item?: { sex?: "F" | "M" }) => !sex || !item?.sex || item.sex === sex;

/** Visible options: "not sure"/"skip" options become the standard buttons; links to excluded symptoms hide. */
export function visibleOptions(bank: Bank, flow: Flow, qid: string, owner: string): number[] {
  const q = bank.questions[qid];
  const seen = new Set<string>();
  const out: number[] = [];
  q.o.forEach((o, i) => {
    if (o.k === "unknown" || o.k === "skip") return;
    if (o.k === "add") {
      const s = bank.symptoms[o.add!];
      if (!s || o.add === owner || o.add === flow.main || !sexOk(flow.sex, s)) return;
    }
    if (seen.has(o.x)) return; // same wording twice (e.g. a male and a female symptom with one name)
    seen.add(o.x);
    out.push(i);
  });
  return out;
}

/** Symptoms the answers add, in answer order. */
function addsOf(bank: Bank, flow: Flow, step: Step): string[] {
  const a = flow.answers[step.key];
  if (a?.kind !== "pick") return [];
  const q = bank.questions[step.qid];
  return a.options.map((i) => q.o[i]).filter((o) => o?.k === "add" && o.add !== flow.main && sexOk(flow.sex, bank.symptoms[o.add!])).map((o) => o.add!);
}

/** First start question, then the red flags, then the rest of the start list. */
export function entryQuestions(bank: Bank, sid: string): string[] {
  const s = bank.symptoms[sid];
  if (!s) return [];
  return [...s.start.slice(0, 1), ...(s.flags ?? []), ...s.start.slice(1)];
}

/**
 * The sequence for the current answers: the main symptom's questions, then each associated symptom's.
 * Follow-ups come right after the question that opened them.
 */
export function plan(bank: Bank, flow: Flow): { steps: Step[]; associated: string[] } {
  const steps: Step[] = [];
  const seen = new Set<string>();
  const associated: string[] = [];
  const owners: string[] = [];
  const join = (sid: string) => {
    if (!sid || sid === flow.main || associated.includes(sid) || !bank.symptoms[sid] || !sexOk(flow.sex, bank.symptoms[sid])) return;
    associated.push(sid);
  };

  const visit = (qids: string[], owner: string) => {
    for (const qid of qids) {
      const q = bank.questions[qid];
      if (!q || !sexOk(flow.sex, q)) continue;
      const key = stepKey(q, qid, owner);
      if (seen.has(key)) continue;
      seen.add(key);
      const step = { key, qid, owner };
      steps.push(step);
      const a = flow.answers[key];
      if (a?.kind === "pick") {
        for (const i of [...a.options].sort((x, y) => x - y)) {
          const o = q.o[i];
          if (o?.next) visit(o.next, owner);
        }
        addsOf(bank, flow, step).forEach(join);
      }
    }
  };

  if (flow.main) {
    owners.push(flow.main);
    // Symptoms that joined earlier keep their place, so the sequence stays stable while answering.
    const rank = (sid: string) => {
      const i = flow.order.indexOf(sid);
      return i < 0 ? flow.order.length + associated.indexOf(sid) : i;
    };
    for (let i = 0; i < owners.length; i++) {
      visit(entryQuestions(bank, owners[i]), owners[i]);
      if (i === 0) flow.manual.forEach(join);
      const pending = associated.filter((s) => !owners.includes(s)).sort((a, b) => rank(a) - rank(b));
      owners.push(...pending);
    }
  }
  // Report associated symptoms in the order they are asked.
  return { steps, associated: owners.slice(1) };
}

/** Drop answers no longer reachable and keep `order` in sync. Repeats until nothing changes. */
export function settle(bank: Bank, flow: Flow): Flow {
  let current = flow;
  for (let round = 0; round < 20; round++) {
    const { steps, associated } = plan(bank, current);
    const keys = new Set(steps.map((s) => s.key));
    const answers = Object.fromEntries(Object.entries(current.answers).filter(([k]) => keys.has(k) || k.startsWith("G_")));
    const order = [...current.order.filter((s) => associated.includes(s)), ...associated.filter((s) => !current.order.includes(s))];
    const cursor = current.cursor && (keys.has(current.cursor) || current.cursor.startsWith("G_")) ? current.cursor : null;
    const same = Object.keys(answers).length === Object.keys(current.answers).length && order.join() === current.order.join() && cursor === current.cursor;
    current = { ...current, answers, order, cursor };
    if (same) return current;
  }
  return current;
}

// ---- Transitions (all return a settled flow).

export function setMain(bank: Bank, sid: string, sex: Sex): Flow {
  return settle(bank, { ...emptyFlow(), main: sid, sex });
}

export function setOwnWords(text: string, sex: Sex): Flow {
  return { ...emptyFlow(), mainText: text, sex };
}

export function setSex(bank: Bank, flow: Flow, sex: Sex): Flow {
  return settle(bank, { ...flow, sex });
}

export function answer(bank: Bank, flow: Flow, key: string, value: Answer): Flow {
  return settle(bank, { ...flow, answers: { ...flow.answers, [key]: value }, cursor: null });
}

/** Add or remove an associated symptom. Removing also clears the answers that brought it in. */
export function toggleSymptom(bank: Bank, flow: Flow, sid: string): Flow {
  const { steps, associated } = plan(bank, flow);
  if (!associated.includes(sid)) {
    return settle(bank, { ...flow, manual: [...flow.manual, sid], order: [...flow.order, sid] });
  }
  const answers = { ...flow.answers };
  for (const step of steps) {
    const a = answers[step.key];
    if (a?.kind !== "pick") continue;
    const q = bank.questions[step.qid];
    const kept = a.options.filter((i) => !(q.o[i]?.k === "add" && q.o[i].add === sid));
    if (kept.length !== a.options.length) answers[step.key] = kept.length ? { kind: "pick", options: kept } : { kind: "no" };
  }
  return settle(bank, { ...flow, answers, manual: flow.manual.filter((s) => s !== sid), order: flow.order.filter((s) => s !== sid) });
}

export const edit = (flow: Flow, key: string | null): Flow => ({ ...flow, cursor: key });

/** The step to show: the one being revisited, else the first unanswered. null when every question is answered. */
export function current(bank: Bank, flow: Flow): Step | null {
  const { steps } = plan(bank, flow);
  if (flow.cursor) {
    const s = steps.find((x) => x.key === flow.cursor);
    if (s) return s;
  }
  return steps.find((s) => !flow.answers[s.key]) ?? null;
}

/** Answered questions only: progress never shows a total, because the sequence grows with the answers. */
export function answeredCount(bank: Bank, flow: Flow): number {
  return plan(bank, flow).steps.filter((s) => flow.answers[s.key]).length;
}

/** The answered step before `key` (for "previous question"). */
export function previous(bank: Bank, flow: Flow, key: string | null): Step | null {
  const { steps } = plan(bank, flow);
  const at = key ? steps.findIndex((s) => s.key === key) : steps.findIndex((s) => !flow.answers[s.key]);
  const end = at < 0 ? steps.length : at;
  for (let i = end - 1; i >= 0; i--) if (flow.answers[steps[i].key]) return steps[i];
  return null;
}

/** Danger levels picked so far, strongest first, with the options that raised them. */
const LEVEL_ORDER: Level[] = ["emergency", "crisis", "assault", "urgent", "note"];
export function alerts(bank: Bank, flow: Flow): { level: Level; key: string; option: number }[] {
  const out: { level: Level; key: string; option: number }[] = [];
  for (const step of plan(bank, flow).steps) {
    const a = flow.answers[step.key];
    if (a?.kind !== "pick") continue;
    const q = bank.questions[step.qid];
    for (const i of a.options) {
      const level = q.o[i]?.level;
      if (level) out.push({ level, key: step.key, option: i });
    }
  }
  return out.sort((x, y) => LEVEL_ORDER.indexOf(x.level) - LEVEL_ORDER.indexOf(y.level));
}

/** Questions answered with a yes-item are true/false; others are a choice. */
export const isYesItem = (q: BankQuestion) => q.t === "B" && q.o.filter((o) => o.k !== "unknown" && o.k !== "skip").length === 1;
export const isMulti = (q: BankQuestion) => q.t === "MM" || q.t === "F" || q.t.startsWith("BODY_");

/** History options for the chosen symptoms, deduplicated, in symptom order. */
export function historyOptions(bank: Bank, flow: Flow, kind: "past" | "drug" | "family"): string[] {
  const { associated } = plan(bank, flow);
  const list = [flow.main, ...associated].flatMap((s) => bank.history[s]?.[kind] ?? []);
  const texts = new Set<string>();
  return list.filter((key) => {
    const x = bank.hist[key];
    if (!x || texts.has(x)) return false;
    texts.add(x);
    return true;
  });
}

/** Symptoms suggested as "often together": the main symptom's own associated-symptom links, then NARU's rules. */
export function suggestions(bank: Bank, flow: Flow): string[] {
  if (!flow.main) return [];
  const fromData: string[] = [];
  const stack = [...entryQuestions(bank, flow.main)];
  const seen = new Set<string>();
  while (stack.length) {
    const qid = stack.shift()!;
    if (seen.has(qid)) continue;
    seen.add(qid);
    const q = bank.questions[qid];
    if (!q) continue;
    for (const o of q.o) {
      if (o.k === "add" && o.add) fromData.push(o.add);
      else if (o.next) stack.push(...o.next);
    }
  }
  return [...new Set([...fromData, ...(bank.assoc[flow.main] ?? [])])].filter(
    (s) => s !== flow.main && bank.symptoms[s] && sexOk(flow.sex, bank.symptoms[s]),
  );
}
