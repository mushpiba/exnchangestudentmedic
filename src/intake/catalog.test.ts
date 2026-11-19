// Language check for the intake (scripts/check-intake-i18n.mjs) as a test, so a deploy fails on a missing
// string, broken placeholder, Korean left in a translation or a changed emergency number.
import { describe, expect, it } from "vitest";
// @ts-expect-error plain JS module shared with the command-line check
import { LOCALES, check } from "../../scripts/check-intake-i18n.mjs";
import { localeCodes } from "../i18n/locales";

describe("intake translations", () => {
  it("covers every app language", () => {
    expect([...LOCALES, "ko-KR"].sort()).toEqual([...localeCodes].sort());
  });
  for (const locale of LOCALES as string[]) {
    it(`${locale}: no missing strings, placeholders intact, no Korean left, emergency numbers kept`, () => {
      const { errors } = check(locale) as { errors: string[][] };
      expect(errors.map((e) => e.slice(0, 2).join(" "))).toEqual([]);
    });
  }
});
