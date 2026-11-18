import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { LOCALES } from "./locales";
import { CATEGORIES, AREAS, ONSETS, ALLERGY_KINDS, PAST, PREGNANCY, symptomIds, departmentsFor, CATEGORY_DEPTS } from "../content/symptoms";
import { CONDITIONS, FLAGS } from "../content/conditions";
import { INGREDIENTS } from "../content/medicines";
import { QUICK_DEPTS } from "../content/facilities";

const dir = __dirname;
const read = (path: string): Record<string, string> => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {});
const own = (l: string) => read(join(dir, "messages", l + ".json"));
const simtomi = (l: string) => read(join(dir, "simtomi", l + ".json"));
const KO = { ...simtomi("ko-KR"), ...own("ko-KR") };
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();

describe("translation catalog", () => {
  for (const { code } of LOCALES) {
    it(`${code} has every key, non-empty, with matching placeholders`, () => {
      const dict = { ...simtomi(code), ...own(code) };
      const missing = Object.keys(KO).filter((k) => !dict[k]?.trim());
      expect(missing).toEqual([]);
      const broken = Object.keys(KO).filter((k) => dict[k] && placeholders(dict[k]) !== placeholders(KO[k]));
      expect(broken).toEqual([]);
    });
  }
});

describe("content references", () => {
  const need = [
    ...CATEGORIES.map((c) => "cat." + c),
    ...symptomIds.map((s) => "sx." + s),
    ...AREAS.map((a) => "area." + a),
    ...ONSETS.map((o) => "onset." + o),
    ...ALLERGY_KINDS.map((a) => "allergy." + a),
    ...PAST.map((p) => "past." + p),
    ...PREGNANCY.map((p) => "preg." + p),
    ...Object.values(CATEGORY_DEPTS).flat().map((d) => "dept." + d),
    ...QUICK_DEPTS.map((d) => "dept." + d),
    ...Object.keys(FLAGS).map((f) => "flag." + f),
    ...Object.entries(CONDITIONS).flatMap(([id, c]) => [
      c.name,
      "cond." + id + ".summary",
      ...c.care.map((k) => "care." + k),
      ...c.depts.map((d) => "dept." + d),
      ...c.otc.map((o) => "otc." + o),
      ...c.symptoms.map((s) => "sx." + s),
    ]),
    ...Object.entries(INGREDIENTS).flatMap(([id, i]) => [
      "ing." + id,
      "medclass." + i.cls,
      ...i.uses.map((u) => "use." + u),
      ...i.cautions.map((c) => "caution." + c),
    ]),
  ];
  it("every content key exists in Korean", () => {
    expect([...new Set(need)].filter((k) => !KO[k])).toEqual([]);
  });
  it("every condition flag is defined", () => {
    for (const c of Object.values(CONDITIONS)) for (const f of c.flags) expect(FLAGS[f]).toBeDefined();
  });
  it("departments come from the most specific category", () => {
    expect(departmentsFor("earPain")).toEqual(["JEN"]);
    expect(departmentsFor("fever")[0]).toBe("JIM");
  });
});

describe("keys used in source", () => {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(f.name) && !f.name.includes(".test.")) files.push(p);
    }
  };
  walk(join(dir, ".."));
  it("every literal t()/tk()/k=/phrase= key exists", () => {
    const used = new Set<string>();
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/\b(?:t|tk)\("([a-zA-Z]+\.[\w.]+)"/g)) used.add(m[1]);
      for (const m of src.matchAll(/\b(?:k|phrase|label)[=:] ?"([a-z]+\.[\w.]+)"/g)) used.add(m[1]);
    }
    expect(used.size).toBeGreaterThan(100);
    expect([...used].filter((k) => !KO[k])).toEqual([]);
  });
});
