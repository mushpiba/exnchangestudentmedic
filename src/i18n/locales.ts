/** native: shown to students. ko: shown to Korean staff on the card. */
export const LOCALES = [
  { code: "ko-KR", native: "한국어", ko: "한국어", rtl: false },
  { code: "en-US", native: "English", ko: "영어", rtl: false },
  { code: "uz", native: "O‘zbekcha", ko: "우즈베크어", rtl: false },
  { code: "kk", native: "Қазақша", ko: "카자흐어", rtl: false },
  { code: "ky", native: "Кыргызча", ko: "키르기스어", rtl: false },
  { code: "ru-RU", native: "Русский", ko: "러시아어", rtl: false },
  { code: "zh-CN", native: "简体中文", ko: "중국어(간체)", rtl: false },
  { code: "zh-TW", native: "繁體中文", ko: "중국어(번체)", rtl: false },
  { code: "ja-JP", native: "日本語", ko: "일본어", rtl: false },
  { code: "vi-VN", native: "Tiếng Việt", ko: "베트남어", rtl: false },
  { code: "mn-MN", native: "Монгол", ko: "몽골어", rtl: false },
  { code: "ne-NP", native: "नेपाली", ko: "네팔어", rtl: false },
  { code: "es-ES", native: "Español", ko: "스페인어", rtl: false },
  { code: "fr-FR", native: "Français", ko: "프랑스어", rtl: false },
  { code: "ar-SA", native: "العربية", ko: "아랍어", rtl: true },
  { code: "ur-PK", native: "اردو", ko: "우르두어", rtl: true },
] as const;
export const koreanName = (code: string) => LOCALES.find((l) => l.code === code)?.ko ?? code;

export type Locale = (typeof LOCALES)[number]["code"];
export const localeCodes = LOCALES.map((l) => l.code) as Locale[];
export const nativeName = (code: string) =>
  LOCALES.find((l) => l.code === code)?.native ?? code;
export const isRtl = (code: Locale) =>
  LOCALES.find((l) => l.code === code)?.rtl ?? false;

const STORAGE_KEY = "naru-language";

export function savedLocale(): Locale | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return localeCodes.includes(saved as Locale) ? (saved as Locale) : null;
  } catch {
    return null;
  }
}

export function rememberLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* private mode: the choice lasts for this tab only */
  }
}

/** First suggestion: saved choice, then the device languages, then English. */
export function initialLocale(languages: readonly string[] = navigator.languages): Locale {
  const saved = savedLocale();
  if (saved) return saved;
  for (const code of languages) {
    if (/^zh-(Hant|TW|HK|MO)/i.test(code)) return "zh-TW";
    const base = code.split("-")[0].toLowerCase();
    const match = localeCodes.find((l) => l === code || l.split("-")[0] === base);
    if (match) return match;
  }
  return "en-US";
}
