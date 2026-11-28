// 접수대 질문지에 쓰는 문구. 의원이 고른 것이 링크에 번호로 들어가므로 DESK_LINES의 순서가 주소의 일부다.
// 그래서 이 목록은 뒤에만 더한다. 사이에 끼우거나 지우면 이미 인쇄한 QR이 다른 질문을 가리킨다.
// 묶음(DESK_GROUPS)은 번호가 아니라 키를 가리키므로, 다시 묶거나 순서를 바꿔도 인쇄한 QR은 그대로 동작한다.
// 문구는 모두 이미 16개 언어로 번역된 것이라, 여기에 줄을 더해도 번역할 것이 생기지 않는다.
import type { MessageKey } from "../i18n";

/** 환자가 예·아니요·모름으로 답할 수 있는 것은 "ask", 읽기만 하는 안내는 "tell". */
export type DeskLine = { k: MessageKey; kind: "ask" | "tell" };

/** 번호 순서. 뒤에만 더한다. */
export const DESK_LINES: DeskLine[] = [
  // 접수
  { k: "staff.q.firstVisit", kind: "ask" },
  { k: "staff.q.reservation", kind: "ask" },
  { k: "staff.q.insurance", kind: "ask" },
  { k: "staff.s.showId", kind: "tell" },
  { k: "staff.q.phone", kind: "tell" },
  { k: "staff.s.fillForm", kind: "tell" },
  { k: "staff.q.interpreter", kind: "ask" },
  { k: "staff.q.koreanFriend", kind: "ask" },
  { k: "staff.q.companion", kind: "ask" },
  { k: "staff.s.wait", kind: "tell" },
  { k: "staff.s.waitLong", kind: "tell" },
  { k: "staff.s.noInsurance", kind: "tell" },
  { k: "staff.s.otherDept", kind: "tell" },
  // 증상
  { k: "staff.q.point", kind: "tell" },
  { k: "staff.q.fever", kind: "ask" },
  { k: "staff.q.worse", kind: "ask" },
  { k: "staff.q.sameBefore", kind: "ask" },
  { k: "staff.q.injured", kind: "ask" },
  { k: "staff.q.canEat", kind: "ask" },
  { k: "staff.q.breathing", kind: "ask" },
  { k: "staff.q.chestPain", kind: "ask" },
  { k: "staff.q.blood", kind: "ask" },
  // 약·지병
  { k: "staff.q.tookMeds", kind: "ask" },
  { k: "staff.q.takenBefore", kind: "ask" },
  { k: "staff.q.regularMeds", kind: "ask" },
  { k: "staff.q.drugAllergy", kind: "ask" },
  { k: "staff.q.chronic", kind: "ask" },
  { k: "staff.q.pregnant", kind: "ask" },
  { k: "staff.q.alcohol", kind: "ask" },
  { k: "staff.q.travel", kind: "ask" },
  // 진료 안내
  { k: "staff.s.vitals", kind: "tell" },
  { k: "staff.s.goRoom", kind: "tell" },
  { k: "staff.s.tests", kind: "tell" },
  { k: "staff.s.referral", kind: "tell" },
  { k: "staff.s.er", kind: "tell" },
  // 검사
  { k: "staff.q.fasting", kind: "ask" },
  { k: "staff.q.period", kind: "ask" },
  { k: "staff.q.faintedBefore", kind: "ask" },
  { k: "staff.s.bloodTest", kind: "tell" },
  { k: "staff.s.urine", kind: "tell" },
  { k: "staff.s.xray", kind: "tell" },
  { k: "staff.s.gown", kind: "tell" },
  { k: "staff.s.injection", kind: "tell" },
  { k: "staff.s.iv", kind: "tell" },
  { k: "staff.s.results", kind: "tell" },
  // 수납·서류
  { k: "staff.s.pay", kind: "tell" },
  { k: "staff.s.receipt", kind: "tell" },
  { k: "staff.s.prescription", kind: "tell" },
  { k: "staff.s.revisit", kind: "tell" },
  { k: "staff.s.comeBackIf", kind: "tell" },
  // 복약 안내
  { k: "staff.s.afterMeal", kind: "tell" },
  { k: "staff.s.beforeSleep", kind: "tell" },
  { k: "staff.s.asNeeded", kind: "tell" },
  { k: "staff.s.finishAll", kind: "tell" },
  { k: "staff.s.drowsy", kind: "tell" },
  { k: "staff.s.noAlcohol", kind: "tell" },
  { k: "staff.s.external", kind: "tell" },
];

const INDEX = new Map<MessageKey, number>(DESK_LINES.map((l, i) => [l.k, i]));

/** 문구의 번호. 묶음은 이 번호를 거쳐서 줄을 찾는다. */
export const deskIndex = (k: MessageKey) => INDEX.get(k) ?? -1;

