// NARU's rules on top of the Simtomi intake data. Everything here is NARU's own decision, not Simtomi data.
// Source of each rule: reports/문진데이터_의학점검_2026-11-19.md (section and finding numbers in comments).
// Options are matched by their exact Korean text; the build fails if a match is missing or ambiguous.
//
// Danger levels on an option (shown at once when the option is chosen):
//   emergency: call 119 or go to the emergency room now
//   crisis:    suicide/harm risk: 109 (24h suicide prevention line) or 119
//   assault:   sexual assault support: 1366 / 1577-1366, care within 72 h
//   urgent:    see a doctor today
//   note:      no banner; highlighted for staff on the card

/** Spelling fixes applied to every question and option text (report 4절, E-typos). */
export const TEXT_FIXES = [
  [/됬/g, "됐"], [/몇일/g, "며칠"], [/짠만/g, "짠맛"], [/뒤짚/g, "뒤집"], [/콘텍트/g, "콘택트"],
  [/어번이/g, "이번이"], [/여러움/g, "어려움"], [/윈위/g, "원위"], [/뻗뻗하게/g, "뻣뻣하게"],
  [/쳐해/g, "처해"], [/씹꺼나/g, "씹거나"], [/다이어트을/g, "다이어트를"], [/쎄게/g, "세게"], [/떄/g, "때"],
  // "다음" here is 多飮 (heavy drinking), which translators read as "next".
  [/\(다음\)/g, ""],
];

/**
 * Patches to Simtomi questions. Keys of `o` are exact option texts. An option patch may set:
 *   n: new text, next: follow-up question ids, add: symptom id (turns it into an "add this symptom" option),
 *   level: danger level, drop: true to remove it.
 * `insert` adds options before the named option ("" = at the end). `q` replaces the question text, `t` the type.
 */
export const PATCHES = {
  // E1: cholesterol type offered two anxiety-disorder items.
  QSWZFA_392: {
    o: {
      "애착 대상과 분리될 때 불안 심해짐": { n: "중성지방" },
      "일상생활의 여러 사건에 대해 지나치게 걱정,불안함": { n: "HDL(좋은 콜레스테롤)이 낮음" },
    },
  },
  // E2: "Were you conscious?" whose only tick meant "unconscious".
  QSBZFA_191: {
    q: "발작 중에 의식을 잃었나요? (불러도 반응이 없었나요?) 본 사람이 있으면 그 사람이 답해 주세요.",
    o: { "발작당시 의식없음": { n: "발작 중 의식을 잃음" } },
  },
  // E3: "foot only" pointed back to its own question.
  QSMZFA_296: { o: { "오른쪽 발만 저림": { next: ["QSWZFA_172"] } } },
  QSMZFA_295: { o: { "왼쪽 발만 저림": { next: ["QSWZFA_173"] } } },
  // E6: menarche at 16 or later skipped every follow-up including the pregnancy check.
  QSBFFA_150: {
    t: "M",
    q: "초경(첫 생리)을 했나요?",
    o: {
      "16세전에 초경이 있었음": { n: "만 16세 전에 초경을 했음" },
      "16세까지 초경이 없었음": { n: "만 16세 이후에 초경을 했음", next: ["QSMZFA_069", "QSMZFA_068", "QSMZFA_329", "QDBFFA_135", "QTWZFA_016", "QTWZFA_017"] },
    },
    insert: [{ n: "아직 초경을 하지 않았음" }],
  },
  // E7: "testis" in genital pain did not reach the scrotal-pain questions.
  QSWZFA_138: { o: { "고환": { add: "SSX003" } } },
  // E8: only "both eyes" opened the follow-up; one-sided proptosis is the more worrying pattern.
  QSMZFA_196: {
    o: {
      "오른쪽": { next: ["QSMZFA_195", "QSFZFA_302", "NF_PROPTOSIS"] },
      "왼쪽": { next: ["QSMZFA_195", "QSFZFA_302", "NF_PROPTOSIS"] },
      "양쪽": { next: ["QSMZFA_195", "QSFZFA_302", "NF_PROPTOSIS"] },
    },
  },
  // E9: monocular branch recorded "both eyes".
  QTBZFC_028: { o: { "양안 시력 저하": { n: "복시가 보이는 쪽 눈의 시력이 점점 떨어짐" } } },
  // E10 / C17: haemoptysis amount gated by "frothy"; "vomited blood" was a dead end.
  QSMZFA_029: {
    o: {
      "기침하면서 가래 같이 뱉어짐(피에 거품이 함께 관찰됨)": { n: "기침할 때 가래와 함께 나옴", next: [] },
      "구토하듯 피를 뱉음": { n: "토할 때 피가 나옴", add: "SGI009", level: "emergency" },
    },
  },
  QSMZFA_009: {
    o: {
      "기침하면서 가래 같이 뱉어짐(피에 거품이 함께 관찰됨)": { n: "기침할 때 가래와 함께 나옴", add: "SLR003", level: "urgent" },
    },
  },
  QSMZFA_313: { o: { "붉은색": { n: "붉은색(피가 섞임)", add: "SLR003", level: "urgent" } } },
  // E11: polydipsia threshold 6 L (usual threshold about 3 L).
  QSBZFA_059: { q: "하루에 물이나 음료를 3L(1.5L 병 2개) 넘게 마시나요?" },
  // E12: emergency-contraception bins skipped 5–6 days (120 h cut-off).
  QSMFFA_375: {
    o: {
      "1~2일": { n: "1~3일 (72시간 안)" },
      "2~3일": { drop: true },
      "3~4일": { n: "3~5일 (72~120시간)" },
      "4~5일": { drop: true },
      "6일 이상": { n: "5일(120시간)이 넘음" },
    },
  },
  // E13: overlapping bins.
  QSMZFA_377: {
    o: {
      "수축기 혈압 100이상": { n: "수축기 혈압 100 이상" },
      "수축기 혈압 100~90 사이": { n: "수축기 혈압 90~99" },
      "수축기 혈압 80~90 사이": { n: "수축기 혈압 80~89" },
      "수축기 혈압 80 이하": { n: "수축기 혈압 80 미만", level: "urgent" },
    },
  },
  QSMZFA_300: { o: { "혈당 100 mg/dL 이하": { n: "혈당 100 mg/dL 미만" } } },
  QDMZFA_406: {
    o: {
      "최근 수축기 혈압 100 이하": { n: "최근 수축기 혈압 100 미만" },
      "최근 수축기 혈압 100~120": { n: "최근 수축기 혈압 100~119" },
      "최근 수축기 혈압 121~130": { n: "최근 수축기 혈압 120~129" },
      "최근 수축기 혈압 130~140": { n: "최근 수축기 혈압 130~139" },
      "최근 수축기 혈압 141~150": { n: "최근 수축기 혈압 140~149" },
      "최근 수축기 혈압 151~160": { n: "최근 수축기 혈압 150~159" },
      "최근 수축기 혈압 161~170 이상 된 적 있음": { n: "최근 수축기 혈압 160~169" },
      "최근 수축기 혈압 171~180 이상 된 적 있음": { n: "최근 수축기 혈압 170~179" },
      "최근 수축기 혈압 181~190 이상 된 적 있음": { n: "최근 수축기 혈압 180~189", next: ["NF_HTN"] },
      "최근 수축기 혈압 191~200 이상 된 적 있음": { n: "최근 수축기 혈압 190~199", next: ["NF_HTN"] },
      "최근 수축기 혈압 200 이상 된 적 있음": { n: "최근 수축기 혈압 200 이상", next: ["NF_HTN"] },
    },
  },
  QSMZFA_067: {
    q: "평소 생리는 며칠 동안 하나요?",
    o: { "3일 이내": { n: "1~2일" }, "3~5일": { n: "3~4일" } },
  },
  // E16: voice deepening (virilisation) lumped with acne and hirsutism.
  QTWZFA_017: {
    o: { "목소리가 굵어지고 여드름, 다모증(몸에 털이 과하게 많이 남)이 생김": { n: "여드름이 늘어남" } },
    insert: [
      { before: "얼굴이 화끈거리고, 식은땀이 자주 동반", n: "얼굴이나 몸에 털이 많이 늘어남" },
      { before: "얼굴이 화끈거리고, 식은땀이 자주 동반", n: "목소리가 굵어짐", level: "note" },
    ],
  },
  // E17: black stool vs bright-red blood only; maroon blood missing; amount gated.
  QSBZFA_017: {
    t: "M",
    q: "피나 변의 색이 어떤가요?",
    o: {
      "검은 변": { n: "짜장처럼 검고 끈적한 변" },
      "선홍색 혈변": { n: "선홍색 피(휴지나 변 표면에 묻음)" },
    },
    insert: [{ n: "검붉은 피가 변에 섞여 있음", next: ["QSMZFA_301"], level: "urgent" }],
  },
  // E18: cardiac/respiratory list asked only after "psychological"; night sweats opened nothing.
  QSWZFA_302: { o: { "밤에 식은 땀(야간 발한)": { next: ["NF_TB"] } } },
  // E21: duplicate option.
  QSWZFA_134: { dedupe: true },
  // E23: face-pain follow-up asked about "두통".
  QSBZFA_165: { o: { "찌르는 듯한, 찌릿하는 통증": { next: ["NF_FACEDUR", "NF_FACETRIG"] } } },
  // E24: missing side and missing trigger-finger branch.
  QSZZFA_007: { o: { "발목 뒤": { drop: true } }, insert: [{ n: "오른쪽 발목 뒤" }, { n: "왼쪽 발목 뒤" }] },
  // Exam manoeuvres posed as self-tests (6절 5번): rebound is replaced by a patient-reportable question.
  QSBZFA_016: { o: { "손으로 누르면 통증이 더 심해짐": { next: [] } } },
  QSBZFA_388: { q: "앉을 때 회음부(고환과 항문 사이)가 심하게 아픈가요?", o: { "회음부 눌렀을 때 심한 통증": { n: "앉을 때 회음부가 심하게 아픔" } } },
  QSBZFB_069: { q: "고환을 살짝만 만져도 매우 아픈가요?", o: { "아랫배로 퍼지는 통증": { n: "고환을 살짝만 만져도 매우 아픔" } } },
  // C14: throat foreign body.
  QSMZFA_312: { q: "무엇이 목에 걸렸나요?", insert: [{ before: "해당없음", n: "고기·떡 같은 음식 덩어리" }] },
  // C10: fever + rash opened nothing.
  QSFZFA_005: { o: { "피부 발진": { next: ["NF_RASHPRESS"] } } },
  // C2: no blood in vomit colours.
  QSMZFB_014: {
    insert: [{ before: "해당없음", n: "빨간 피나 커피 찌꺼기 같은 검붉은 것", add: "SGI009", level: "emergency" }],
  },
  // 5절 소화기: bloody diarrhoea.
  QSWZFA_010: { insert: [{ n: "피가 섞인 설사", add: "SGI001", level: "urgent" }] },
  // G1-14: sleep hours stopped at 5–6 h.
  QSMZFA_060: { insert: [{ before: "잘모르겠음", n: "6~7시간 수면" }, { before: "잘모르겠음", n: "7시간 넘게 수면" }] },
  // G1-12: no "talks but confused" level.
  QSMZFA_087: { insert: [{ before: "해당없음", n: "말은 하지만 혼란스럽거나 자꾸 졸려함", level: "emergency" }] },
  // G1-34: cluster headache site.
  QSWZFB_179: { insert: [{ before: "해당없음", n: "눈 주위나 눈 뒤" }] },
  // G1-37: '각성' is jargon.
  QSBZFA_297: {
    q: "충분히 자서 졸리지 않은데도 집중이 잘 안 되나요?",
    o: {
      "각성된 상태에서 집중력저하": { n: "졸리지 않은데도 집중이 안 됨" },
      "집중력저하가 각성유지와 연관됨": { n: "졸리거나 피곤해서 집중이 안 됨" },
    },
  },
  // G4-26: nails were single-choice jargon without a none option; no pigmented band.
  QSMZFA_241: {
    t: "MM",
    insert: [
      { n: "새로 생긴 갈색이나 검은색 세로줄", level: "urgent" },
      { n: "손톱이 살에서 들뜸" },
      { n: "다친 뒤 손톱 밑에 멍" },
      { n: "손톱 주위가 붓고 고름이 남" },
      { n: "해당없음", none: true },
    ],
  },
  QSMZFA_248: {
    t: "MM",
    insert: [
      { n: "새로 생긴 갈색이나 검은색 세로줄", level: "urgent" },
      { n: "발톱이 살에서 들뜸" },
      { n: "다친 뒤 발톱 밑에 멍" },
      { n: "발톱 주위가 붓고 고름이 남" },
      { n: "해당없음", none: true },
    ],
  },
  // Pain scale labels (S type).
  QSSZFA_001: {
    o: {
      vas0: { n: "0 · 아프지 않음" },
      "vas1-3": { n: "1~3 · 약간 아픔" },
      "vas4-5": { n: "4~5 · 꽤 아픔" },
      "vas6-7": { n: "6~7 · 많이 아픔" },
      "vas8-10": { n: "8~10 · 참을 수 없을 만큼 아픔", level: "urgent" },
    },
  },
  // 6절 1번: associated-symptom lists stay inside one organ system. Explicit NARU association rules.
  QSFZFA_002: {
    q: "다음 중 함께 있는 증상을 모두 골라주세요",
    insert: [
      { before: "해당없음", n: "피를 토함", add: "SGI009", level: "emergency" },
      { before: "해당없음", n: "피가 섞인 대변", add: "SGI001", level: "urgent" },
      { before: "해당없음", n: "검은 변", add: "SGI017", level: "urgent" },
    ],
  },
  QSFZFB_001: {
    q: "다음 중 함께 있는 증상을 모두 골라주세요",
    insert: [{ before: "해당없음", n: "기침 시 피섞인 가래", add: "SLR003", level: "urgent" }],
  },
  QSFZFA_006: {
    q: "다음 중 함께 있는 증상을 모두 골라주세요",
    insert: [
      { before: "해당없음", n: "호흡곤란(숨이 참)", add: "SLR002" },
      { before: "해당없음", n: "식은 땀", add: "SED006" },
    ],
  },
  QSFZFA_011: {
    insert: [
      { before: "해당없음", n: "열이 남", add: "SWH005" },
      { before: "해당없음", n: "옆구리 통증", add: "SUU002" },
    ],
  },
  QSFZFA_009: {
    insert: [
      { before: "해당없음", n: "어지러움", add: "SWH008" },
      { before: "해당없음", n: "얼굴 마비", add: "SPN001" },
    ],
  },
  QSFZFA_004: { insert: [{ before: "해당없음", n: "광과민성, 눈", add: "SOP013" }] },
};

