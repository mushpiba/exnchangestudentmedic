// Intake text: questions, options, symptom names and intake UI labels, one catalog per language.
// Loaded on demand (the bank and catalogs are separate chunks). Missing strings fall back to English, then Korean.
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import type { Locale } from "../i18n/locales";
import { normalize } from "../lib/text";
import type { Bank } from "./engine";

type Dict = Record<string, string>;
type Names = Record<string, string[]>;

const textFiles = import.meta.glob<Dict>("./text/*.json", { import: "default" });
const nameFiles = import.meta.glob<Names>("./names/*.json", { import: "default" });

let bankPromise: Promise<Bank> | null = null;
export const loadBank = () => (bankPromise ??= import("./data/bank.json").then((m) => m.default as unknown as Bank));

const texts = new Map<string, Promise<Dict>>();
const names = new Map<string, Promise<Names>>();
const loadText = (l: string) => {
  if (!texts.has(l)) texts.set(l, textFiles[`./text/${l}.json`]?.() ?? Promise.resolve({}));
  return texts.get(l)!;
};
const loadNames = (l: string) => {
  if (!names.has(l)) names.set(l, nameFiles[`./names/${l}.json`]?.() ?? Promise.resolve({}));
  return names.get(l)!;
};

export type IntakeText = {
  bank: Bank;
  /** Text in the student's language. */
  it: (id: string, params?: Record<string, string | number>) => string;
  /** Text in Korean, for staff. */
  ik: (id: string, params?: Record<string, string | number>) => string;
  /** Symptom name in the student's language / in Korean. */
  sn: (sid: string) => string;
  sk: (sid: string) => string;
  /** Symptom search in the student's language, English and Korean (names and the data's search words). */
  search: (query: string) => string[];
};

const fill = (s: string, params?: Record<string, string | number>) =>
  params ? s.replace(/\{(\w+)\}/g, (all, k) => (k in params ? String(params[k]) : all)) : s;

export async function loadIntake(locale: Locale) {
  const [bank, ko, en, mine, koNames, enNames, myNames] = await Promise.all([
    loadBank(), loadText("ko-KR"), loadText("en-US"), loadText(locale), loadNames("ko-KR"), loadNames("en-US"), loadNames(locale),
  ]);
  return { bank, ko, en, mine, koNames, enNames, myNames };
}

type Loaded = Awaited<ReturnType<typeof loadIntake>>;

export function makeText(d: Loaded, locale: string): IntakeText {
  const it = (id: string, params?: Record<string, string | number>) => fill(d.mine[id] ?? d.en[id] ?? d.ko[id] ?? id, params);
  const ik = (id: string, params?: Record<string, string | number>) => fill(d.ko[id] ?? id, params);
  const sn = (sid: string) => d.myNames[sid]?.[0] ?? d.mine["s." + sid] ?? (locale === "ko-KR" ? d.ko["s." + sid] : d.enNames[sid]?.[0]) ?? d.ko["s." + sid] ?? sid;
  const sk = (sid: string) => d.ko["s." + sid] ?? sid;
  const words = Object.keys(d.bank.symptoms).map((sid) => ({
    sid,
    all: [...(d.myNames[sid] ?? []), d.mine["s." + sid] ?? "", ...(d.enNames[sid] ?? []), ...(d.koNames[sid] ?? []), d.ko["s." + sid] ?? ""]
      .filter(Boolean)
      .map(normalize),
  }));
  const search = (query: string) => {
    const q = normalize(query);
    if (!q) return [];
    const hit = (w: string[]) => w.findIndex((x) => x.includes(q));
    // Names that start with the query first, then any match.
    return words
      .map((w) => ({ sid: w.sid, at: hit(w.all), starts: w.all.some((x) => x.startsWith(q)) }))
      .filter((w) => w.at >= 0)
      .sort((a, b) => Number(b.starts) - Number(a.starts) || a.at - b.at)
      .map((w) => w.sid);
  };
  return { bank: d.bank, it, ik, sn, sk, search };
}

/** The intake text for the current language. `text` is null while loading; `failed` when the files could not load. */
export function useIntakeText(): { text: IntakeText | null; failed: boolean; retry: () => void } {
  const { locale } = useI18n();
  const [state, setState] = useState<{ locale: string; data: Loaded } | "failed" | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    loadIntake(locale)
      .then((data) => live && setState({ locale, data }))
      .catch(() => {
        // A failed chunk load is cached by the browser module system only on success; clear ours so a retry refetches.
        texts.clear();
        names.clear();
        bankPromise = null;
        if (live) setState("failed");
      });
    return () => {
      live = false;
    };
  }, [locale, attempt]);
  const text = useMemo(() => (state && state !== "failed" ? makeText(state.data, state.locale) : null), [state]);
  return { text, failed: state === "failed", retry: () => setAttempt((n) => n + 1) };
}
