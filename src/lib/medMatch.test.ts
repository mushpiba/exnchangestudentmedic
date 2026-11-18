import { describe, expect, it } from "vitest";
import { analyze, locate, squash } from "./medMatch";

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