/** Symptom-level changes. `start` replaces the start question list. */
export const SYMPTOM_PATCHES = {
  // E5: waking hallucinations got the falling-asleep question.
  SCN016: { start: ["QSMZFB_333", "NF_WAKEHALL", "QSWZFA_354"] },
  SCN017: { start: ["QSMZFB_333", "QSWZFA_355", "QSWZFA_354"] },
  // E10: always ask the haemoptysis amount.
  SLR003: { start: ["QSMZFA_029", "QTMZFA_017", "QSMZFA_315", "QSFZFB_001"] },
  // G2-31: bleeding drug list was borrowed from dizziness.
  SHO002: { start: ["QSWZFA_311", "NF_BLEEDDRUG"] },
  // C11: Prehn self-test removed.
  SSX003: { start: ["QSMZFA_373", "QSBZFA_067", "QSBZFB_069", "QSFZFA_034"] },
  // E18: cardiac/respiratory list for cold sweat always.
  SED006: { start: ["QSWZFA_302", "QSBZFB_307", "QSWZFA_181"] },
  // Empty trees (G1-26, G2-23).
  SAT001: { start: ["NF_CYANOSIS"] },
  SOR011ZZ: { start: ["NF_SALIVA_SRC", "NF_SALIVA_AMT"] },
  // G1-18: weakness vs fatigue.
  SWH002: { start: ["NF_WEAKTYPE", "QSBZFB_031", "QSBZFC_116"] },
  // G1-30: emergency contraception.
  SGY016: { start: ["QSMFFA_375", "QSMFFA_361", "QSMFFA_362", "NF_EC"] },
};

/** Symptom-name corrections in the data's own translations (E26). */
export const NAME_PATCHES = {
  "en-US": { SOR005: "White coating in the mouth", SOP018: "Excessive eye discharge", SDM039: "Facial flushing" },
};

const NONE = { n: "해당없음", none: true };

