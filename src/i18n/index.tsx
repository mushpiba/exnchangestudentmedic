import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import koOwn from "./messages/ko-KR.json";
import koSimtomi from "./simtomi/ko-KR.json";
import { isRtl, rememberLocale, type Locale } from "./locales";

export type MessageKey = keyof typeof koOwn | keyof typeof koSimtomi;
export type Dict = Record<string, string>;
export type Params = Record<string, string | number>;

// Korean is always loaded: the staff-facing card is rendered from it.
export const KO: Dict = { ...koSimtomi, ...koOwn };

const own = import.meta.glob<Dict>(["./messages/*.json", "!./messages/ko-KR.json"], {
  import: "default",
});
const simtomi = import.meta.glob<Dict>(["./simtomi/*.json", "!./simtomi/ko-KR.json"], {
  import: "default",
});

const cache = new Map<Locale, Dict>([["ko-KR", KO]]);

/** Locale strings layered over English, then Korean, so a missing key never renders blank. */
export async function loadMessages(locale: Locale): Promise<Dict> {
  const hit = cache.get(locale);
  if (hit) return hit;
  const [fallback, imported, written] = await Promise.all([
    locale === "en-US" ? KO : loadMessages("en-US"),
    simtomi[`./simtomi/${locale}.json`]?.() ?? {},
    own[`./messages/${locale}.json`]?.() ?? {},
  ]);
  const dict = { ...fallback, ...imported, ...written };
  cache.set(locale, dict);
  return dict;
}

export function format(text: string, params?: Params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (all, name) => (name in params ? String(params[name]) : all));
}

type I18n = {
  locale: Locale;
  rtl: boolean;
  /** Text in the student's language. */
  t: (key: MessageKey, params?: Params) => string;
  /** Text in Korean, for staff. */
  tk: (key: MessageKey, params?: Params) => string;
  /** Every spelling we know for a key: student language, Korean and English. Used by search. */
  variants: (key: MessageKey) => string[];
  setLocale: (locale: Locale) => Promise<void>;
};

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({
  initial,
  messages,
  children,
}: {
  initial: Locale;
  messages: Dict;
  children: ReactNode;
}) {
  const [state, setState] = useState({ locale: initial, dict: messages });
  const rtl = isRtl(state.locale);

  useEffect(() => {
    document.documentElement.lang = state.locale;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    rememberLocale(state.locale);
  }, [state.locale, rtl]);

  const setLocale = useCallback(async (locale: Locale) => {
    const dict = await loadMessages(locale);
    setState({ locale, dict });
  }, []);

  const value = useMemo<I18n>(() => {
    const en = cache.get("en-US") ?? {};
    return {
      locale: state.locale,
      rtl,
      t: (key, params) => format(state.dict[key] ?? KO[key] ?? key, params),
      tk: (key, params) => format(KO[key] ?? key, params),
      variants: (key) => [state.dict[key], KO[key], en[key]].filter(Boolean),
      setLocale,
    };
  }, [state, rtl, setLocale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useI18n outside I18nProvider");
  return value;
}
