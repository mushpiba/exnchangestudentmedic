// 접수대 질문지에 쓰는 문구. 의원이 고른 것이 링크에 번호로 들어가므로 순서가 주소의 일부다.
// 그래서 줄은 뒤에만 더한다. 사이에 끼우거나 지우면 이미 인쇄한 QR이 다른 질문을 가리킨다.
import type { MessageKey } from "../i18n";

/** 환자가 예·아니요·모름으로 답할 수 있는 것은 "ask", 읽기만 하는 안내는 "tell". */
export type DeskLine = { k: MessageKey; kind: "ask" | "tell" };

export const DESK_GROUPS: { title: string; lines: DeskLine[] }[] = [
  {
    title: "접수",
    lines: [
      { k: "staff.q.firstVisit", kind: "ask" },
      { k: "staff.q.reservation", kind: "ask" },
      { k: "staff.q.insurance", kind: "ask" },
      { k: "staff.q.schoolInsurance", kind: "ask" },
      { k: "staff.q.interpreter", kind: "ask" },
      { k: "staff.q.companion", kind: "ask" },
      { k: "staff.q.koreanFriend", kind: "ask" },
      { k: "staff.q.phone", kind: "tell" },
      { k: "staff.s.showId", kind: "tell" },
      { k: "staff.s.fillForm", kind: "tell" },
      { k: "staff.s.wait", kind: "tell" },
      { k: "staff.s.waitLong", kind: "tell" },
      { k: "staff.s.otherDept", kind: "tell" },
      { k: "staff.s.noInsurance", kind: "tell" },
    ],
  },
  {
    title: "진료 전 확인",
    lines: [
      { k: "staff.q.fever", kind: "ask" },
      { k: "staff.q.worse", kind: "ask" },
      { k: "staff.q.sameBefore", kind: "ask" },
      { k: "staff.q.injured", kind: "ask" },
      { k: "staff.q.canEat", kind: "ask" },
      { k: "staff.q.tookMeds", kind: "ask" },
      { k: "staff.q.regularMeds", kind: "ask" },
      { k: "staff.q.drugAllergy", kind: "ask" },
      { k: "staff.q.chronic", kind: "ask" },
      { k: "staff.q.pregnant", kind: "ask" },
      { k: "staff.q.alcohol", kind: "ask" },
      { k: "staff.q.travel", kind: "ask" },
      { k: "staff.q.breathing", kind: "ask" },
      { k: "staff.q.chestPain", kind: "ask" },
      { k: "staff.q.blood", kind: "ask" },
    ],
  },
  {
    title: "검사 전 확인",
    lines: [
      { k: "staff.q.fasting", kind: "ask" },
      { k: "staff.q.period", kind: "ask" },
      { k: "staff.q.faintedBefore", kind: "ask" },
      { k: "staff.s.urine", kind: "tell" },
      { k: "staff.s.xray", kind: "tell" },
      { k: "staff.s.gown", kind: "tell" },
    ],
  },
  {
    title: "수납·약국 안내",
    lines: [
      { k: "staff.s.pay", kind: "tell" },
      { k: "staff.s.receipt", kind: "tell" },
      { k: "staff.s.prescription", kind: "tell" },
      { k: "staff.s.revisit", kind: "tell" },
      { k: "staff.s.comeBackIf", kind: "tell" },
    ],
  },
];

/** 번호 순서대로 편 목록. 번호가 곧 링크에 들어가는 값이다. */
export const DESK_LINES: DeskLine[] = DESK_GROUPS.flatMap((g) => g.lines);

/** 의원이 아무것도 고르지 않았을 때 쓰는 기본 질문지. */
export const DESK_DEFAULT = [0, 1, 2, 4, 8, 20, 21, 23, 10];

/** 고른 번호를 주소 한 토막으로. 예: [0,2,5] -> "0.2.5" */
export const encodeSheet = (picked: number[]) => [...picked].sort((a, b) => a - b).join(".");

/** 주소 토막을 번호 목록으로. 모르는 번호와 중복은 버린다. */
export function decodeSheet(code: string | undefined): number[] {
  if (!code) return [];
  const seen = new Set<number>();
  for (const part of code.split(".")) {
    const n = Number(part);
    if (Number.isInteger(n) && n >= 0 && n < DESK_LINES.length) seen.add(n);
  }
  return [...seen].sort((a, b) => a - b);
}
