// Language check for the intake catalogs (src/intake/text/<locale>.json, src/intake/names/<locale>.json).
//   node scripts/check-intake-i18n.mjs            report for every language
//   node scripts/check-intake-i18n.mjs ru-RU      one language, with every warning listed
// Errors (exit 1): a missing or empty string, placeholders that differ from Korean, Korean letters left in a
// translation, an emergency phone number (119, 109, 1366, 1577-1366) not kept exactly.
// Warnings: numbers that differ from Korean, text in the wrong script, a string identical to Korean,
// a length far from the Korean. Warnings need a human look; they are not always wrong.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => (existsSync(join(root, p)) ? JSON.parse(readFileSync(join(root, p), "utf8")) : null);
const ko = read("src/intake/text/ko-KR.json");
const bank = read("src/intake/data/bank.json");
const symptomIds = Object.keys(bank.symptoms);

export const LOCALES = ["en-US", "uz", "kk", "ky", "ru-RU", "zh-CN", "zh-TW", "ja-JP", "vi-VN", "mn-MN", "ne-NP", "es-ES", "fr-FR", "ar-SA", "ur-PK"];
const SCRIPT = {
  "ru-RU": /[Ѐ-ӿ]/, kk: /[Ѐ-ӿ]/, ky: /[Ѐ-ӿ]/, "mn-MN": /[Ѐ-ӿ]/,
  "ar-SA": /[؀-ۿ]/, "ur-PK": /[؀-ۿ]/, "ne-NP": /[ऀ-ॿ]/,
  "zh-CN": /[一-鿿]/, "zh-TW": /[一-鿿]/, "ja-JP": /[぀-ヿ一-鿿]/,
};
const HANGUL = /[가-힣ᄀ-ᇿ㄰-㆏]/;
const PHONES = ["1577-1366", "1366", "119", "109"];
const placeholders = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join();
// Digits in any script, decimal comma as dot. Korean ordinals (제2) and "1" (often written as a word) are ignored.
const toAscii = (s) =>
  s
    .replace(/[０-９]/g, (d) => String(d.charCodeAt(0) - 0xff10))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966));
const numbers = (s, korean) =>
  (toAscii(korean ? s.replace(/제\d+/g, "") : s).match(/\d+(?:[.,]\d+)?/g) ?? [])
    .map((n) => n.replace(",", "."))
    .filter((n) => !korean || n !== "1");
const phonesIn = (s) => PHONES.filter((p) => s.includes(p)).join();

/** Keys a locale must have: everything, except symptom names when the data already names every symptom. */
export function requiredKeys(locale) {
  const names = read(`src/intake/names/${locale}.json`);
  // Symptom names come from the data's own translation where it has one.
  return Object.keys(ko).filter((k) => !(k.startsWith("s.") && names?.[k.slice(2)]?.[0]));
}

export function check(locale) {
  const dict = read(`src/intake/text/${locale}.json`) ?? {};
  const errors = [];
  const warnings = [];
  for (const key of requiredKeys(locale)) {
    const src = ko[key];
    const out = dict[key];
    if (!out || !out.trim()) { errors.push([key, "missing"]); continue; }
    if (placeholders(src) !== placeholders(out)) errors.push([key, "placeholders", src, out]);
    if (HANGUL.test(out)) errors.push([key, "Korean letters left", src, out]);
    if (phonesIn(src) && phonesIn(src) !== phonesIn(out)) errors.push([key, "phone number changed", src, out]);
    const have = numbers(out, false);
    const lost = numbers(src, true).filter((n) => !have.includes(n));
    if (lost.length) warnings.push([key, "number missing " + lost.join("/"), src, out]);
    const letters = out.replace(/[\d\s\p{P}\p{S}]|[A-Za-z]{2,}\d*/gu, "");
    if (SCRIPT[locale] && letters.length > 2 && !SCRIPT[locale].test(out)) warnings.push([key, "wrong script", src, out]);
    if (out === src && HANGUL.test(src)) warnings.push([key, "same as Korean", src, out]);
    const ratio = out.length / Math.max(1, src.length);
    if (src.length >= 6 && (ratio > 8 || ratio < 0.25)) warnings.push([key, "length " + ratio.toFixed(1) + "x", src, out]);
  }
  const extra = Object.keys(dict).filter((k) => !(k in ko));
  return { errors, warnings, extra };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const only = process.argv[2];
  let failed = false;
  for (const locale of only ? [only] : LOCALES) {
    const { errors, warnings, extra } = check(locale);
    failed ||= errors.length > 0;
    const kinds = (list) => Object.entries(list.reduce((m, [, kind]) => ({ ...m, [kind]: (m[kind] ?? 0) + 1 }), {})).map(([k, n]) => `${k} ${n}`).join(", ");
    console.log(`${locale.padEnd(6)} errors ${errors.length}${errors.length ? " (" + kinds(errors) + ")" : ""} · warnings ${warnings.length}${warnings.length ? " (" + kinds(warnings) + ")" : ""}${extra.length ? " · unused " + extra.length : ""}`);
    if (only || errors.length) for (const [key, kind, src, out] of [...errors, ...(only ? warnings : [])]) console.log(`  ${kind}: ${key}  ${src ?? ""}  →  ${out ?? ""}`);
  }
  process.exit(failed ? 1 : 0);
}