/** Questions NARU adds. `t`: B (yes item), M (one), MM (several). */
export const NEW_QUESTIONS = {
  NF_ANAPH: {
    t: "MM", q: "지금 다음 중 해당하는 것이 있나요?",
    o: [
      { n: "혀나 목구멍이 붓는 느낌", level: "emergency" },
      { n: "목이 조이거나 목소리가 변함", level: "emergency" },
      { n: "숨쉬기 힘들거나 숨 쉴 때 쌕쌕 소리가 남", level: "emergency" },
      { n: "어지럽거나 쓰러질 것 같음", level: "emergency" },
      NONE,
    ],
  },
  NF_SHOCK: {
    t: "MM", q: "다음 중 해당하는 것이 있나요?",
    o: [
      { n: "일어설 때 어지럽거나 눈앞이 캄캄해짐", level: "emergency" },
      { n: "쓰러졌거나 쓰러질 뻔함", level: "emergency" },
      { n: "가슴이 두근거리거나 숨이 참", level: "emergency" },
      NONE,
    ],
  },
  NF_DEHYD: {
    t: "MM", q: "토하거나 설사하면서 다음 중 해당하는 것이 있나요?",
    o: [
      { n: "물이나 음료를 마셔도 바로 토함", level: "urgent" },
      { n: "소변이 반나절 넘게 안 나오거나 확 줄었음", level: "urgent" },
      { n: "일어설 때 어지럽거나 쓰러질 것 같음", level: "urgent" },
      { n: "입이 바싹 마르고 기운이 없음", level: "note" },
      NONE,
    ],
  },
  NF_CHEST: {
    t: "MM", q: "가슴 통증과 함께 다음 중 해당하는 것이 있나요?",
    o: [
      { n: "몇 초 만에 갑자기 가장 심해짐", level: "emergency" },
      { n: "통증이 팔·턱·목·등으로 퍼짐", level: "emergency" },
      { n: "식은땀이 남", level: "emergency" },
      { n: "숨이 참", level: "emergency" },
      { n: "쓰러질 것 같음", level: "emergency" },
      { n: "메스꺼움이나 구토", level: "urgent" },
      NONE,
    ],
  },
  NF_CLOT: {
    t: "MM", q: "다음 중 해당하는 것이 있나요?",
    o: [
      { n: "한쪽 종아리나 다리가 붓고 아픔", level: "emergency" },
      { n: "최근 4주 안에 4시간 넘게 비행기나 버스로 이동함", level: "note" },
      { n: "최근 3일 넘게 거의 누워 지냄(수술·다침·입원 등)", level: "note" },
      { n: "피임약이나 여성호르몬제를 먹고 있음", level: "note" },
      { n: "혈전(심부정맥혈전증·폐색전증) 진단을 받은 적 있음", level: "note" },
      NONE,
    ],
  },
  NF_LEG_PE: {
    t: "MM", q: "다리 부종과 함께 다음 중 해당하는 것이 있나요?",
    o: [
      { n: "갑자기 숨이 참", level: "emergency" },
      { n: "숨 쉴 때 가슴이 아픔", level: "emergency" },
      { n: "기침에 피가 섞임", level: "emergency" },
      NONE,
    ],
  },
  NF_EDEMA: {
    t: "MM", q: "다리 부종과 관련해 해당하는 것이 있나요?",
    o: [
      { n: "숨이 차거나 누우면 숨이 더 참", level: "urgent" },
      { n: "소변 양이 줄었음", level: "urgent" },
      { n: "아침에 눈꺼풀이나 얼굴이 부음", level: "note" },
      { n: "소변에 거품이 많음", level: "note" },
      NONE,
    ],
  },
  NF_DYSPNEA: {
    t: "MM", q: "숨이 찬 것과 함께 해당하는 것이 있나요?",
    o: [
      { n: "말을 이어서 하기 힘들 만큼 숨이 참", level: "emergency" },
      { n: "입술이나 손끝이 파래짐", level: "emergency" },
      { n: "숨 쉴 때 가슴이 아픔", level: "urgent" },
      { n: "기침에 피가 섞임", level: "urgent" },
      NONE,
    ],
  },
  NF_HEAD: {
    t: "MM", q: "두통과 함께 다음 중 해당하는 것이 있나요?",
    o: [
      { n: "1분 안에 가장 심해진 갑작스러운 두통", level: "emergency" },
      { n: "팔다리 힘이 빠지거나 저림, 말이 어눌함", level: "emergency" },
      { n: "물체가 둘로 보임", level: "emergency" },
      { n: "목이 뻣뻣해서 고개를 숙이기 힘듦", level: "emergency" },
      { n: "정신이 흐리거나 자꾸 처짐", level: "emergency" },
      { n: "지금까지 겪은 것 중 가장 심한 두통", level: "urgent" },
      { n: "기침하거나 힘주거나 몸을 숙일 때 심해짐", level: "urgent" },
      { n: "자다가 깰 만큼 아프거나 아침에 일어날 때 가장 심함", level: "urgent" },
      { n: "며칠에서 몇 주 사이 점점 심해짐", level: "urgent" },
      NONE,
    ],
  },
  NF_MIGRAINE: {
    t: "MM", q: "두통이 있을 때 함께 있는 것을 모두 골라주세요",
    o: [
      { n: "메스꺼움이나 구토" },
      { n: "빛이 거슬림" },
      { n: "소리가 거슬림" },
      { n: "걷거나 계단을 오르는 등 움직이면 더 아픔" },
      NONE,
    ],
  },
  NF_HEADINJ: { t: "B", q: "최근 머리를 다친 적이 있나요?", o: [{ n: "최근 머리를 다침", next: ["NF_HEADINJ2"] }] },
  NF_HEADINJ2: {
    t: "MM", q: "머리를 다친 뒤 다음 중 해당하는 것이 있나요?",
    o: [
      { n: "잠깐이라도 정신을 잃음", level: "emergency" },
      { n: "두 번 넘게 토함", level: "emergency" },
      { n: "다친 전후가 기억나지 않음", level: "emergency" },
      { n: "점점 더 졸리거나 멍해짐", level: "emergency" },
      { n: "경련이 있었음", level: "emergency" },
      { n: "피를 묽게 하는 약을 먹고 있음", level: "urgent" },
      NONE,
    ],
  },
  NF_STROKE: {
    t: "MM", q: "다음 중 갑자기 생긴 것이 있나요?",
    o: [
      { n: "얼굴 한쪽이 처짐", level: "emergency" },
      { n: "한쪽 팔이나 다리에 힘이 빠지거나 감각이 둔함", level: "emergency" },
      { n: "말이 어눌하거나 남의 말을 알아듣기 어려움", level: "emergency" },
      { n: "물체가 둘로 보이거나 한쪽 눈이 안 보임", level: "emergency" },
      { n: "혼자 서거나 걷기 어려움", level: "emergency" },
      { n: "갑자기 생긴 심한 두통이나 뒷목 통증", level: "emergency" },
      NONE,
    ],
  },
  NF_THROAT: {
    t: "MM", q: "목 통증과 함께 다음 중 해당하는 것이 있나요?",
    o: [
      { n: "침도 삼키지 못해 흘림", level: "emergency" },
      { n: "숨 쉴 때 그르렁거리거나 높은 소리가 남", level: "emergency" },
      { n: "입이 잘 벌어지지 않음", level: "urgent" },
      { n: "입에 뜨거운 것을 문 것처럼 목소리가 웅얼거림", level: "urgent" },
      { n: "한쪽 목이나 편도가 심하게 부어오름", level: "urgent" },
      NONE,
    ],
  },
  NF_TONSIL: {
    t: "MM", q: "목 안이나 목 주변에서 확인되는 것을 모두 골라주세요",
    o: [{ n: "거울로 보면 편도에 하얀 점이나 막이 보임" }, { n: "목 앞쪽에 멍울이 있고 만지면 아픔" }, NONE],
  },
  NF_SUICIDE: {
    t: "B", q: "최근 2주 사이에 죽고 싶다는 생각이나 스스로를 해치고 싶은 생각이 든 적이 있나요?",
    o: [{ n: "죽고 싶거나 스스로를 해치고 싶은 생각이 든 적 있음", level: "crisis", next: ["NF_SUICIDE2"] }],
  },
  NF_SUICIDE2: {
    t: "MM", q: "해당하는 것을 모두 골라주세요",
    o: [
      { n: "지금도 그런 생각이 듦", level: "crisis" },
      { n: "구체적인 방법이나 계획을 생각해 봄", level: "crisis" },
      { n: "최근 한 달 안에 실제로 시도함", level: "crisis" },
      NONE,
    ],
  },
  NF_PSYCHOSIS: {
    t: "MM", q: "다음 중 해당하는 것이 있나요?",
    o: [
      { n: "목소리가 무엇을 하라고 시킴", level: "crisis" },
      { n: "다른 사람을 해치고 싶은 생각이 듦", level: "crisis" },
      { n: "증상이 생기기 전 대마나 각성제 같은 약물을 사용함", level: "note" },
      { n: "증상이 생기기 전 새로 먹기 시작한 약이 있음", level: "note" },
      NONE,
    ],
  },
  NF_SUBSTANCE: {
    t: "MM", q: "최근 3개월 사이에 처방 없이 사용한 것이 있나요?",
    o: [
      { n: "대마", level: "note" },
      { n: "각성제나 다른 사람의 ADHD 약", level: "note" },
      { n: "수면제나 진정제", level: "note" },
      { n: "에너지음료(하루 2캔 넘게)", level: "note" },
      { n: "그 밖의 약물", level: "note" },
      NONE,
    ],
  },
  NF_CAUDA: {
    t: "MM", q: "다음 중 해당하는 것이 있나요?",
    o: [
      { n: "엉덩이 사이나 사타구니 감각이 둔함", level: "emergency" },
      { n: "소변이 안 나오거나 모르게 샘", level: "emergency" },
      { n: "대변을 참지 못하거나 모르게 지림", level: "emergency" },
      { n: "양쪽 다리 힘이 점점 빠짐", level: "emergency" },
      NONE,
    ],
  },
  NF_BACKSERIOUS: {
    t: "MM", q: "허리나 등 통증과 함께 해당하는 것이 있나요?",
    o: [
      { n: "밤에 누워 쉬어도 계속 아픔", level: "urgent" },
      { n: "암 진단을 받은 적 있음", level: "urgent" },
      { n: "크게 넘어지거나 부딪힌 뒤 시작됨", level: "urgent" },
      { n: "통증이 엉덩이를 지나 무릎 아래까지 뻗침", level: "note" },
      NONE,
    ],
  },
  NF_FEVER: {
    t: "MM", q: "열과 함께 다음 중 해당하는 것이 있나요?",
    o: [
      { n: "정신이 흐리거나 깨우기 힘듦", level: "emergency" },
      { n: "목이 뻣뻣해서 고개를 숙이기 힘듦", level: "emergency" },
      { n: "눌러도 색이 없어지지 않는 붉거나 보라색 작은 점", level: "emergency" },
      { n: "경련이 있었음", level: "emergency" },
      { n: "숨이 참", level: "urgent" },
      { n: "3일 넘게 열이 계속됨", level: "urgent" },
      NONE,
    ],
  },
  NF_RASHPRESS: {
    t: "B", q: "발진을 투명한 컵으로 눌러 봐도 색이 없어지지 않나요?",
    o: [{ n: "눌러도 색이 없어지지 않음", level: "emergency" }],
  },
  NF_EXPOSURE: {
    t: "MM", q: "최근 3주 안에 해당하는 것이 있나요?",
    o: [
      { n: "풀밭·밭·산에서 야외 활동(등산·캠핑·벌초·농사 등)", level: "note" },
      { n: "진드기에 물림", level: "note" },
      { n: "겨드랑이·사타구니·허리띠 부위에 검은 딱지", level: "note" },
      { n: "경기 북부나 강원 북부에서 모기에 많이 물림", level: "note" },
      NONE,
    ],
  },
  NF_SKIN: {
    t: "MM", q: "피부 증상과 함께 다음 중 해당하는 것이 있나요?",
    o: [
      { n: "열이 나면서 눌러도 색이 없어지지 않는 붉거나 보라색 점", level: "emergency" },
      { n: "입·눈·생식기가 헐거나 물집이 생김", level: "emergency" },
      { n: "피부가 화끈거리고 아프며 넓게 벗겨짐", level: "emergency" },
      { n: "입술·눈·혀가 붓거나 숨쉬기 힘듦", level: "emergency" },
      { n: "몇 시간 사이에 빠르게 번짐", level: "urgent" },
      { n: "최근 2개월 안에 새로 먹기 시작한 약이 있음", level: "note" },
      NONE,
    ],
  },
  NF_SCABIES: {
    t: "B", q: "함께 사는 사람(가족·룸메이트)이나 연인도 비슷하게 가려워하나요?",
    o: [{ n: "주변 사람도 비슷하게 가려워함", level: "note" }],
  },
  NF_TORSION: {
    t: "MM", q: "고환 통증과 함께 다음 중 해당하는 것이 있나요?",
    o: [
      { n: "몇 분 만에 갑자기 심하게 시작됨", level: "emergency" },
      { n: "아파서 자다가 깸", level: "emergency" },
      { n: "메스꺼움이나 구토", level: "emergency" },
      { n: "한쪽 고환이 평소보다 위로 올라가 보임", level: "emergency" },
      NONE,
    ],
  },
  NF_TESTMASS: {
    t: "MM", q: "고환에서 해당하는 것이 있나요?",
    o: [
      { n: "고환 자체에 딱딱한 덩어리가 만져짐", level: "urgent" },
      { n: "아프지 않은데 고환이 커지거나 묵직함", level: "urgent" },
      NONE,
    ],
  },
  NF_LMP: {
    t: "M", q: "마지막 생리가 시작된 날은 언제인가요?",
    o: [{ n: "4주가 안 됨" }, { n: "4~6주 전" }, { n: "6주가 넘음", level: "note" }, { n: "해당없음(초경 전·폐경·임신 중 등)", none: true }],
  },
  NF_LATE: { t: "B", q: "이번 생리가 예정일보다 늦어졌나요?", o: [{ n: "생리가 예정보다 늦어짐", level: "note" }] },
  NF_ECTOPIC: {
    t: "MM", q: "다음 중 해당하는 것이 있나요?",
    o: [
      { n: "1시간 안에 패드가 흠뻑 젖을 만큼 피가 남", level: "emergency" },
      { n: "일어설 때 어지럽거나 쓰러짐", level: "emergency" },
      { n: "한쪽 아랫배가 심하게 아픔", level: "urgent" },
      { n: "어깨 끝이 아픔", level: "urgent" },
      { n: "핏덩이나 조직 같은 것이 나옴", level: "urgent" },
      NONE,
    ],
  },
  NF_HEAVY: {
    t: "MM", q: "생리 양과 관련해 해당하는 것을 골라주세요",
    o: [
      { n: "어지럽거나 쓰러질 것 같음", level: "emergency" },
      { n: "1시간도 안 돼 패드나 탐폰이 흠뻑 젖음", level: "urgent" },
      { n: "500원 동전보다 큰 핏덩이가 나옴", level: "note" },
      { n: "코피·잇몸 출혈이 잦거나 멍이 잘 듦", level: "note" },
      { n: "가족 중 피가 잘 안 멈추는 사람이 있음", level: "note" },
      NONE,
    ],
  },
  NF_DYSMEN: {
    t: "MM", q: "생리통과 관련해 해당하는 것이 있나요?",
    o: [
      { n: "열이 나거나 분비물이 늘고 냄새가 남", level: "urgent" },
      { n: "예전에는 괜찮았는데 최근 점점 심해짐", level: "note" },
      { n: "성관계할 때 깊은 곳이 아픔", level: "note" },
      { n: "생리 때 대변 볼 때 아픔", level: "note" },
      { n: "생리 기간이 아닐 때도 아랫배가 아픔", level: "note" },
      { n: "생리 양이 많거나 생리 사이에 피가 비침", level: "note" },
      { n: "진통제를 먹어도 거의 낫지 않음", level: "note" },
      NONE,
    ],
  },
  NF_ANALSEX: {
    t: "B", q: "증상이 생기기 전에 항문 성관계(받는 쪽)가 있었나요? 답하지 않고 건너뛰어도 됩니다.",
    o: [{ n: "항문 성관계가 있었음", level: "note" }],
  },
  NF_DYSURIA: {
    t: "MM", q: "소변 볼 때 통증과 함께 해당하는 것이 있나요?",
    o: [
      { n: "열이 나거나 몸이 떨림", level: "urgent" },
      { n: "옆구리나 등 아래쪽이 아픔", level: "urgent" },
      { n: "구토", level: "urgent" },
      { n: "질 분비물이 늘었거나 냄새·가려움이 있음", level: "note" },
      { n: "요도에서 고름 같은 분비물이 나옴", level: "note" },
      NONE,
    ],
  },
  NF_HEMATURIA: {
    t: "MM", q: "해당하는 것을 골라주세요",
    o: [
      { n: "운동 뒤 소변이 콜라색이 됨", level: "urgent" },
      { n: "목감기나 인후통이 있는 중이거나 그 뒤 1~3일 안에 시작됨", level: "note" },
      { n: "목감기를 앓고 1~3주 뒤에 시작됨", level: "note" },
      { n: "지금 생리 중임", level: "note" },
      { n: "얼굴이나 다리가 붓거나 소변 거품이 많음", level: "note" },
      NONE,
    ],
  },
  NF_RHABDO: {
    t: "B", q: "운동이나 더운 곳에서 일한 뒤 소변이 콜라나 진한 갈색처럼 변했나요?",
    o: [{ n: "소변이 콜라색이나 진한 갈색으로 변함", level: "emergency" }],
  },
  NF_CALF: {
    t: "MM", q: "다리 통증과 함께 해당하는 것이 있나요?",
    o: [
      { n: "다친 뒤 통증이 점점 심해지고 터질 듯 팽팽함", level: "emergency" },
      { n: "갑자기 숨이 차거나 숨 쉴 때 가슴이 아픔", level: "emergency" },
      { n: "아픈 다리가 반대쪽보다 붓거나 단단함", level: "urgent" },
      { n: "빨갛고 뜨거움", level: "urgent" },
      NONE,
    ],
  },
  NF_JOINT: {
    t: "MM", q: "관절이나 팔다리 통증과 함께 해당하는 것이 있나요?",
    o: [
      { n: "38도 넘는 열이나 오한", level: "urgent" },
      { n: "다친 뒤 모양이 이상하거나 전혀 움직일 수 없음", level: "urgent" },
      { n: "관절이 붓고 빨갛거나 뜨거움", level: "note" },
      { n: "다친 적 없이 하루 이틀 사이 갑자기 붓고 아파짐", level: "note" },
      { n: "아침에 뻣뻣함이 1시간 넘게 감", level: "note" },
      NONE,
    ],
  },
  NF_DKA: {
    t: "MM", q: "다음 중 해당하는 것이 있나요?",
    o: [
      { n: "구토나 배 아픔", level: "emergency" },
      { n: "숨을 깊고 빠르게 쉼", level: "emergency" },
      { n: "많이 처지고 졸림", level: "emergency" },
      { n: "이유 없이 체중이 줄었음", level: "urgent" },
      { n: "밤에 소변 때문에 두 번 넘게 깸", level: "note" },
      NONE,
    ],
  },
  NF_BURN_SIZE: {
    t: "M", q: "화상 넓이가 본인 손바닥 몇 개 정도인가요?",
    o: [{ n: "손바닥 1개보다 작음" }, { n: "손바닥 1~3개" }, { n: "손바닥 3~10개", level: "emergency" }, { n: "손바닥 10개보다 큼", level: "emergency" }],
  },
  NF_BURN_FLAGS: {
    t: "MM", q: "화상과 관련해 해당하는 것이 있나요?",
    o: [
      { n: "밀폐된 곳에서 연기를 마심", level: "emergency" },
      { n: "목소리가 쉬거나 숨쉬기 힘듦", level: "emergency" },
      { n: "전기나 번개에 의한 화상", level: "emergency" },
      { n: "얼굴·손·발·생식기·관절 부위의 화상", level: "urgent" },
      { n: "화학물질에 의한 화상", level: "urgent" },
      NONE,
    ],
  },
  NF_SEIZURE: {
    t: "MM", q: "발작과 관련해 해당하는 것이 있나요?",
    o: [
      { n: "5분 넘게 계속됨", level: "emergency" },
      { n: "깨어나기 전에 다시 발작함", level: "emergency" },
      { n: "넘어지며 머리를 다침", level: "emergency" },
      { n: "임신 중임", level: "emergency" },
      { n: "처음 있는 발작임", level: "urgent" },
      { n: "혀를 깨물었음", level: "note" },
      { n: "깨어난 뒤 한참 동안 멍하거나 혼란스러웠음", level: "note" },
      NONE,
    ],
  },
  NF_FAINT: {
    t: "MM", q: "쓰러진 것과 관련해 해당하는 것이 있나요?",
    o: [
      { n: "쓰러지기 직전 가슴이 두근거림", level: "emergency" },
      { n: "쓰러지기 직전 가슴이 아팠음", level: "emergency" },
      { n: "운동 중이나 누워 있을 때 쓰러짐", level: "emergency" },
      { n: "가족 중 젊은 나이에 갑자기 사망한 사람이 있음", level: "urgent" },
      { n: "혀를 깨물었거나 깨어난 뒤 한참 혼란스러웠음", level: "urgent" },
      { n: "쓰러지며 다침", level: "urgent" },
      { n: "1분 넘게 의식이 없었음", level: "urgent" },
      NONE,
    ],
  },
  NF_PALP: {
    t: "MM", q: "두근거림과 관련해 해당하는 것을 골라주세요",
    o: [
      { n: "쓰러졌거나 쓰러질 뻔함", level: "emergency" },
      { n: "가슴 통증이 함께 있음", level: "emergency" },
      { n: "숨이 참", level: "urgent" },
      { n: "운동 중에 생김", level: "urgent" },
      { n: "갑자기 시작해서 갑자기 멈춤", level: "note" },
      { n: "박동이 불규칙함", level: "note" },
      { n: "커피나 에너지음료를 많이 마신 뒤 생김", level: "note" },
      NONE,
    ],
  },
  NF_FB_THROAT: {
    t: "MM", q: "지금 다음 중 해당하는 것이 있나요?",
    o: [
      { n: "침도 삼키기 어렵거나 침을 흘림", level: "emergency" },
      { n: "숨쉬기 힘들거나 기침이 멈추지 않음", level: "emergency" },
      { n: "가슴이 아프거나 토함", level: "emergency" },
      NONE,
    ],
  },
  NF_RETINA: {
    t: "MM", q: "다음 중 해당하는 것이 있나요?",
    o: [
      { n: "번쩍이는 빛이 보임", level: "urgent" },
      { n: "떠다니는 것이 갑자기 많이 늘어남", level: "urgent" },
      { n: "시야 일부가 커튼이나 그림자로 가려짐", level: "urgent" },
      { n: "시력이 떨어짐", level: "urgent" },
      NONE,
    ],
  },
  NF_EYE: {
    t: "MM", q: "눈 증상과 관련해 해당하는 것이 있나요?",
    o: [
      { n: "세제나 약품 같은 화학물질이 눈에 들어감", level: "emergency" },
      { n: "눈을 맞거나 찔림", level: "urgent" },
      { n: "시력이 떨어짐", level: "urgent" },
      { n: "빛을 보면 눈이 아파 뜨기 힘듦", level: "urgent" },
      { n: "콘택트렌즈를 끼고 있음", level: "note" },
      NONE,
    ],
  },
  NF_DIPLOPIA: {
    t: "MM", q: "다음 중 해당하는 것이 있나요?",
    o: [
      { n: "두통이나 눈 주위 통증이 함께 있음", level: "emergency" },
      { n: "한쪽 눈동자가 더 커 보임", level: "emergency" },
      { n: "얼굴·팔다리 힘 빠짐, 말 어눌함, 삼키기 어려움", level: "emergency" },
      { n: "눈꺼풀이 처지고 물체가 둘로 보임", level: "urgent" },
      { n: "시력이 떨어짐", level: "urgent" },
      NONE,
    ],
  },
  NF_PROPTOSIS: {
    t: "MM", q: "눈이 튀어나온 것과 함께 해당하는 것이 있나요?",
    o: [
      { n: "눈 주위가 붓고 빨갛고 아프며 열이 남", level: "emergency" },
      { n: "물체가 둘로 보임", level: "urgent" },
      { n: "시력이 떨어짐", level: "urgent" },
      NONE,
    ],
  },
  NF_EYEBLEED: {
    t: "MM", q: "눈 출혈과 관련해 해당하는 것이 있나요?",
    o: [
      { n: "눈을 맞거나 다침", level: "urgent" },
      { n: "시력이 떨어지거나 뿌옇게 보임", level: "urgent" },
      { n: "검은자 앞에 피가 고여 보임", level: "urgent" },
      { n: "눈이 아픔", level: "urgent" },
      { n: "피를 묽게 하는 약을 먹고 있음", level: "note" },
      NONE,
    ],
  },
  NF_EAR: {
    t: "MM", q: "귀 증상과 함께 해당하는 것이 있나요?",
    o: [
      { n: "머리를 다친 뒤 귀에서 피나 맑은 물이 나옴", level: "emergency" },
      { n: "3일 안에 갑자기 한쪽 귀가 잘 안 들리게 됨", level: "urgent" },
      { n: "얼굴 한쪽이 처지거나 움직이기 어려움", level: "urgent" },
      { n: "귀 안이나 주변에 물집이 생김", level: "urgent" },
      { n: "심하게 어지럽거나 빙빙 돎", level: "urgent" },
      { n: "귀 뒤가 붓고 빨갛고 아픔", level: "urgent" },
      NONE,
    ],
  },
  NF_DENTAL: {
    t: "MM", q: "다음 중 해당하는 것이 있나요?",
    o: [
      { n: "침을 삼키거나 숨쉬기 힘듦", level: "emergency" },
      { n: "혀 밑이 부어 혀가 들림", level: "emergency" },
      { n: "얼굴이나 턱 밑이 부음", level: "urgent" },
      { n: "입이 잘 벌어지지 않음", level: "urgent" },
      { n: "열이 남", level: "urgent" },
      NONE,
    ],
  },
  NF_JAUNDICE: {
    t: "MM", q: "다음 중 해당하는 것이 있나요?",
    o: [
      { n: "정신이 흐리거나 자꾸 졸림", level: "emergency" },
      { n: "열이 나거나 몸이 떨림", level: "urgent" },
      { n: "오른쪽 윗배가 심하게 아픔", level: "urgent" },
      { n: "멍이나 출혈이 잘 생김", level: "urgent" },
      { n: "해열진통제(타이레놀 등)를 많이 먹음", level: "urgent" },
      { n: "최근 2~6주 안에 날것이나 덜 익힌 조개를 먹음", level: "note" },
      NONE,
    ],
  },
  NF_ABD: {
    t: "MM", q: "배 아픔과 함께 해당하는 것이 있나요?",
    o: [
      { n: "토한 것이 초록색이거나 대변 냄새가 남", level: "emergency" },
      { n: "배가 딱딱하게 굳고 살짝 만져도 아픔", level: "emergency" },
      { n: "걷거나 기침하거나 차가 덜컹거릴 때 배가 울리듯 더 아픔", level: "urgent" },
      { n: "방귀나 대변이 전혀 나오지 않음", level: "urgent" },
      { n: "배꼽 주변에서 시작해 오른쪽 아랫배로 옮겨 감", level: "urgent" },
      NONE,
    ],
  },
  NF_DYSPEPSIA: {
    t: "MM", q: "다음 중 해당하는 것이 있나요?",
    o: [
      { n: "피를 토하거나 검은 변·피가 섞인 변을 봄", level: "emergency" },
      { n: "삼키기 어렵거나 삼킬 때 아픔", level: "urgent" },
      { n: "토하는 일이 반복됨", level: "urgent" },
      { n: "이유 없이 체중이 줄었음", level: "urgent" },
      { n: "눈이나 피부가 노래짐", level: "urgent" },
      NONE,
    ],
  },
  NF_COUGH: {
    t: "MM", q: "기침과 관련해 해당하는 것을 골라주세요",
    o: [
      { n: "숨이 차서 말하기 힘듦", level: "emergency" },
      { n: "기침에 피가 섞임", add: "SLR003", level: "urgent" },
      { n: "최근 1년 안에 결핵 환자와 가까이 지냄", level: "urgent" },
      { n: "3주 넘게 계속됨", level: "note" },
      { n: "몰아서 하는 기침이 멈추지 않거나 기침 끝에 '흡' 소리가 남", level: "note" },
      { n: "기침하다가 토함", level: "note" },
      { n: "밤에 식은땀이 나거나 이유 없이 체중이 줄었음", level: "note" },
      NONE,
    ],
  },
  NF_TB: {
    t: "MM", q: "해당하는 것이 있나요?",
    o: [
      { n: "최근 1년 안에 결핵 환자와 가까이 지냄", level: "urgent" },
      { n: "2주 넘게 기침이 계속됨", level: "note" },
      { n: "밤에 식은땀이 남", level: "note" },
      { n: "이유 없이 체중이 줄었음", level: "note" },
      NONE,
    ],
  },
  NF_EPISTAXIS: {
    t: "MM", q: "코피와 관련해 해당하는 것이 있나요?",
    o: [
      { n: "20분 넘게 꽉 눌러도 멈추지 않음", level: "emergency" },
      { n: "피가 목 뒤로 많이 넘어감", level: "urgent" },
      { n: "머리를 다친 뒤 생김", level: "urgent" },
      { n: "피를 묽게 하는 약을 먹고 있음", level: "note" },
      NONE,
    ],
  },
  NF_HTN: {
    t: "MM", q: "지금 다음 중 해당하는 것이 있나요?",
    o: [
      { n: "가슴 통증", level: "emergency" },
      { n: "한쪽 팔다리 힘 빠짐이나 말 어눌함", level: "emergency" },
      { n: "심한 두통", level: "urgent" },
      { n: "시야가 흐리거나 이상함", level: "urgent" },
      { n: "숨이 참", level: "urgent" },
      NONE,
    ],
  },
  NF_HYPOTENSION: {
    t: "MM", q: "다음 중 해당하는 것이 있나요?",
    o: [
      { n: "쓰러졌거나 쓰러질 것 같음", level: "emergency" },
      { n: "식은땀이 나고 피부가 차가움", level: "emergency" },
      { n: "가슴 통증이나 숨이 참", level: "emergency" },
      { n: "정신이 흐림", level: "emergency" },
      { n: "최근 구토·설사·검은 변·생리 과다가 있음", level: "urgent" },
      { n: "원래 늘 혈압이 낮았음", level: "note" },
      NONE,
    ],
  },
  NF_RIB: {
    t: "MM", q: "갈비뼈 부위 통증과 함께 해당하는 것이 있나요?",
    o: [
      { n: "숨이 차거나 숨쉬기 힘듦", level: "emergency" },
      { n: "크게 부딪히거나 넘어진 뒤 시작됨", level: "urgent" },
      { n: "갑자기 시작됨", level: "note" },
      NONE,
    ],
  },
  NF_NECK: {
    t: "MM", q: "목 통증과 함께 해당하는 것이 있나요?",
    o: [
      { n: "열과 함께 목이 뻣뻣해서 고개를 숙이기 힘듦", level: "emergency" },
      { n: "소변이나 대변 조절이 어려움", level: "emergency" },
      { n: "팔에 힘이 빠짐", level: "urgent" },
      { n: "크게 다친 뒤 시작됨", level: "urgent" },
      { n: "이유 없이 체중이 줄었음", level: "note" },
      NONE,
    ],
  },
  NF_WEAKTYPE: {
    t: "M", q: "기운이 없는 것이 다음 중 어디에 가까운가요?",
    o: [{ n: "실제로 힘이 빠져 물건 들기·계단 오르기·일어서기가 어려움", level: "urgent" }, { n: "힘은 있지만 기운이 없고 쉽게 지침" }],
  },
  NF_HYPERVENT: {
    t: "MM", q: "숨이 가쁜 것과 함께 해당하는 것이 있나요?",
    o: [
      { n: "가슴 통증", level: "emergency" },
      { n: "약이나 다른 물질을 많이 먹음", level: "emergency" },
      { n: "심한 갈증과 소변이 많아짐", level: "urgent" },
      { n: "열이나 기침", level: "note" },
      { n: "손발이나 입 주위가 저림", level: "note" },
      NONE,
    ],
  },
  NF_FACEDUR: {
    t: "M", q: "얼굴 통증이 한 번 생기면 얼마나 지속되나요?",
    o: [{ n: "몇 초" }, { n: "몇 분" }, { n: "몇 시간" }, { n: "며칠" }],
  },
  NF_FACETRIG: {
    t: "B", q: "세수·양치·면도·바람·씹기·말하기로 얼굴 통증이 생기나요?",
    o: [{ n: "얼굴을 건드리거나 움직일 때 통증이 생김", level: "note" }],
  },
  NF_FACEPALSY: {
    t: "MM", q: "얼굴 마비와 관련해 해당하는 것이 있나요?",
    o: [
      { n: "몇 주에 걸쳐 서서히 심해짐", level: "urgent" },
      { n: "귀 안이나 주변에 물집이 생김", level: "urgent" },
      { n: "심한 귀 통증이나 잘 안 들림", level: "urgent" },
      { n: "3일 안에 갑자기 가장 심해짐", level: "note" },
      NONE,
    ],
  },
  NF_WAKEHALL: {
    t: "MM", q: "잠에서 깰 때 어떤 환각이 느껴지나요?",
    o: [{ n: "무언가 보임" }, { n: "무언가 들림" }, { n: "몸에 무언가 느껴짐" }, NONE],
  },
  NF_SALIVA_SRC: {
    t: "M", q: "피가 어디에서 나오는 것 같나요?",
    o: [
      { n: "잇몸이나 입안" },
      { n: "코 뒤에서 넘어옴", add: "SUR011" },
      { n: "기침할 때 가래와 함께", add: "SLR003", level: "urgent" },
      { n: "토할 때", add: "SGI009", level: "emergency" },
    ],
  },
  NF_SALIVA_AMT: {
    t: "M", q: "피의 양은 어느 정도인가요?",
    o: [{ n: "침에 실처럼 섞임" }, { n: "한 숟가락 정도" }, { n: "그보다 많음", level: "emergency" }],
  },
  NF_CYANOSIS: {
    t: "MM", q: "손발이 파래지는 것과 함께 해당하는 것이 있나요?",
    o: [
      { n: "입술이나 혀도 파래짐", level: "emergency" },
      { n: "숨이 참", level: "emergency" },
      { n: "한쪽 손이나 발만 차갑고 창백하며 아픔", level: "emergency" },
      { n: "추울 때만 생김", level: "note" },
      { n: "손가락이 하얗게 됐다가 파랗게, 다시 빨갛게 변함", level: "note" },
      NONE,
    ],
  },
  NF_BLEEDTEND: {
    t: "MM", q: "피가 잘 나는 것과 관련해 해당하는 것이 있나요?",
    o: [
      { n: "피부에 바늘 끝 같은 붉은 점이 생김", level: "urgent" },
      { n: "최근 열이 나거나 몹시 피곤하거나 창백해짐", level: "urgent" },
      { n: "이를 뽑거나 수술한 뒤 피가 오래 멈추지 않은 적 있음", level: "note" },
      { n: "가족 중 피가 잘 안 멈추는 사람이 있음", level: "note" },
      { n: "코피나 잇몸 출혈이 잦거나 생리 양이 많음", level: "note" },
      NONE,
    ],
  },
  NF_BLEEDDRUG: {
    t: "MM", q: "먹고 있는 약이나 보충제가 있으면 모두 골라주세요",
    o: [
      { n: "아스피린" }, { n: "이부프로펜 같은 소염진통제" }, { n: "피를 묽게 하는 약(항응고제·항혈소판제)" },
      { n: "항우울제" }, { n: "스테로이드" }, { n: "오메가3나 은행잎 같은 보충제" }, NONE,
    ],
  },
  NF_WEIGHTLOSS: {
    t: "MM", q: "체중 감소와 함께 해당하는 것이 있나요?",
    o: [
      { n: "목이 자주 마르고 소변이 많아짐", level: "urgent" },
      { n: "더위를 못 참고 가슴이 두근거리거나 손이 떨림", level: "note" },
      { n: "열·밤 식은땀·2주 넘는 기침", level: "note" },
      { n: "설사·배 아픔·구토", level: "note" },
      { n: "살이 찔까 봐 일부러 굶거나 토함", level: "note" },
      NONE,
    ],
  },
  NF_EATING: {
    t: "MM", q: "먹는 것과 관련해 해당하는 것이 있나요?",
    o: [
      { n: "최근 3개월 사이 6kg 넘게 빠짐", level: "urgent" },
      { n: "어지럽거나 쓰러질 것 같음", level: "urgent" },
      { n: "살이 찔까 봐 일부러 토하거나 변비약·이뇨제를 씀", level: "note" },
      { n: "먹는 양을 스스로 조절할 수 없다고 느낌", level: "note" },
      { n: "생리가 3개월 넘게 없음", level: "note" },
      NONE,
    ],
  },
  NF_SLEEP: {
    t: "MM", q: "잠과 관련해 해당하는 것을 골라주세요",
    o: [
      { n: "자다가 자주 깨서 30분 넘게 다시 잠들지 못함" },
      { n: "원하는 시간보다 2시간 넘게 일찍 깸" },
      { n: "새벽 2시가 지나서야 잠들고 늦게 일어남" },
      { n: "오후나 저녁에 커피나 에너지음료를 마심" },
      NONE,
    ],
  },
  NF_HOARSE: {
    t: "MM", q: "쉰 목소리와 함께 해당하는 것이 있나요?",
    o: [
      { n: "숨 쉴 때 그르렁거리거나 높은 소리가 남", level: "emergency" },
      { n: "삼키기 어렵거나 삼킬 때 아픔", level: "urgent" },
      { n: "목에 혹이 만져짐", level: "urgent" },
      { n: "3주 넘게 계속됨", level: "note" },
      { n: "이유 없이 체중이 줄었음", level: "note" },
      NONE,
    ],
  },
  NF_ORALULCER: {
    t: "MM", q: "입안 궤양과 관련해 해당하는 것이 있나요?",
    o: [
      { n: "2주 넘게 낫지 않음", level: "note" },
      { n: "생식기에도 궤양이 있음", level: "note" },
      { n: "열·몸살·발진이 함께 있음", level: "note" },
      { n: "눈이 충혈되거나 아픔", level: "note" },
      NONE,
    ],
  },
  NF_PERINEAL: {
    t: "MM", q: "회음부 통증과 함께 해당하는 것이 있나요?",
    o: [{ n: "열이나 오한", level: "urgent" }, { n: "소변이 잘 안 나오거나 전혀 안 나옴", level: "urgent" }, NONE],
  },
  NF_NIPPLE: {
    t: "M", q: "유두가 원래(사춘기부터) 들어가 있었나요, 최근에 새로 들어갔나요?",
    o: [{ n: "원래부터 유두가 들어가 있었음" }, { n: "최근에 유두가 새로 들어감", level: "urgent" }],
  },
  NF_ED: { t: "B", q: "아침이나 자다 깼을 때 발기가 되나요?", o: [{ n: "아침 발기가 있음", level: "note" }] },
  NF_THYROID: {
    t: "MM", q: "목 앞쪽 혹과 관련해 해당하는 것이 있나요?",
    o: [
      { n: "목소리가 쉬거나 삼키기·숨쉬기가 불편함", level: "urgent" },
      { n: "빠르게 커짐", level: "urgent" },
      { n: "어릴 때 머리나 목에 방사선 치료를 받은 적 있음", level: "note" },
      { n: "가족 중 갑상선암이 있음", level: "note" },
      NONE,
    ],
  },
  NF_TREMOR: {
    t: "MM", q: "떨림과 관련해 해당하는 것이 있나요?",
    o: [
      { n: "더위를 못 참고 체중이 줄거나 가슴이 두근거림", level: "note" },
      { n: "가족 중 손떨림이 있는 사람이 있음", level: "note" },
      { n: "술을 마시면 떨림이 줄어듦", level: "note" },
      { n: "ADHD 약·천식 흡입제·에너지음료를 사용함", level: "note" },
      NONE,
    ],
  },
  NF_DYSPHAGIA: {
    t: "MM", q: "삼키기 어려운 것과 관련해 해당하는 것이 있나요?",
    o: [
      { n: "지금 음식이 걸려 침이나 물도 삼키기 어려움", level: "emergency" },
      { n: "이유 없이 체중이 줄었음", level: "urgent" },
      { n: "삼킬 때 아픔", level: "note" },
      NONE,
    ],
  },
  NF_EC: {
    t: "MM", q: "해당하는 것이 있나요? 답하지 않고 건너뛰어도 됩니다.",
    o: [
      { n: "원하지 않거나 강요된 성관계였음", level: "assault" },
      { n: "성병·HIV 검사나 예방약 상담을 원함", level: "note" },
      { n: "이번 생리 주기에 피임 없이 한 다른 성관계가 있음", level: "note" },
      NONE,
    ],
  },
};

