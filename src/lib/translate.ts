// Translate the student's own words into Korean for staff, on the device only.
// Uses the browser's built-in Translator (Chrome/Edge desktop today); where it is missing, callers show the original.
// Nothing is sent to a server: these are health notes.
import { useEffect, useState } from "react";

type Translator = { translate(text: string): Promise<string> };
type TranslatorApi = {
  availability(o: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
  create(o: { sourceLanguage: string; targetLanguage: string }): Promise<Translator>;
};

/** BCP 47 language the built-in translator expects. */
export function sourceLanguage(locale: string) {
  if (locale === "zh-TW") return "zh-Hant";
  return locale.split("-")[0];
}

const translators = new Map<string, Promise<Translator | null>>();
const results = new Map<string, Promise<string | null>>();

function translator(from: string): Promise<Translator | null> {
  const api = (globalThis as { Translator?: TranslatorApi }).Translator;
  if (!api) return Promise.resolve(null);
  if (!translators.has(from)) {
    const options = { sourceLanguage: from, targetLanguage: "ko" };
    translators.set(
      from,
      api
        .availability(options)
        .then((state) => (state === "unavailable" ? null : api.create(options)))
        .catch(() => null),
    );
  }
  return translators.get(from)!;
}

export function translateToKorean(text: string, locale: string): Promise<string | null> {
  const from = sourceLanguage(locale);
  if (from === "ko" || !text.trim()) return Promise.resolve(null);
  const key = from + "\u0000" + text;
  if (!results.has(key)) {
    results.set(
      key,
      translator(from).then((t) => (t ? t.translate(text) : null)).catch(() => null),
    );
  }
  return results.get(key)!;
}

// ─── TEMPORARY translation server ─────────────────────────────────────────────────────────────
// Used only when the student taps "Translate into Korean" after reading the notice.
// Default: MyMemory's free API (no key, CORS open, about 5,000 characters a day per IP). It keeps what it
// translates in its translation memory, so the notice says the text may be stored.
// To replace it, set VITE_TRANSLATE_URL to our own proxy (POST {text, from, to} → {text}), e.g. a Supabase
// Edge Function calling Papago or DeepL. The app shows the server name next to the button. See README.
export const TRANSLATION_SERVER = {
  name: (import.meta.env.VITE_TRANSLATE_URL ? "NARU" : "MyMemory") as string,
  temporary: !import.meta.env.VITE_TRANSLATE_URL,
};

/** Language code the server expects. */
function serverLanguage(locale: string) {
  if (locale === "zh-CN" || locale === "zh-TW") return locale;
  return locale.split("-")[0];
}

/** Translate the student's words to Korean through the translation server. Throws when it can't. */
export async function translateOnServer(text: string, locale: string): Promise<string> {
  const from = serverLanguage(locale);
  const own = import.meta.env.VITE_TRANSLATE_URL as string | undefined;
  if (own) {
    const res = await fetch(own, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, from, to: "ko" }) });
    if (!res.ok) throw new Error("translate " + res.status);
    return ((await res.json()) as { text: string }).text;
  }
  // MyMemory takes up to 500 characters per request: send sentence-sized pieces in order.
  const parts: string[] = [];
  for (const sentence of text.match(/[^.!?。！？\n]+[.!?。！？\n]*/g) ?? [text]) {
    const last = parts.length - 1;
    if (last >= 0 && (parts[last] + sentence).length <= 450) parts[last] += sentence;
    else for (let i = 0; i < sentence.length; i += 450) parts.push(sentence.slice(i, i + 450));
  }
  const out: string[] = [];
  for (const part of parts) {
    const url = "https://api.mymemory.translated.net/get?" + new URLSearchParams({ q: part.trim(), langpair: from + "|ko" });
    const res = await fetch(url, { referrerPolicy: "no-referrer" });
    const body = (await res.json()) as { responseStatus: number | string; responseData?: { translatedText?: string } };
    const piece = body.responseData?.translatedText?.trim();
    if (Number(body.responseStatus) !== 200 || !piece) throw new Error("translate " + body.responseStatus);
    out.push(piece);
  }
  return out.join(" ");
}

/** undefined while translating, null when this device can't translate, otherwise the Korean text. */
export function useKorean(text: string, locale: string) {
  const [korean, setKorean] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setKorean(undefined);
    translateToKorean(text, locale).then((k) => live && setKorean(k && k.trim() !== text.trim() ? k : null));
    return () => {
      live = false;
    };
  }, [text, locale]);
  return korean;
}
