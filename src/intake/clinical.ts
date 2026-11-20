// Questions the student is not the right person to answer. The clinician settles them by looking, their
// answer changes neither which department to go to nor how urgent it is, and their options are medical
// classifications rather than words anyone uses about their own body.
//
// Nothing is deleted. src/intake/data/bank.json still carries every question, option, image and branch;
// this list only keeps them off the student's screen (src/intake/sequence.ts), so putting one back is a
// deleted line here. The answers were never collected, so no stored card loses anything either.
//
// What may go on this list:
//   - no question where any option carries a danger level (emergency / urgent / crisis / assault)
//   - no question from the general block (onset, history, allergies, medicines, pregnancy, notes)
//   - only questions whose options are a clinical classification, not everyday description
//
// NOT YET REVIEWED BY A CLINICIAN. The reasons are written out so a reviewer can disagree line by line.
export const CLINIC_ONLY: Record<string, string> = {
  QSWZFA_346: "입술 병변을 융기성·편평·함몰·위축으로 분류. 진찰자가 보고 판단하는 형태 분류다",
  QSWZFA_348: "피부병변을 융기성·편평·함몰·위축으로 분류. 같은 이유",
  QSWZFA_362: "두피 병변을 같은 네 가지로 분류. 같은 이유",
  QSWZFA_349: "색깔만 변한 평평한 병변을 반점(1cm 이하)·반(1cm 이상)으로 나눔. 크기로 가르는 피부과 용어다",
  QTWZFA_001: "융기성 병변을 구진·판·팽진·수포·농포·낭종으로 나눔. 피부과 진찰 소견이다",
  QTWZFA_023: "가피·흉터·켈로이드 중 무엇과 닮았는지. 같은 이유",
  QSZZFA_024: "아픈 치아를 상악좌측제1소구치 같은 32개 이름에서 고르게 한다. 그림도 없고, 치과에서 가리키면 되는 것이다",
  QSZZFA_015: "손 통증 위치를 요측·척측 26개 이름에서 고르게 한다. 그림이 없어 해부학 용어만 남는다",
};

export const isClinicOnly = (qid: string) => qid in CLINIC_ONLY;