/** Red-flag questions per symptom. They are asked right after the symptom's first question. */
export const RED_FLAGS = (() => {
  const map = {};
  const on = (ids, ...qs) => ids.split(/\s+/).forEach((id) => (map[id] = [...(map[id] ?? []), ...qs]));
  on("SDM005 SOR007 SLR001 SOP002", "NF_ANAPH");
  on("SGI001 SGI017 SGI009", "NF_SHOCK");
  on("SGI010 SGI004 SGI011", "NF_DEHYD");
  on("SCV004 SCV005", "NF_CHEST", "NF_CLOT");
  on("SLR002", "NF_DYSPNEA", "NF_ANAPH", "NF_CLOT");
  on("SWH014", "NF_LEG_PE", "NF_EDEMA");
  on("SWH001", "NF_HEAD", "NF_MIGRAINE", "NF_HEADINJ");
  on("SWH008", "NF_STROKE", "NF_HEADINJ");
  on("SMS022 SPN006 SMS021 SPN008 SCN005 SCN003 SWH002", "NF_STROKE");
  on("SPN009", "NF_STROKE", "NF_CAUDA");
  on("SPN001", "NF_STROKE", "NF_FACEPALSY");
  on("SCN006", "NF_DYSPHAGIA", "NF_STROKE");
  on("SUR004", "NF_THROAT", "NF_TONSIL");
  on("SUR002", "NF_HOARSE");
  on("SPY014 SPY009 SPY008 SPY007 SPY010 SPY011 SWH006", "NF_SUICIDE");
  on("SPY005", "NF_SUICIDE", "NF_PSYCHOSIS");
  on("SPY009 SPY008 SPY007 SCV003 SCN010 SCN012", "NF_SUBSTANCE");
  on("SMS010 SMS011", "NF_CAUDA", "NF_BACKSERIOUS");
  on("SMS009 SMS008 SMS030 SPN007 SMS023 SLU005 SLU006", "NF_CAUDA");
  on("SWH005 SWH003", "NF_FEVER", "NF_EXPOSURE");
  on("SDM007 SDM008 SDM011 SDM012 SDM013 SDM014 SDM015 SDM016 SDM017 SDM018 SDM019 SDM020 SDM021 SDM023 SDM024 SDM025 SDM028 SDM029 SSX011 SGY011 SDM005", "NF_SKIN");
  on("SDM007 SDM016 SDM017 SDM019 SDM021 SDM028 SDM029 SSX011 SGY011", "NF_SCABIES");
  on("SSX003 SSX004", "NF_TORSION", "NF_TESTMASS");
  on("SGY003", "NF_LMP", "NF_LATE", "NF_ECTOPIC");
  on("SGI008 SLU003", "NF_LMP", "NF_ECTOPIC");
  on("SGY006 SGY007", "NF_LMP", "NF_LATE");
  on("SGY006", "NF_DYSMEN");
  on("SGY008", "NF_HEAVY");
  on("SAT002 SAT005", "NF_ANALSEX");
  on("SLU004 SLU009 SLU010 SLU012 SLU007", "NF_DYSURIA");
  on("SUU001", "NF_HEMATURIA");
  on("SWH007 SMS025 SMS026 SMS027 SMS028", "NF_RHABDO");
  on("SMS005 SMS007", "NF_CALF", "NF_RHABDO");
  on("SMS002 SMS003 SMS004 SMS006 SMS012 SMS013 SMS014 SMS015 SMS016 SMS017 SMS029ZZ SMS030", "NF_JOINT");
  on("SED007 SED008 SED009 SED010", "NF_DKA");
  on("SDM032", "NF_BURN_SIZE", "NF_BURN_FLAGS");
  on("SCN012", "NF_SEIZURE");
  on("SCV006 SWH013", "NF_FAINT");
  on("SCV003", "NF_PALP");
  on("SUR008", "NF_FB_THROAT");
  on("SOP007", "NF_RETINA");
  on("SOP022 SOP019 SOP020 SOP021", "NF_EYE");
  on("SOP008 SOP004", "NF_DIPLOPIA");
  on("SOP024", "NF_EYEBLEED");
  on("SEA001 SEA002 SEA003 SEA004 SEA006 SEA007", "NF_EAR");
  on("SDT001 SDT003 SDT005 SDT006 SOR009 SOR010", "NF_DENTAL");
  on("SGI027 SGI015 SUU004 SGI003", "NF_JAUNDICE");
  on("SGI008", "NF_ABD");
  on("SGI007 SGI013 SGI012 SGI005", "NF_DYSPEPSIA");
  on("SUR010 SUR009", "NF_COUGH");
  on("SLR003 SLY001 SWH011", "NF_TB");
  on("SUR011", "NF_EPISTAXIS");
  on("SCV009", "NF_HTN");
  on("SCV008", "NF_HYPOTENSION");
  on("SMS024", "NF_RIB");
  on("SMS018", "NF_NECK");
  on("SPY015", "NF_HYPERVENT");
  on("SWH011", "NF_WEIGHTLOSS");
  on("SPY010 SWH012", "NF_EATING");
  on("SPY007", "NF_SLEEP");
  on("SOR008", "NF_ORALULCER");
  on("SSX012", "NF_PERINEAL");
  on("SBR004", "NF_NIPPLE");
  on("SSX005", "NF_ED");
  on("SED003", "NF_THYROID");
  on("SCN010", "NF_TREMOR");
  on("SHO001 SHO002 SDT007", "NF_BLEEDTEND");
  // Sexual history (Simtomi's own questions), attached where the audit found it missing (P1-17, G3-12, G3-21).
  on("SGY001 SGY002 SGY004 SGY010 SSX002 SSX003 SSX004 SSX007 SSX009", "QDMZFA_087");
  return map;
})();

