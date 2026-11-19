// The symptom card lives only in this tab's memory: nothing is stored or sent.
import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { MessageKey } from "../i18n";
import { ingredientKey } from "../content/medicines";
import { sideKey, symptomKey, vasKey } from "../content/symptoms";
import { GENERAL, detailLabelKey, detailsFor, isDanger, optionKey } from "../content/details";
import { emptyFlow, type Flow } from "../intake/engine";

export type TakenMedicine = { id: string; name: string; ingredients: string[] };

export type Card = {
  main: string;
  mainText: string;
  area: string;
  side: string;
  onset: string;
  /** null: the student said pain does not apply. */
  pain: number | null | undefined;
  temp: string;
  assoc: string[];
  allergy: "" | "none" | "yes" | "unknown";
  allergyKinds: string[];
  allergyText: string;
  take: "" | "none" | "yes" | "unknown";
  takeText: string;
  takeItems: TakenMedicine[];
  past: string[];
  /** Family history (parents, siblings). */
  family: string[];
  preg: string;
  notes: string;
  /** Answers to the symptom detail questions: question id → chosen options. */
  details: Record<string, string[]>;
  /** Korean translations of the student's own words, keyed by the exact text (made on request). */
  translations: Record<string, string>;
  /** The conversational intake (src/intake). */
  flow: Flow;
  /** Card lines built from the intake answers: main symptom, associated symptoms, answers, history. */
  flowLines: Line[];
  /** Suggested departments for the main symptom. */
  depts: string[];
};

export const emptyCard = (): Card => ({
  main: "",
  mainText: "",
  area: "",
  side: "",
  onset: "",
  pain: undefined,
  temp: "",
  assoc: [],
  allergy: "",
  allergyKinds: [],
  allergyText: "",
  take: "",
  takeText: "",
  takeItems: [],
  past: [],
  family: [],
  preg: "",
  notes: "",
  details: {},
  translations: {},
  flow: emptyFlow(),
  flowLines: [],
  depts: [],
});

type ListField = "assoc" | "allergyKinds" | "past" | "family";
type Action =
  | { type: "set"; patch: Partial<Card> }
  | { type: "detail"; id: string; option: string; many: boolean }
  | { type: "toggle"; field: ListField; value: string }
  | { type: "addMed"; med: TakenMedicine }
  | { type: "removeMed"; id: string }
  | { type: "reset" };

export function reducer(card: Card, action: Action): Card {
  switch (action.type) {
    case "set":
      return { ...card, ...action.patch };
    case "toggle": {
      const list = card[action.field];
      let next = list.includes(action.value) ? list.filter((v) => v !== action.value) : [...list, action.value];
      // "none" and "unknown" exclude every other history answer.
      if ((action.field === "past" || action.field === "family") && next.includes(action.value))
        next = ["none", "unknown"].includes(action.value)
          ? [action.value]
          : next.filter((v) => v !== "none" && v !== "unknown");
      return { ...card, [action.field]: next };
    }
    case "detail": {
      const now = card.details[action.id] ?? [];
      const has = now.includes(action.option);
      const next = action.many ? (has ? now.filter((o) => o !== action.option) : [...now, action.option]) : has ? [] : [action.option];
      // "none" in a multi-choice question excludes the other answers.
      const clean = action.many && !has ? (action.option === "none" ? ["none"] : next.filter((o) => o !== "none")) : next;
      return { ...card, details: { ...card.details, [action.id]: clean } };
    }
    case "addMed":
      if (card.takeItems.some((m) => m.id === action.med.id)) return card;
      return { ...card, take: "yes", takeItems: [...card.takeItems, action.med] };
    case "removeMed":
      return { ...card, takeItems: card.takeItems.filter((m) => m.id !== action.id) };
    case "reset":
      return emptyCard();
  }
}

/**
 * A value on the card: a translated concept, the student's own words shown as written, an intake text id (`it`)
 * or a symptom id (`sym`). Intake texts and symptom names come from src/intake/text.
 */
export type Value =
  | { key: MessageKey; params?: Record<string, string | number> }
  | { text: string }
  | { it: string; params?: Record<string, string | number> }
  | { sym: string };
/**
 * `source`: Korean product names the ingredients came from (photographed medicine boxes).
 * `danger`: the student picked a possible emergency sign here. `note`: an answer NARU marks for staff attention.
 * `labelIt`: the label is an intake text (a question) instead of `label`; `about`: the symptom it was asked for.
 */
export type Line = {
  label: MessageKey;
  values: Value[];
  original?: boolean;
  source?: string;
  danger?: boolean;
  note?: boolean;
  labelIt?: string;
  about?: string;
};

