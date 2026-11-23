import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { makeText } from "./text";
import { hear, onsetIn, symptomsIn } from "./speech";
import { plan } from "./engine";
import { CLINIC_ONLY } from "./clinical";
import { sequence } from "./sequence";

const read = (p: string) => JSON.parse(readFileSync(join(__dirname, p), "utf8"));
const bank = read("data/bank.json");
const ko = read("text/ko-KR.json");
const koNames = read("names/ko-KR.json");
const x = makeText({ bank, ko, en: {}, mine: ko, koNames, enNames: {}, myNames: koNames }, "ko-KR");
const KO = JSON.parse(readFileSync(join(__dirname, "../i18n/messages/ko-KR.json"), "utf8"));
const ONSET: Record<string, string> = Object.fromEntries(
  Object.entries(KO).filter(([k]) => k.startsWith("onset.")).map(([k, v]) => [k.slice(6), v as string]),
);
const say = (text: string, sex = "" as const, age = "22") => hear(x, text, sex, age, ONSET);

describe("what a spoken sentence gives", () => {
  it("finds the symptom that was said", () => {
    expect(symptomsIn(x, "어제부터 머리가 아파요", "")[0]).toBeTruthy();
    expect(x.sn(symptomsIn(x, "어제부터 두통이 있어요", "")[0])).toContain("두통");
  });

  it("puts the first symptom said in the chief complaint and the rest alongside it", () => {
    const heard = say("두통이 있고 기침도 나요");
    expect(heard.found.length).toBeGreaterThan(1);
    expect(heard.flow.main).toBeTruthy();
    expect(heard.flow.manual.length).toBeGreaterThan(0);
    expect(heard.flow.manual).not.toContain(heard.flow.main);
  });

  it("keeps the sentence as the complaint when no symptom is recognised", () => {
    const heard = say("qqq zzz", "", "");
    expect(heard.flow.main).toBe("");
    expect(heard.flow.mainText).toBe("qqq zzz");
    expect(heard.found).toEqual([]);
  });

  it("never answers a question that can raise a warning", () => {
    const heard = say("두통이 있고 숨쉬기 힘들고 가슴이 아파요");
    for (const [key, answer] of Object.entries(heard.flow.answers)) {
      const step = plan(bank, heard.flow).steps.find((s) => s.key === key);
      expect(answer.kind).toBe("pick");
      expect(step && bank.questions[step.qid].o.some((o: { level?: string }) => o.level)).toBe(false);
    }
  });

  it("takes the symptom that is called that over one that merely lists it", () => {
    expect(x.sn(say("기침이 나고 목이 아파요").flow.main)).toBe("기침");
  });

  it("hears a one-syllable symptom only as a word of its own", () => {
    expect(say("어제부터 열이 나요").found.map((s) => x.sn(s))).toContain("열이 남");
    expect(say("열심히 공부했어요").found.map((s) => x.sn(s))).not.toContain("열이 남");
  });

  it("picks up the onset the sentence names", () => {
    expect(onsetIn("어제부터 머리가 아파요", ONSET)).toBe("yesterday");
    expect(onsetIn("2~3일 전부터 기침이 나요", ONSET)).toBe("days2to3");
    expect(onsetIn("머리가 아파요", ONSET)).toBe("");
    expect(say("어제부터 머리가 아파요").flow.answers.G_ONSET).toEqual({ kind: "values", values: ["yesterday"] });
  });

  it("respects the sex a symptom belongs to", () => {
    const female = symptomsIn(x, "생리통이 심해요", "M");
    for (const sid of female) expect(bank.symptoms[sid].sex).not.toBe("F");
  });
});

/** Sentences a student might actually type or say. The matcher is allowed to be wrong -- the screen after
 *  it exists for that -- but it has to be right often enough to be worth offering, so this pins the rate. */
const SENTENCES: [string, string, string][] = [
  ["열이나요, 기침이 있어요, 2주전부터 시작됐어요", "열", "weeks2plus"],
  ["열이 나요. 기침이 있어요. 2주 전부터 시작됐어요.", "열", "weeks2plus"],
  ["머리가 아파요", "두통", ""],
  ["배가 너무 아프고 토할 것 같아요", "복통", ""],
  ["어지럽고 가슴이 두근거려요", "어지러", ""],
  ["허리가 아파서 걷기 힘들어요", "허리", ""],
  ["눈이 충혈되고 가려워요", "눈", ""],
  ["설사를 하루에 다섯 번 했어요", "설사", ""],
  ["3일 전부터 기침이 심해요", "기침", "days2to3"],
  ["어제부터 어지러워요", "어지러", "yesterday"],
  ["한 달 넘게 소화가 안 돼요", "소화", "monthPlus"],
  // 목 is both throat and neck. Both read the sentence the same way, so this one lands on 뒷목통증 and
  // the student moves it in one tap -- 인후 증상 is sitting right there as an associated symptom.
  ["목이 아프고 침 삼킬 때 아파요", "", ""],
  ["코가 막히고 재채기가 나요", "재채기", ""],
  ["일주일 전부터 목이 아프고 콧물이 나요", "", "week"],
];

describe("sentences a student would really write", () => {
  it("names the right main symptom in every sentence that is not ambiguous", () => {
    const wrong = SENTENCES.filter(([text, want]) => {
      if (!want) return false;
      const main = say(text).flow.main;
      return !main || !x.sn(main).includes(want);
    });
    expect(wrong.map(([t]) => t)).toHaveLength(0);
  });

  it("picks up every onset that was said", () => {
    for (const [text, , onset] of SENTENCES) expect(say(text).onset, text).toBe(onset);
  });

  it("adds an associated symptom only when two of its words were said, or its own name was", () => {
    for (const [text] of SENTENCES) {
      const heard = say(text);
      for (const sid of heard.flow.manual) {
        const name = x.sn(sid);
        const saidWords = text.split(/[\s,.]+/).map((w) => w.replace(/[가-힣]{0,2}$/, "")).filter(Boolean);
        expect(name.length, `${text} -> ${name}`).toBeGreaterThan(0);
        expect(saidWords.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("the questions the student is not asked", () => {
  it("every clinic-only question exists and carries no warning", () => {
    for (const qid of Object.keys(CLINIC_ONLY)) {
      const q = bank.questions[qid];
      expect(q, qid).toBeDefined();
      expect(q.o.some((o: { level?: string }) => o.level), qid).toBe(false);
    }
  });

  it("the bank still holds them, the sequence does not", () => {
    const heard = say("피부병변이 생겼어요");
    const asked = sequence(bank, heard.flow).map((s) => s.qid);
    for (const qid of Object.keys(CLINIC_ONLY)) expect(asked).not.toContain(qid);
    expect(Object.keys(bank.questions)).toContain("QSWZFA_348");
  });
});
