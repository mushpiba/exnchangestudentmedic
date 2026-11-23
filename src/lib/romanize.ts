// Korean written in the student's own letters, so they can try saying the sentence instead of only
// showing it.
//
// Two steps. First the sound rules: a sentence is cut into syllables and each one is resolved against
// the one after it, because that is where the rules live -- a final consonant moving onto a following
// vowel (같이 → 가치), a stop turning nasal before a nasal (학년 → 항년), ㄹ and ㄴ meeting (신라 → 실라),
// ㅎ making the next consonant aspirate (좋다 → 조타), palatalisation. Then the resolved sounds are
// written out in one script.
//
// Latin is Revised Romanization (국립국어원), the transcription form -- the one on Korean road signs,
// so the app spells a place the way the sign does. It is read the English way, though, so a student
// who reads Cyrillic or Japanese gets the line in their own script instead: those are pronunciation
// hints, not transliteration standards, and the Korean itself is always right next to them.
const BASE = 0xac00;
const LAST = 0xd7a3;

const ONSET = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const VOWEL = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
/** As they sound at the end of a syllable, before anything else happens. */
const CODA = ["", "k", "k", "k", "n", "n", "n", "t", "l", "l", "l", "l", "l", "l", "l", "l", "m", "p", "p", "t", "t", "ng", "t", "t", "k", "t", "p", "t"];

/** Jamo index of a coda, for the rules that need to know which letter it was. */
const CODA_JAMO = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
/** A two-letter coda keeps the first sound and hands the second one forward when a vowel follows. */
const SPLIT: Record<string, [string, number]> = {
  "ㄳ": ["ㄱ", 9], "ㄵ": ["ㄴ", 12], "ㄶ": ["ㄴ", 18], "ㄺ": ["ㄹ", 0], "ㄻ": ["ㄹ", 6],
  "ㄼ": ["ㄹ", 7], "ㄽ": ["ㄹ", 9], "ㄾ": ["ㄹ", 16], "ㄿ": ["ㄹ", 17], "ㅀ": ["ㄹ", 18], "ㅄ": ["ㅂ", 9],
};
/** What an onset becomes when ㅎ runs into it, or it runs into ㅎ. */
const ASPIRATE: Record<number, number> = { 0: 15, 3: 16, 7: 18, 12: 14 };

type Syllable = { on: number; vo: number; co: number };
const split = (code: number): Syllable => {
  const n = code - BASE;
  return { on: Math.floor(n / 588), vo: Math.floor((n % 588) / 28), co: n % 28 };
};

/** A syllable with the sound rules applied, and where it sits in the word. */
type Sound = Syllable & {
  /** ㄱㄷㅂㅈ are said voiced between a vowel or a nasal and the next vowel: 한국 is hangug, not hankuk.
   *  Revised Romanization writes them voiced either way, so only the other scripts use this. */
  voiced: boolean;
  /** The syllable before ended in ㄹ, so an ㄹ here is the second half of a double ㄹ (신라 silla). */
  afterL: boolean;
};

/** Anything not Korean comes through as itself. */
type Piece = Sound | string;

/** ㄱㄷㅂㅈ voice after a vowel or a nasal, which is what the previous coda tells us. */
const VOICES = new Set(["", "n", "m", "l", "ng"]);
const PLAIN = new Set([0, 3, 7, 12]);