const k = (key: string, params?: Record<string, string | number>): Value => ({ key: key as MessageKey, params });

export function cardLines(card: Card): Line[] {
  const lines: Line[] = [];
  // The conversational intake builds its own lines (main symptom, associated, onset, answers, history).
  const fromFlow = card.flowLines.length > 0;
  if (fromFlow) lines.push(...card.flowLines);
  if (card.main && !fromFlow) lines.push({ label: "card.chief", values: [k(symptomKey(card.main))] });
  if (card.mainText && !fromFlow) lines.push({ label: "card.chief", values: [{ text: card.mainText }], original: true });
  if (card.area || card.side)
    lines.push({
      label: "card.area",
      values: [...(card.area ? [k("area." + card.area)] : []), ...(card.side ? [k(sideKey(card.side))] : [])],
    });
  // Detail answers follow the order of the questions asked for this symptom.
  const general = GENERAL as string[];
  const detailLine = (id: string) => {
    const chosen = card.details[id] ?? [];
    if (chosen.length)
      lines.push({ label: detailLabelKey(id), values: chosen.map((o) => k(optionKey(id, o))), danger: chosen.some((o) => isDanger(id, o)) });
  };
  const asked = [...(fromFlow ? [] : detailsFor(card.main)), ...Object.keys(card.details)].filter((id) => !general.includes(id));
  [...new Set(asked)].forEach(detailLine);
  if (card.onset && !fromFlow) lines.push({ label: "card.onset", values: [k("onset." + card.onset)] });
  if (typeof card.pain === "number")
    lines.push({ label: "card.pain", values: [k("card.painValue", { n: card.pain }), k(vasKey(card.pain))] });
  if (card.temp) lines.push({ label: "card.temperature", values: [{ text: card.temp + " ℃" }] });
  if (card.assoc.length) lines.push({ label: "card.associated", values: card.assoc.map((s) => k(symptomKey(s))) });
  if (card.allergy === "yes") {
    if (card.allergyKinds.length)
      lines.push({ label: "card.allergy", values: card.allergyKinds.map((a) => k("allergy." + a)) });
    if (card.allergyText) lines.push({ label: "card.allergy", values: [{ text: card.allergyText }], original: true });
    if (!card.allergyKinds.length && !card.allergyText) lines.push({ label: "card.allergy", values: [k("allergy.yes")] });
  } else if (card.allergy) lines.push({ label: "card.allergy", values: [k("allergy." + card.allergy)] });
  if (card.take === "yes" || card.takeItems.length) {
    if (card.takeItems.length)
      lines.push({
        label: "card.meds",
        values: card.takeItems.flatMap((m) => m.ingredients.map((i) => k(ingredientKey(i)))),
        source: card.takeItems.map((m) => m.name).join(", "),
      });
    if (card.takeText) lines.push({ label: "card.meds", values: [{ text: card.takeText }], original: true });
    if (!card.takeItems.length && !card.takeText) lines.push({ label: "card.meds", values: [k("take.yes")] });
  } else if (card.take) lines.push({ label: "card.meds", values: [k("take." + card.take)] });
  if (card.past.length) lines.push({ label: "card.past", values: card.past.map((p) => k("past." + p)) });
  if (card.family.length) lines.push({ label: detailLabelKey("family"), values: card.family.map((f) => k(optionKey("family", f))) });
  general.forEach(detailLine);
  if (card.preg && card.preg !== "skip") lines.push({ label: "card.pregnancy", values: [k("preg." + card.preg)] });
  if (card.notes.trim()) lines.push({ label: "card.notes", values: [{ text: card.notes.trim() }], original: true });
  return lines;
}

type CardState = {
  card: Card;
  lines: Line[];
  set: (patch: Partial<Card>) => void;
  toggle: (field: ListField, value: string) => void;
  detail: (id: string, option: string, many: boolean) => void;
  addMed: (med: TakenMedicine) => void;
  removeMed: (id: string) => void;
  reset: () => void;
};

const Ctx = createContext<CardState | null>(null);

export function CardProvider({ children }: { children: ReactNode }) {
  const [card, dispatch] = useReducer(reducer, undefined, emptyCard);
  const value = useMemo<CardState>(
    () => ({
      card,
      lines: cardLines(card),
      set: (patch) => dispatch({ type: "set", patch }),
      toggle: (field, v) => dispatch({ type: "toggle", field, value: v }),
      detail: (id, option, many) => dispatch({ type: "detail", id, option, many }),
      addMed: (med) => dispatch({ type: "addMed", med }),
      removeMed: (id) => dispatch({ type: "removeMed", id }),
      reset: () => dispatch({ type: "reset" }),
    }),
    [card],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCard() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useCard outside CardProvider");
  return value;
}
