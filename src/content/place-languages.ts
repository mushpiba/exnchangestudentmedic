// 예시 데이터입니다. SAMPLE DATA — NOT SURVEYED.
//
// Which languages a clinic or pharmacy can actually handle has to be asked, by phone or in person, and
// written down with the date it was asked. None of that has happened yet. The entries below were made up
// to build and test the screen, and `SURVEYED` is false so every screen that shows them says so out loud.
// When the real survey is done: replace this table with the answers, set SURVEYED to true, and put the
// date in SURVEYED_AT. Until then nothing here is a fact about any of these places.
import type { Locale } from "../i18n/locales";

export const SURVEYED = false;
export const SURVEYED_AT = "";

/** OSM place id (src/content/osm-places.json) → languages the staff can serve a patient in. */
export const PLACE_LANGUAGES: Record<string, Locale[]> = {
  n368757002: ["en-US"],
  n368759148: ["en-US", "zh-CN"],
  n4655134788: ["en-US", "ru-RU", "uz"],
  n4633834542: ["en-US"],
  n368757748: ["en-US", "zh-CN"],
  n368757062: ["en-US", "vi-VN"],
  w410767647: ["en-US", "zh-CN", "ru-RU", "mn-MN"],
  n4432273859: ["en-US", "ru-RU"],
  n368758059: ["en-US", "zh-CN"],
  n12466313599: ["en-US", "zh-CN", "vi-VN"],
  n4741732568: ["en-US"],
  n7304684509: ["en-US", "ru-RU"],
  w469635165: ["zh-CN"],
  n13272271932: ["en-US", "uz"],
  n368756965: ["zh-CN"],
};

/** Every language that appears above, in the order the language picker uses. */
export const PLACE_LANGUAGE_CODES: Locale[] = ["en-US", "zh-CN", "ru-RU", "uz", "vi-VN", "mn-MN"];

export const languagesAt = (id: string): Locale[] => PLACE_LANGUAGES[id] ?? [];
