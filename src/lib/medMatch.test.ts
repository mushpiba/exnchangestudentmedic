import { describe, expect, it } from "vitest";
import { analyze, findForeign, koreanAlternatives, locate, squash } from "./medMatch";

const ids = (text: string) => analyze(text).ingredients.map((i) => i.id).sort();

describe("medicine matching", () => {
  it("reads a typical OTC box", () => {
    const r = analyze("일반의약품\n타이레놀정 500밀리그람\n[성분] 아세트아미노펜 500밀리그램");
    expect(r.products).toEqual(["tylenol500"]);
    expect(r.families).toEqual([]);
    expect(r.ingredients).toEqual([{ id: "acetaminophen", amount: "500 mg" }]);
    expect(r.otc).toBe(true);
    expect(r.rx).toBe(false);
  });

  it("joins Korean split by OCR spaces and folds ㎎", () => {
    expect(analyze("아 세 트 아 미 노 펜 325 ㎎").ingredients).toEqual([{ id: "acetaminophen", amount: "325 mg" }]);
  });

  it("tolerates one OCR error in a long name", () => {
    expect(ids("아세트아미노팬 500mg")).toEqual(["acetaminophen"]);
    expect(locate(squash("덱스트로메토르판브롬화수소산염"), squash("덱스트로메토르펜"))).toBeGreaterThanOrEqual(0);
  });

  it("prefers the specific name when one contains another", () => {
    expect(ids("레보세티리진염산염 5mg")).toEqual(["levocetirizine"]);
    expect(ids("Dexibuprofen 300 mg")).toEqual(["dexibuprofen"]);
  });

  it("expands a specific product into its MFDS ingredients", () => {
    expect(ids("개비스콘 더블액션 현탁액")).toEqual(["calciumCarbonate", "sodiumAlginate", "sodiumBicarbonate"]);
    expect(ids("게보린정")).toEqual(["acetaminophen", "caffeine", "isopropylantipyrine"]);
    expect(ids("판콜에스 내복액")).toEqual(["acetaminophen", "caffeine", "chlorpheniramine", "guaifenesin", "methylephedrine"]);
  });

  it("does not guess ingredients from a bare brand whose products differ", () => {
    for (const [text, family] of [["게보린 소프트", "게보린"], ["판콜아이시럽", "판콜"], ["케토톱 액티브", "케토톱"], ["탁센", "탁센"]]) {
      const r = analyze(text);
      expect(r.products).toEqual([]);
      expect(r.families).toEqual([family]);
      expect(r.ingredients).toEqual([]);
    }
  });

  it("keeps chlorpheniramine and pheniramine apart", () => {
    expect(ids("클로르페니라민말레산염 2.5mg")).toEqual(["chlorpheniramine"]);
    expect(ids("테라플루 나이트타임")).toContain("pheniramine");
  });

  it("flags prescription labels and pharmacy bags", () => {
    const r = analyze("전문의약품 복약안내 조제일 2026.11.18");
    expect(r.rx).toBe(true);
    expect(r.bag).toBe(true);
  });

  it("finds searches in other scripts", () => {
    expect(ids("парацетамол")).toEqual(["acetaminophen"]);
    expect(analyze("тайленол").families).toEqual(["타이레놀"]);
    expect(analyze("zyrtec").products).toEqual(["zyrtec"]);
    expect(ids("Paracetamol")).toEqual(["acetaminophen"]);
  });

  it("finds nothing in unrelated text", () => {
    const r = analyze("오늘 날씨가 좋네요. 인하대학교 학생식당 메뉴");
    expect(r.products).toEqual([]);
    expect(r.ingredients).toEqual([]);
  });
});

describe("medicine from home", () => {
  it("reads ingredient names typed in Russian or Chinese", () => {
    expect(findForeign("аспирин, парацетамол, кофеин").ingredients.sort()).toEqual(["acetaminophen", "aspirin", "caffeine"]);
    expect(findForeign("布洛芬").ingredients).toEqual(["ibuprofen"]);
  });

  it("offers single-ingredient Korean products for a single ingredient", () => {
    const { each } = koreanAlternatives(["acetaminophen"]);
    expect(each[0].kind).toBe("single");
    expect(each[0].products).toContain("tylenol500");
  });

  it("never suggests other combinations for a combination medicine", () => {
    const { each } = koreanAlternatives(["acetaminophen", "aspirin", "caffeine"]);
    expect(each.some((a) => a.kind === "combo")).toBe(false);
    // Caffeine only comes in combinations in Korea, so it gets no block of its own.
    expect(each.map((a) => a.id)).not.toContain("caffeine");
  });
});

describe("Korean substitutes", () => {
  it("leaves out children's forms and products with ingredients the dictionary skips", () => {
    const { each } = koreanAlternatives(["acetaminophen"]);
    expect(each[0].products).toEqual(expect.arrayContaining(["tylenol500", "tylenol8h"]));
    expect(each[0].products).not.toContain("tylenolKids");
    expect(each[0].products).not.toContain("champSyrup");
    expect(each[0].products).not.toContain("suspenSupp");
  });
});

describe("medicine names from home", () => {
  const keys = (text: string) => findForeign(text).products.map((p) => p.key);

  it("lists every product of a bare brand to pick from", () => {
    expect(keys("panadol")).toEqual(expect.arrayContaining(["panadol500", "panadolExtra"]));
    expect(keys("панадол").length).toBeGreaterThan(1);
  });

  it("finds the specific product when its full name is typed", () => {
    expect(keys("Panadol Extra")).toEqual(["panadolExtra"]);
    expect(keys("цитрамон п")).toEqual(["citramonP"]);
  });

  it("finds products by a partial name, a brand word or a two-character Chinese name", () => {
    expect(keys("цитрамон")).toEqual(["citramonP"]);
    expect(keys("цитрамон таблетки")).toEqual(["citramonP"]);
    expect(keys("泰诺")).toContain("tylenolColdCn");
    expect(keys("но-шпа")).toEqual(["noShpa"]);
  });

  it("keeps ingredients NARU cannot explain by their international name", () => {
    const noShpa = findForeign("но-шпа").products[0];
    expect(noShpa.ingredients.every((i) => !i.id && i.inn === "drotaverine")).toBe(true);
    expect(findForeign("metamizole").inns).toEqual(["metamizole"]);
  });
});

describe("same-ingredient Korean products", () => {
  it("are only offered when NARU knows every ingredient", () => {
    const set = ["acetaminophen", "chlorpheniramine", "caffeine"];
    expect(koreanAlternatives(set).same).toContain("panpyrinT");
    // 快克 also has amantadine, which NARU can't explain: 판피린티정 is not the same medicine.
    expect(koreanAlternatives(set, false).same).toEqual([]);
  });
});