function resolve(text: string): Piece[] {
  const parts: (Syllable | string)[] = [...text].map((c) => {
    const code = c.codePointAt(0)!;
    return code >= BASE && code <= LAST ? split(code) : c;
  });

  const out: Piece[] = [];
  let afterL = false;
  let before: string | null = null;
  for (let i = 0; i < parts.length; i++) {
    const cur = parts[i];
    if (typeof cur === "string") {
      out.push(cur);
      afterL = false;
      before = null;
      continue;
    }
    const next = parts[i + 1];
    const onset = cur.on;
    let coda = cur.co;

    if (typeof next === "object") {
      const letter = CODA_JAMO[coda];
      const pair = SPLIT[letter];
      // A vowel follows: the final consonant moves over to start the next syllable.
      // 같이 is said gachi, 굳이 guji: ㄷ and ㅌ before 이 come out as ㅈ and ㅊ.
      if (next.on === 11 && next.vo === 20 && (letter === "ㄷ" || letter === "ㅌ")) {
        parts[i + 1] = { ...next, on: letter === "ㄷ" ? 12 : 14 };
        coda = 0;
      } else if (next.on === 11 && coda) {
        if (pair) {
          parts[i + 1] = { ...next, on: pair[1] };
          coda = CODA_JAMO.indexOf(pair[0]);
        } else if (letter === "ㅇ") {
          // ㅇ stays put; it is the only final that does not move.
        } else {
          parts[i + 1] = { ...next, on: ONSET_OF[letter] ?? next.on };
          coda = 0;
        }
      } else if (letter === "ㅎ" && ASPIRATE[next.on] !== undefined) {
        parts[i + 1] = { ...next, on: ASPIRATE[next.on] };
        coda = 0;
      } else if (next.on === 18 && ASPIRATE[CODA_ONSET[coda] ?? -1] !== undefined) {
        parts[i + 1] = { ...next, on: ASPIRATE[CODA_ONSET[coda]] };
        coda = 0;
      } else if ((next.on === 2 || next.on === 6) && ["k", "t", "p"].includes(CODA[coda])) {
        // A stop before a nasal becomes one: 학년 hangnyeon, 입문 immun.
        coda = CODA.indexOf(CODA[coda] === "k" ? "ng" : CODA[coda] === "t" ? "n" : "m");
      } else if (CODA[coda] === "l" && next.on === 2) {
        parts[i + 1] = { ...next, on: 5 };
      } else if (CODA[coda] === "n" && next.on === 5) {
        coda = CODA.indexOf("l");
      }
    }

    out.push({ on: onset, vo: cur.vo, co: coda, afterL, voiced: PLAIN.has(onset) && before !== null && VOICES.has(before) });
    afterL = CODA[coda] === "l";
    before = CODA[coda];
  }
  return out;
}

/** Which onset a final consonant becomes when it moves onto the next syllable. */
const ONSET_OF: Record<string, number> = {
  "ㄱ": 0, "ㄲ": 1, "ㄴ": 2, "ㄷ": 3, "ㄹ": 5, "ㅁ": 6, "ㅂ": 7, "ㅅ": 9,
  "ㅆ": 10, "ㅈ": 12, "ㅊ": 14, "ㅋ": 15, "ㅌ": 16, "ㅍ": 17, "ㅎ": 18,
};
/** The onset index a coda would have, for the ㅎ rule read the other way round. */
const CODA_ONSET: Record<number, number> = { 1: 0, 7: 3, 17: 7, 22: 12, 23: 14 };

// ---------------------------------------------------------------- the scripts

/** Cyrillic, close to the Kontsevich system a Russian reader will have seen for Korean names. */
const C_ONSET = ["к", "кк", "н", "т", "тт", "р", "м", "п", "пп", "с", "сс", "", "ч", "чч", "чх", "кх", "тх", "пх", "х"];
const C_VOICED: Record<number, string> = { 0: "г", 3: "д", 7: "б", 12: "дж" };
const C_VOWEL = ["а", "э", "я", "йэ", "о", "е", "ё", "е", "о", "ва", "вэ", "ве", "ё", "у", "во", "ве", "ви", "ю", "ы", "ый", "и"];
const C_CODA: Record<string, string> = { "": "", k: "к", n: "н", t: "т", l: "л", m: "м", p: "п", ng: "нг" };