/** Danger levels on existing Simtomi options (report 3절). */
export const MARKS = {
  QSBZFA_027: { "의식이 지속적으로 저하됨": "emergency" },
  QSMZFA_087: { "세게 꼬집으면 팔이나 다리는 움직이나 의사소통안됨": "emergency", "세게 꼬집어도 반응이 없음": "emergency", "자발적으로 소리내나 질문에 맞지 않는 소리를 냄": "emergency" },
  QTMZFA_017: { "가래 전체가 붉은 피인 정도": "urgent", "기침 시 대량으로 피를 쏟는 정도": "emergency" },
  QSMZFA_301: { "변기를 가득 채울 정도": "emergency" },
  QSMZFA_008: { "순식간에 매우 극심한 복통 발생 후 악화되는 양상": "emergency" },
  QSMZFA_082: { "번개가 치는 듯한 두통": "emergency", "머리가 깨질 것 같은 극심한 두통": "urgent" },
  QSBZFA_170: { "침삼키기 두려울 정도의 인후통": "urgent" },
  QSBZFB_386: { "극심한 통증이 등 뒤로 뻗침": "emergency" },
  QSMZFA_018: { "운동하는 중에 기절": "emergency", "앉거나 누운 상태에서 기절": "emergency" },
  QSMZFA_001: { "39.0도 이상": "note" },
  QSWZFA_312: { "안정 시에도 발생": "urgent" },
  QSMZFC_197: { "갑자기 발생": "urgent" },
  QSMZFA_044: { "갑자기 발생": "urgent" },
  QSWZFA_243: { "전혀 보이지 않음": "emergency" },
  QSMZFB_265: { "갑자기 발생": "urgent" },
  QSMZFA_054: { "갑자기 힘이 빠짐": "emergency" },
  QSMZFC_124: { "갑자기 저림": "urgent" },
};