/** 접는 묶음. 어느 의원에서 쓰는 것인지 적어 두어, 우리 의원에 없는 묶음은 열지 않아도 되게 한다. */
export const DESK_GROUPS: { title: string; note: string; keys: MessageKey[] }[] = [
  {
    title: "접수",
    note: "어느 의원이든 쓰는 것. 여기만 골라도 질문지는 돌아갑니다.",
    keys: [
      "staff.q.firstVisit",
      "staff.q.reservation",
      "staff.q.insurance",
      "staff.s.showId",
      "staff.q.phone",
      "staff.s.fillForm",
      "staff.q.interpreter",
      "staff.q.koreanFriend",
      "staff.q.companion",
      "staff.s.wait",
      "staff.s.waitLong",
      "staff.s.noInsurance",
      "staff.s.otherDept",
    ],
  },
  {
    title: "증상 묻기",
    note: "접수에서 어느 진료과로 보낼지, 먼저 봐야 하는 환자인지 가릴 때.",
    keys: [
      "staff.q.point",
      "staff.q.fever",
      "staff.q.worse",
      "staff.q.sameBefore",
      "staff.q.injured",
      "staff.q.canEat",
      "staff.q.breathing",
      "staff.q.chestPain",
      "staff.q.blood",
    ],
  },
  {
    title: "약·알레르기·지병",
    note: "처방이 나가는 의원. 문진표에 있는 항목을 환자 언어로 먼저 받아 둡니다.",
    keys: [
      "staff.q.tookMeds",
      "staff.q.takenBefore",
      "staff.q.regularMeds",
      "staff.q.drugAllergy",
      "staff.q.chronic",
      "staff.q.pregnant",
      "staff.q.alcohol",
      "staff.q.travel",
    ],
  },
  {
    title: "진료 안내",
    note: "접수 다음에 무엇이 일어나는지 알려 주는 말. 되묻는 일이 줄어듭니다.",
    keys: ["staff.s.vitals", "staff.s.goRoom", "staff.s.tests", "staff.s.referral", "staff.s.er"],
  },
  {
    title: "검사",
    note: "채혈·소변·엑스레이를 하는 의원만. 안 하는 곳은 이 묶음을 비워 두세요.",
    keys: [
      "staff.q.fasting",
      "staff.q.period",
      "staff.q.faintedBefore",
      "staff.s.bloodTest",
      "staff.s.urine",
      "staff.s.xray",
      "staff.s.gown",
      "staff.s.injection",
      "staff.s.iv",
      "staff.s.results",
    ],
  },
  {
    title: "수납·서류",
    note: "보험금 청구용 영수증과 세부내역서는 유학생이 가장 많이 되묻는 것입니다.",
    keys: ["staff.s.pay", "staff.s.receipt", "staff.s.prescription", "staff.s.revisit", "staff.s.comeBackIf"],
  },
  {
    title: "복약 안내",
    note: "약국과 원내조제를 하는 의원. 복약 안내만 따로 인쇄해 조제실에 둘 수도 있습니다.",
    keys: [
      "staff.s.afterMeal",
      "staff.s.beforeSleep",
      "staff.s.asNeeded",
      "staff.s.finishAll",
      "staff.s.drowsy",
      "staff.s.noAlcohol",
      "staff.s.external",
    ],
  },
];

/** 아무것도 고르지 않았을 때의 기본 질문지. 번호가 아니라 키로 적어, 목록이 길어져도 그대로다. */
export const DESK_DEFAULT = (
  [
    "staff.q.firstVisit",
    "staff.q.reservation",
    "staff.q.insurance",
    "staff.s.showId",
    "staff.q.phone",
    "staff.q.fever",
    "staff.q.worse",
    "staff.q.regularMeds",
    "staff.q.drugAllergy",
    "staff.q.pregnant",
    "staff.s.wait",
    "staff.s.pay",
    "staff.s.prescription",
  ] as MessageKey[]
).map(deskIndex);

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

/** 의원이 직접 적은 줄. 번역해 둘 수가 없으므로 한국어 원문이 그대로 주소에 들어간다. */
export type OwnLine = { kind: "ask" | "tell"; ko: string };

/** QR이 너무 촘촘해지면 인쇄물에서 안 읽힌다. 그래서 길이와 개수를 묶어 둔다. */
export const OWN_MAX = 3;
export const OWN_LEN = 60;

const b64 = {
  to(text: string) {
    const bytes = new TextEncoder().encode(text);
    let raw = "";
    for (const b of bytes) raw += String.fromCharCode(b);
    return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },
  from(code: string) {
    const padded = code.replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    // fatal: 글자가 깨진 채로 보여주느니 통째로 버린다.
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(raw, (c) => c.charCodeAt(0)));
  },
};

/** 직접 적은 줄을 주소 한 토막으로. 한글이 주소에 그대로 들어가면 QR이 길어지므로 base64url로 줄인다. */
export function encodeOwn(lines: OwnLine[]): string {
  const clean = lines.filter((l) => l.ko.trim()).slice(0, OWN_MAX);
  if (!clean.length) return "";
  return b64.to(clean.map((l) => (l.kind === "ask" ? "a|" : "t|") + l.ko.trim().slice(0, OWN_LEN)).join("\n"));
}

/** 주소 토막을 줄 목록으로. 깨진 토막은 통째로 버린다 — 질문 하나가 없는 편이 글자가 깨지는 것보다 낫다. */
export function decodeOwn(code: string | undefined): OwnLine[] {
  if (!code) return [];
  try {
    return b64
      .from(code)
      .split("\n")
      .map((raw) => ({ kind: raw.startsWith("t|") ? ("tell" as const) : ("ask" as const), ko: raw.slice(2).trim() }))
      .filter((l) => l.ko)
      .slice(0, OWN_MAX);
  } catch {
    return [];
  }
}