/** Katakana. The rows are the five kana plus the small kana a glide needs, so one row covers every vowel. */
const KANA: Record<string, [string, string, string, string, string]> = {
  k: ["カ", "キ", "ク", "ケ", "コ"], g: ["ガ", "ギ", "グ", "ゲ", "ゴ"], n: ["ナ", "ニ", "ヌ", "ネ", "ノ"],
  t: ["タ", "ティ", "トゥ", "テ", "ト"], d: ["ダ", "ディ", "ドゥ", "デ", "ド"], r: ["ラ", "リ", "ル", "レ", "ロ"],
  m: ["マ", "ミ", "ム", "メ", "モ"], p: ["パ", "ピ", "プ", "ペ", "ポ"], b: ["バ", "ビ", "ブ", "ベ", "ボ"],
  s: ["サ", "シ", "ス", "セ", "ソ"], h: ["ハ", "ヒ", "フ", "ヘ", "ホ"],
  ch: ["チャ", "チ", "チュ", "チェ", "チョ"], j: ["ジャ", "ジ", "ジュ", "ジェ", "ジョ"],
  "": ["ア", "イ", "ウ", "エ", "オ"],
};
const K_ROW = ["k", "k", "n", "t", "t", "r", "m", "p", "p", "s", "s", "", "ch", "ch", "ch", "k", "t", "p", "h"];
const K_VOICED: Record<number, string> = { 0: "g", 3: "d", 7: "b", 12: "j" };
/** Which of the five kana a Korean vowel lands on, and the small kana that makes it a glide. */
const K_VOWEL: [number, string][] = [
  [0, ""], [3, ""], [1, "ャ"], [1, "ェ"], [4, ""], [3, ""], [1, "ョ"], [1, "ェ"], [4, ""], [2, "ァ"],
  [2, "ェ"], [2, "ェ"], [1, "ョ"], [2, ""], [2, "ォ"], [2, "ェ"], [2, "ィ"], [1, "ュ"], [2, ""], [2, "イ"], [1, ""],
];
/** ㅇ has no consonant to glide off, so the y- and w-rows are written out. */
const K_BARE: Record<number, string> = { 2: "ヤ", 3: "イェ", 6: "ヨ", 7: "イェ", 9: "ワ", 10: "ウェ", 11: "ウェ", 12: "ヨ", 14: "ウォ", 15: "ウェ", 16: "ウィ", 17: "ユ", 19: "ウイ" };
const K_CODA: Record<string, string> = { "": "", k: "ク", n: "ン", t: "ッ", l: "ル", m: "ム", p: "プ", ng: "ン" };

export type Script = "latin" | "cyrillic" | "kana";

const WRITE: Record<Script, (s: Sound) => string> = {
  latin: (s) => (s.on === 5 && s.afterL ? "l" : ONSET[s.on]) + VOWEL[s.vo] + CODA[s.co],
  cyrillic: (s) =>
    (s.on === 5 && s.afterL ? "л" : (s.voiced ? C_VOICED[s.on] : undefined) ?? C_ONSET[s.on]) +
    C_VOWEL[s.vo] +
    C_CODA[CODA[s.co]],
  kana: (s) => {
    const row = (s.voiced ? K_VOICED[s.on] : undefined) ?? K_ROW[s.on];
    const [slot, small] = K_VOWEL[s.vo];
    const head = row === "" && K_BARE[s.vo] ? K_BARE[s.vo] : KANA[row][slot] + small;
    return head + K_CODA[CODA[s.co]];
  },
};

/** The script a student reads. The others fall back to Latin, which they will have met in school. */
const BY_LOCALE: Record<string, Script> = {
  "ru-RU": "cyrillic", kk: "cyrillic", ky: "cyrillic", "mn-MN": "cyrillic", "ja-JP": "kana",
};
export const scriptFor = (locale: string): Script => BY_LOCALE[locale] ?? "latin";
/** Which language tag the pronunciation line is in, so a screen reader says it that way. */
export const scriptLang = (locale: string) => (scriptFor(locale) === "latin" ? "en" : locale);

export function romanize(text: string, script: Script = "latin"): string {
  const write = WRITE[script];
  return resolve(text)
    .map((p) => (typeof p === "string" ? p : write(p)))
    .join("");
}