/**
 * Explicit association suggestions shown when adding symptoms (6절 1번). Simtomi's own links come from its
 * "associated symptom" questions; these are NARU's additions, never derived from search synonyms.
 */
export const ASSOC_RULES = {
  SCV004: ["SLR002", "SED006", "SGI011", "SCV003"],
  SCV005: ["SLR002", "SED006", "SGI011", "SCV003"],
  SUR010: ["SUR009", "SLR003", "SWH005", "SUR004", "SLR002"],
  SUR009: ["SLR003", "SUR010"],
  SLU004: ["SWH005", "SUU002", "SLU009", "SGY004", "SLU001"],
  SGI010: ["SGI009", "SGI004", "SGI008", "SWH005", "SWH001"],
  SGI004: ["SGI001", "SWH005", "SGI008", "SGI010"],
  SGI008: ["SGI010", "SGI004", "SWH005", "SLU004", "SGY003"],
  SWH001: ["SGI011", "SOP013", "SMS018", "SWH005", "SWH008"],
  SWH005: ["SUR010", "SUR004", "SWH001", "SGI004", "SDM007", "SWH007"],
  SWH003: ["SWH005", "SWH007"],
  SPY014: ["SPY007", "SPY009", "SWH012", "SPY019", "SWH006"],
  SWH006: ["SPY014", "SPY007"],
  SPY009: ["SPY007", "SCV003", "SPY014"],
  SEA007: ["SWH008", "SPN001", "SEA001", "SEA004"],
  SWH014: ["SLR002"],
  SOP022: ["SOP013", "SOP018", "SOP021", "SOP020"],
  SDM005: ["SOR007", "SLR002"],
  SUR004: ["SWH005", "SUR010", "SLY001", "SUR002"],
  SGY006: ["SGY008", "SGY005", "SGI008"],
  SMS010: ["SPN007", "SMS009"],
};

