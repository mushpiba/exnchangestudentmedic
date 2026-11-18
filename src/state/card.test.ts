import { describe, expect, it } from "vitest";
import { cardLines, emptyCard, reducer, type Card } from "./card";
import { matches } from "../lib/text";

const card = (patch: Partial<Card>) => ({ ...emptyCard(), ...patch });
const keys = (c: Card) => cardLines(c).map((l) => [l.label, l.values.map((v) => ("text" in v ? "text:" + v.text : v.key))]);

describe("symptom card", () => {
  it("keeps allergy detail and the student's own words", () => {
    expect(keys(card({ allergy: "yes", allergyKinds: ["penicillin"], allergyText: "땅콩" }))).toEqual([
      ["card.allergy", ["allergy.penicillin"]],
      ["card.allergy", ["text:땅콩"]],
    ]);
    expect(keys(card({ allergy: "yes" }))).toEqual([["card.allergy", ["allergy.yes"]]]);
    expect(keys(card({ allergy: "none" }))).toEqual([["card.allergy", ["allergy.none"]]]);
  });

  it("distinguishes none, unknown and not answered", () => {
    expect(cardLines(card({ allergy: "unknown" }))[0].values).toEqual([{ key: "allergy.unknown", params: undefined }]);
    expect(cardLines(card({}))).toEqual([]);
  });

  it("shows pain as a number with the scale label", () => {
    expect(keys(card({ pain: 7 }))).toEqual([["card.pain", ["card.painValue", "vas.6"]]]);
    expect(keys(card({ pain: null }))).toEqual([]);
  });

  it("lists medicine ingredients from photos and free text", () => {
    const c = card({ take: "yes", takeItems: [{ id: "x", name: "게보린", ingredients: ["acetaminophen", "caffeine"] }], takeText: "Ibuprofen" });
    expect(keys(c)).toEqual([
      ["card.meds", ["ing.acetaminophen", "ing.caffeine"]],
      ["card.meds", ["text:Ibuprofen"]],
    ]);
  });

  it("keeps 'none' and 'unknown' exclusive in history", () => {
    let c = reducer(emptyCard(), { type: "toggle", field: "past", value: "asthma" });
    c = reducer(c, { type: "toggle", field: "past", value: "diabetes" });
    expect(c.past).toEqual(["asthma", "diabetes"]);
    c = reducer(c, { type: "toggle", field: "past", value: "none" });
    expect(c.past).toEqual(["none"]);
    c = reducer(c, { type: "toggle", field: "past", value: "asthma" });
    expect(c.past).toEqual(["asthma"]);
  });

  it("does not add the same medicine twice", () => {
    const med = { id: "a", name: "a", ingredients: ["acetaminophen"] };
    const c = reducer(reducer(emptyCard(), { type: "addMed", med }), { type: "addMed", med });
    expect(c.takeItems).toHaveLength(1);
    expect(c.take).toBe("yes");
  });
});

describe("search", () => {
  it("matches any spelling and Uzbek Cyrillic input", () => {
    expect(matches(["Bosh og‘rig‘i", "두통", "Headache"], "бош", "uz")).toBe(true);
    expect(matches(["Bosh og‘rig‘i", "두통", "Headache"], "head", "uz")).toBe(true);
    expect(matches(["두통"], "복통", "ko-KR")).toBe(false);
  });
});
