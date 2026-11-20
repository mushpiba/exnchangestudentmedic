// What a visit costs a student, worked out from published rates only.
//
// NARU does not know what any clinic will charge. What it does know is the official consultation fee and
// the share of a covered bill the patient pays, both published, both already written out in the guide's
// cost column with their sources. Everything below is arithmetic on those two numbers, so the screen can
// say where each figure came from. It is an order of magnitude, not a bill: tests, injections and
// anything insurance does not cover are not in it, and neither is the emergency room, whose price depends
// on a judgement made at the door.
//
// Sources (same as COLUMN_SOURCES.cost in src/content/guide/index.ts):
//   국민건강보험법 시행령 [별표 2] (2026-10-01 시행) — 본인 부담 비율
//   대한민국 정책브리핑 2026-06-26 — 2026년 의원 초진·재진 진찰료
//   국민건강보험법 시행규칙 [별표 6] — 응급실 경증 본인 부담
export const COSTS_CHECKED = "2026-11-19";

/** 2026 의원 진찰료, 원. The whole fee; the patient pays `SHARE.clinic` of it. */
export const CONSULT = { first: 18840, again: 13370 };

/** 본인 부담 비율. 의원·한의원·치과의원 30%, 병원 40%, 종합병원 50%, 약국 처방 조제 30%. */
export const SHARE = { clinic: 0.3, hospital: 0.4, general: 0.5, pharmacy: 0.3 };

/** 평일 저녁·토요일·공휴일에 기본 진찰료와 조제료에 붙는 가산. */
export const AFTER_HOURS = 0.3;

/** 큰 응급실에서 병원이 경증·비응급(KTAS 4~5)으로 판단했을 때의 본인 부담. */
export const ER_MINOR_SHARE = 0.9;

/** A cold seen at a clinic with three days of medicine: what the student pays with insurance, in won.
 *  The guide's worked example, which assumes common medicine prices on top of the official fees. */
const CLINIC_VISIT_MINE: [number, number] = [8000, 9000];

/** 2026년 유학생 건강보험료, 한 달. 외국인 지역가입자 평균 158,630원에 학생 50% 경감을 적용한 금액. */
export const STUDENT_PREMIUM = 79320;
export const STUDENT_CUT = 0.5;

/** 편의점에서 팔 수 있도록 지정된 안전상비의약품 품목 수 (2026년 11월). */
export const OTC_ITEMS = 13;

/** 119 구급차 요금. 사설 구급차는 요금을 받는다. */
export const AMBULANCE = 0;

/** 의원 초진에서 환자가 내는 돈. 100원 미만은 받지 않는다. */
export const clinicFirstMine = Math.floor((CONSULT.first * SHARE.clinic) / 100) * 100;

export type Visit = { insured: boolean; afterHours: boolean };
export type Estimate = {
  /** [low, high] in won. */
  mine: [number, number];
  total: [number, number];
  insurance: [number, number];
};

const round = (n: number) => Math.round(n / 500) * 500;

/** One clinic visit with the medicine that usually follows it. */
export function estimateVisit({ insured, afterHours }: Visit): Estimate {
  const bump = afterHours ? 1 + AFTER_HOURS : 1;
  // The worked example is the covered share, so the whole bill is that share divided by the rate.
  const total = CLINIC_VISIT_MINE.map((v) => round((v / SHARE.clinic) * bump)) as [number, number];
  const mine = (insured ? CLINIC_VISIT_MINE.map((v) => round(v * bump)) : total) as [number, number];
  const insurance = [total[0] - mine[0], total[1] - mine[1]] as [number, number];
  return { mine, total, insurance };
}