/** Simtomi symptom categories -> NARU browse categories (cat.* keys already translated). */
export const CATEGORY_MAP = {
  AL: "BAL", AN: "BGI", BR: "BBR", CN: "BNR", CV: "BHV", DM: "BDM", DT: "BDT", EA: "BEA", ED: "BED", FD: "BED",
  FR: "BWH", GI: "BGI", GY: "BOG", HO: "BWH", LR: "BRE", LU: "BUR", MA: "BMS", MC: "BMS", MF: "BMS", MH: "BMS",
  ML: "BMS", MS: "BMS", MW: "BMS", MK: "BMS", MP: "BMS", ME: "BMS", MZ: "BMS", OP: "BOP", OR: "BOR", PN: "BNR",
  PY: "BPY", RM: "BWH", SX: "BUR", UR: "BRE", UU: "BUR", WH: "BWH", ON: "BZZ", DR: "BGI", AT: "BZZ", ER: "BZZ",
};
/** Fallback by symptom id prefix for symptoms without a category. */
export const PREFIX_CATEGORY = { SCN: "BNR", SDM: "BDM", SGY: "BOG", SMS: "BMS", SOR: "BOR", SSX: "BUR", SCV: "BHV", SPN: "BNR", SPY: "BPY" };

/** The "common" shortcut list (cat.BFR). */
export const COMMON = [
  "SWH005", "SWH001", "SUR010", "SUR004", "SUR007", "SGI008", "SGI004", "SGI010", "SWH008", "SGY006",
  "SDM007", "SMS010", "SDT001", "SOP022", "SLU004", "SPY007",
];

