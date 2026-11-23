import { describe, expect, it } from "vitest";
import { romanize, scriptFor } from "./romanize";

describe("Korean in Latin letters", () => {
  it("writes plain syllables", () => {
    expect(romanize("안녕하세요")).toBe("annyeonghaseyo");
    expect(romanize("한국")).toBe("hanguk");
    expect(romanize("약국")).toBe("yakguk");
    expect(romanize("접수")).toBe("jeopsu");
  });

  it("moves a final consonant onto a following vowel", () => {
    expect(romanize("같이")).toBe("gachi");
    expect(romanize("읽어요")).toBe("ilgeoyo");
    expect(romanize("앉아")).toBe("anja");
  });

  it("turns a stop nasal before a nasal", () => {
    expect(romanize("학년")).toBe("hangnyeon");
    expect(romanize("입문")).toBe("immun");
  });

  it("joins ㄹ and ㄴ", () => {
    expect(romanize("신라")).toBe("silla");
    expect(romanize("설날")).toBe("seollal");
  });

  it("aspirates across ㅎ", () => {
    expect(romanize("좋다")).toBe("jota");
    expect(romanize("축하")).toBe("chuka");
  });

  it("leaves anything that is not Korean alone", () => {
    expect(romanize("119에 전화")).toBe("119e jeonhwa");
    expect(romanize("NARU")).toBe("NARU");
  });
});

// A student who does not read Latin letters the English way gets the same sounds in their own script.
// These pin the rules, not the famous spellings: Сеул and プルコギ came into those languages through
// English and do not follow from how the Korean is said.
describe("Korean in Cyrillic", () => {
  it("writes plain syllables", () => {
    expect(romanize("안녕하세요", "cyrillic")).toBe("аннёнгхасеё");
    expect(romanize("김치", "cyrillic")).toBe("кимчхи");
  });

  it("voices ㄱㄷㅂㅈ after a vowel or a nasal, and not at the start", () => {
    expect(romanize("한국", "cyrillic")).toBe("хангук");
    expect(romanize("받고", "cyrillic")).toBe("патко");
  });

  it("keeps the sound rules", () => {
    expect(romanize("신라", "cyrillic")).toBe("силла");
    expect(romanize("같이", "cyrillic")).toBe("качхи");
    expect(romanize("진료", "cyrillic")).toBe("чиллё");
  });

  it("leaves anything that is not Korean alone", () => {
    expect(romanize("119에 전화", "cyrillic")).toBe("119е чонхва");
  });
});

describe("Korean in katakana", () => {
  it("writes plain syllables", () => {
    expect(romanize("안녕하세요", "kana")).toBe("アンニョンハセヨ");
    expect(romanize("김치", "kana")).toBe("キムチ");
  });

  it("voices ㄱㄷㅂㅈ after a vowel or a nasal, and not at the start", () => {
    expect(romanize("한국", "kana")).toBe("ハングク");
    expect(romanize("받고", "kana")).toBe("パッコ");
  });

  it("keeps the sound rules", () => {
    expect(romanize("진료", "kana")).toBe("チルリョ");
  });
});

describe("which script a student reads", () => {
  it("picks the one their language is written in", () => {
    expect(scriptFor("ru-RU")).toBe("cyrillic");
    expect(scriptFor("mn-MN")).toBe("cyrillic");
    expect(scriptFor("ja-JP")).toBe("kana");
  });

  it("falls back to Latin for everyone else", () => {
    for (const code of ["en-US", "ar-SA", "ne-NP", "zh-CN", "vi-VN"]) expect(scriptFor(code)).toBe("latin");
  });
});
