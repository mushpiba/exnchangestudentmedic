import { describe, expect, it } from "vitest";
import { DESK_DEFAULT, DESK_GROUPS, DESK_LINES, OWN_MAX, decodeOwn, decodeSheet, deskIndex, encodeOwn, encodeSheet } from "./desk";

// 번호가 인쇄된 QR 안에 들어 있다. 묶음과 목록이 어긋나면 환자가 다른 질문을 받는다.
describe("desk sheet", () => {
  it("numbers every line once", () => {
    expect(new Set(DESK_LINES.map((l) => l.k)).size).toBe(DESK_LINES.length);
  });

  it("puts every line in exactly one group", () => {
    const grouped = DESK_GROUPS.flatMap((g) => g.keys);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual(DESK_LINES.map((l) => l.k).sort());
  });

  it("finds a line by key", () => {
    for (const g of DESK_GROUPS) for (const k of g.keys) expect(DESK_LINES[deskIndex(k)].k).toBe(k);
  });

  it("starts from a sheet that works", () => {
    expect(DESK_DEFAULT).not.toContain(-1);
    expect(decodeSheet(encodeSheet(DESK_DEFAULT))).toEqual([...DESK_DEFAULT].sort((a, b) => a - b));
  });

  it("drops numbers it does not know", () => {
    expect(decodeSheet("0.0.99999.x.-1.2")).toEqual([0, 2]);
    expect(decodeSheet(undefined)).toEqual([]);
  });
});

describe("the clinic's own lines", () => {
  it("survives the trip through the address", () => {
    const own = [
      { kind: "ask" as const, ko: "치과 보험 적용 전에 스케일링을 받은 적이 있나요?" },
      { kind: "tell" as const, ko: "오늘은 접수가 마감되어 내일 오셔야 합니다." },
    ];
    expect(decodeOwn(encodeOwn(own))).toEqual(own);
  });

  it("keeps the address short enough to print", () => {
    const many = Array.from({ length: 9 }, () => ({ kind: "ask" as const, ko: "가".repeat(200) }));
    const back = decodeOwn(encodeOwn(many));
    expect(back.length).toBe(OWN_MAX);
    expect(back[0].ko.length).toBeLessThanOrEqual(60);
  });

  it("gives up on a broken piece instead of showing broken letters", () => {
    expect(encodeOwn([{ kind: "ask", ko: "   " }])).toBe("");
    expect(decodeOwn("not base64 at all !!")).toEqual([]);
    expect(decodeOwn("YXz_8PDw8A")).toEqual([]); // base64로는 읽히지만 글자가 아니다
    expect(decodeOwn(undefined)).toEqual([]);
  });
});