/** NARU's older symptom ids (Home shortcuts, info pages) -> Simtomi ids. null: no Simtomi symptom. */
export const NARU_TO_SIMTOMI = {
  cold: "SUR007", fever: "SWH005", chills: "SWH003", fatigue: "SWH004", bodyAche: "SWH007", nightSweats: "SED006",
  swollenGlands: "SLY001", appetiteLoss: "SWH012", headache: "SWH001", dizziness: "SWH008", numbness: "SPN006",
  fainting: "SCV006", cough: "SUR010", sputum: "SUR009", rhinorrhea: "SUR007", nasalCongestion: "SUR006",
  soreThroat: "SUR004", shortBreath: "SLR002", wheezing: "SLR001", sneezing: "SUR005", earPain: "SEA007",
  hearingLoss: "SEA001", tinnitus: "SEA002", earDischarge: "SEA004", mouthUlcer: "SOR008", dysphagia: "SCN006",
  toothache: "SDT001", gumBleeding: "SDT007", gumSwelling: "SDT006", chestPain: "SCV004", palpitations: "SCV003",
  legSwelling: "SWH014", stomachache: "SGI008", nausea: "SGI011", vomit: "SGI010", diarrhea: "SGI004",
  constipation: "SGI005", heartburn: "SGI013", indigestion: "SGI007", bloating: "SGI006", bloodyStool: "SGI001",
  lumbarPain: "SMS010", neckPain: "SMS018", shoulderPain: "SMS017", kneePain: "SMS006", musclePain: "SWH007",
  jointSwelling: "SMS029ZZ", sprain: "SMS004", cut: null, burn: "SDM032", bruise: null, insectBite: "SDM007",
  headInjury: "SWH001", dysuria: "SLU004", frequentUrination: "SLU009", hematuria: "SUU001", flankPain: "SUU002",
  menstrualCramps: "SGY006", irregularPeriod: "SGY009", abnormalDischarge: "SGY004", abnormalBleeding: "SGY003",
  redEye: "SOP022", eyePain: "SOP020", itchyEye: "SOP021", blurredVision: "SOP015", eyeDischarge: "SOP018",
  anxiety: "SPY009", depressedMood: "SPY014", insomnia: "SPY007", rash: "SDM007", itching: "SDM007", hives: "SDM005",
  acne: "SDM014", rhinitis: "SUR007", allergyReaction: "SDM005", excessiveThirst: "SED007", weightChange: "SWH011",
  breastLump: "SBR001", breastPain: "SBR002", hangover: "SGI011",
};
