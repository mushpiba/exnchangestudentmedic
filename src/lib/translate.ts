// Two directions, two rules.
// The student's own words are health information, so they stay on the device unless the student taps
// "Translate into Korean" after reading the notice. The desk's own questions are not -- they are printed
// on a sheet in a waiting room -- so those are translated as the patient's screen opens.
// "On the device" means the browser's built-in Translator (Chrome/Edge desktop today); where it is
// missing, callers show the original.
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

/** `ready` asks for a model the device already holds: nobody waits for a download in a waiting room. */
function translator(from: string, to: string, ready = false): Promise<Translator | null> {
  const pair = from + "\u0000" + to + (ready ? "\u0000ready" : "");
  const api = (globalThis as { Translator?: TranslatorApi }).Translator;
  if (!api) return Promise.resolve(null);
  if (!translators.has(pair)) {
    const options = { sourceLanguage: from, targetLanguage: to };
    translators.set(
      pair,
      api
        .availability(options)
        .then((state) => ((ready ? state === "available" : state !== "unavailable") ? api.create(options) : null))
        .catch(() => null),
    );
  }
  return translators.get(pair)!;
}

export function translateToKorean(text: string, locale: string): Promise<string | null> {
  const from = sourceLanguage(locale);
  if (from === "ko" || !text.trim()) return Promise.resolve(null);
  const key = from + "\u0000" + text;
  if (!results.has(key)) {
    results.set(
      key,
      translator(from, "ko").then((t) => (t ? t.translate(text) : null)).catch(() => null),
    );
  }
  return results.get(key)!;
}

// ─── The other direction ──────────────────────────────────────────────────────────────────────
// A desk's own questions are typed in Korean and cannot be translated ahead of time: they live in the
// printed QR, not in the catalogue. The patient should not have to ask for them in their own language,
// so the phone fetches them as the screen opens -- from our translation server where one is set up, and
// otherwise from a model the device already holds. Where neither can, the screen offers a link out.
// Unlike the student's own words, a desk's question is not anybody's health information: it is printed
// on a sheet in a waiting room. That is why this direction may leave the phone without being asked.

/** Korean the desk typed, in another language. null when nothing here can translate it. */
export function translateFromKorean(text: string, locale: string): Promise<string | null> {
  const to = sourceLanguage(locale);
  if (to === "ko" || !text.trim()) return Promise.resolve(null);
  const key = "ko\u0000" + to + "\u0000" + text;
  if (!results.has(key)) results.set(key, fromKorean(text, to));
  return results.get(key)!;
}

async function fromKorean(text: string, to: string): Promise<string | null> {
  if (import.meta.env.VITE_TRANSLATE_URL) {
    try {
      return await askServer(text, "ko", to);
    } catch {
      // The server is the better translator, not the only one. Fall through to the device.
    }
  }
  // A browser can take its time to say whether it holds a model -- one never answered in 45 seconds. The
  // patient is standing at a desk, so a device that does not answer quickly is a device that cannot.
  const giveUp = new Promise<null>((done) => setTimeout(() => done(null), 2000));
  const onDevice = translator("ko", to, true).then((t) => (t ? t.translate(text) : null)).catch(() => null);
  return Promise.race([onDevice, giveUp]);
}

/** Where the patient goes when their phone cannot translate: Google's own page, opened by their own tap.
 *  Only the question travels — answers never leave the phone. Google's codes are the server's codes. */
export const translateUrl = (text: string, locale: string) =>
  `https://translate.google.com/?sl=ko&tl=${serverLanguage(locale)}&op=translate&text=${encodeURIComponent(text)}`;

// ─── Translation server ───────────────────────────────────────────────────────────────────────
// Our own proxy, set by VITE_TRANSLATE_URL: POST {text, from, to} → {text}. Nothing but the text goes in
// it, and the key stays on the server. See README for what to put behind it.
// Without it the student's words fall back to MyMemory's free API (no key, CORS open). Checked on
// 2026-11-28: that endpoint now answers only out of its translation memory -- a stored phrase comes back,
// anything else returns translatedText: null with status 200 -- so a real sentence does not translate.
// It is kept only as the no-key default; the app shows which server it is using next to the button.
export const TRANSLATION_SERVER = {
  name: (import.meta.env.VITE_TRANSLATE_URL ? "NARU" : "MyMemory") as string,
  temporary: !import.meta.env.VITE_TRANSLATE_URL,
};

/** Language code the server expects. */
function serverLanguage(locale: string) {
  if (locale === "zh-CN" || locale === "zh-TW") return locale;
  return locale.split("-")[0];
}

/** Our own proxy. Throws when it is not set up, or does not answer with text. */
async function askServer(text: string, from: string, to: string): Promise<string> {
  const url = import.meta.env.VITE_TRANSLATE_URL as string | undefined;
  if (!url) throw new Error("translate: no server");
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, from, to }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("translate " + res.status);
  const body = (await res.json()) as { text?: string };
  if (!body.text?.trim()) throw new Error("translate: empty");
  return body.text;
}

/** Translate the student's words to Korean through the translation server. Throws when it can't. */
export async function translateOnServer(text: string, locale: string): Promise<string> {
  const from = serverLanguage(locale);
  if (import.meta.env.VITE_TRANSLATE_URL) return askServer(text, from, "ko");
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
