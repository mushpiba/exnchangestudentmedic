// The Korean-healthcare guide: columns with charts and a home-country comparison.
// Text lives in one file per language (src/content/guide/text/<locale>.json), loaded with the language;
// numbers live in figures.ts so every language shows the same values.
import { useEffect, useState } from "react";
import type { MessageKey } from "../../i18n";
import type { Locale } from "../../i18n/locales";
import { AMBULANCE, ER_MINOR_SHARE, OTC_ITEMS, SHARE, STUDENT_CUT, STUDENT_PREMIUM, clinicFirstMine } from "../costs";
import { OECD, OECD_SOURCE, WORLD_BANK_CODE, figure, type Country, type Figure, type Indicator } from "./figures";

export type Block =
  | { p: string }
  | { h: string }
  | { list: string[] }
  | { chart: ChartId }
  | { table: { caption?: string; head: string[]; rows: string[][] } }
  | { tip: string }
  /** The full list of warning signs with the 119 button (the same list as the guide tab's own). */
  | { flags: true };

export type Column = { title: string; lead: string; blocks: Block[] };

export type GuideText = {
  columns: Partial<Record<ColumnId, Column>>;
  charts: Partial<Record<ChartId, { title: string; note?: string }>>;
  /** Differences between a home country and Korea; each language carries its own country (Korean and English carry all). */
  home: Partial<Record<Country, { summary: string; points: { home: string; korea: string }[] }>>;
};

export const COLUMNS = ["visits", "access", "cost", "insurance", "pharmacy", "emergency"] as const;
export type ColumnId = (typeof COLUMNS)[number];

export type ChartId = "visits" | "perDoctor" | "physicians" | "beds" | "oop" | "spendGdp" | "life";

type Source = { label: string; url: string };
type ChartDef = {
  indicator?: Indicator;
  countries: Country[];
  figure: (c: Country) => Figure | undefined;
  source: () => Source;
  /** OECD average, drawn as its own bar. */
  avg?: Figure;
};

const wb = (indicator: Indicator) => (c: Country) => figure(c, indicator);
const wbSource = (indicator: Indicator) => () => ({
  label: "World Bank WDI",
  url: "https://data.worldbank.org/indicator/" + WORLD_BANK_CODE[indicator],
});

/** Countries every World Bank chart shows; the student's own country is added when missing. */
const WB_SET: Country[] = ["KR", "JP", "US", "FR", "ES", "CN", "RU"];

const OECD_SET: Country[] = ["KR", "JP", "ES", "FR", "US"];

export const CHARTS: Partial<Record<ChartId, ChartDef>> = {
  visits: { countries: OECD_SET, figure: (c) => OECD.visits[c], source: () => OECD_SOURCE.visits, avg: OECD.visits.OECD },
  perDoctor: { countries: OECD_SET, figure: (c) => OECD.perDoctor[c], source: () => OECD_SOURCE.perDoctor, avg: OECD.perDoctor.OECD },
  physicians: { indicator: "physicians", countries: WB_SET, figure: wb("physicians"), source: wbSource("physicians") },
  beds: { indicator: "beds", countries: WB_SET, figure: wb("beds"), source: wbSource("beds") },
  oop: { indicator: "oop", countries: WB_SET, figure: wb("oop"), source: wbSource("oop") },
  spendGdp: { indicator: "spendGdp", countries: WB_SET, figure: wb("spendGdp"), source: wbSource("spendGdp") },
  life: { indicator: "life", countries: WB_SET, figure: wb("life"), source: wbSource("life") },
};

/** The numbers a column is really about, drawn as tiles right under its lead -- so the figure a student
 *  came for is readable before the prose is, and readable at all by someone who will not read the prose.
 *  Values are formatted here and never translated; only the label is. Each comes from that column's own
 *  sources (COLUMN_SOURCES below), either a published rate or a figure from figures.ts. */
export type ColumnFigure = { value: string; label: MessageKey; unit?: MessageKey };

const num = (f?: Figure) => (f ? f[0].toLocaleString("en-US") : "—");
const won = (n: number) => "₩" + n.toLocaleString("en-US");
const pct = (n: number) => Math.round(n * 100) + "%";

export const COLUMN_FIGURES: Record<ColumnId, ColumnFigure[]> = {
  visits: [
    { value: num(OECD.visits.KR), label: "guide.fig.visits", unit: "guide.unit.visits" },
    { value: num(OECD.perDoctor.KR), label: "guide.fig.perDoctor", unit: "guide.unit.cases" },
  ],
  access: [
    { value: num(figure("KR", "physicians")), label: "guide.ind.physicians", unit: "guide.unit.people" },
    { value: num(figure("KR", "beds")), label: "guide.ind.beds", unit: "guide.unit.beds" },
  ],
  cost: [
    { value: won(clinicFirstMine), label: "guide.fig.clinicFee" },
    { value: pct(SHARE.clinic), label: "guide.fig.clinicShare" },
  ],
  insurance: [
    { value: won(STUDENT_PREMIUM), label: "guide.fig.premium" },
    { value: pct(STUDENT_CUT), label: "guide.fig.studentCut" },
  ],
  pharmacy: [{ value: String(OTC_ITEMS), label: "guide.fig.otcItems", unit: "guide.unit.items" }],
  emergency: [
    { value: won(AMBULANCE), label: "guide.fig.ambulance" },
    { value: pct(ER_MINOR_SHARE), label: "guide.fig.erMinor" },
  ],
};

const files = import.meta.glob<GuideText>("./text/*.json", { import: "default" });
const cache = new Map<string, Promise<GuideText>>();

function load(locale: string): Promise<GuideText> {
  const own = files[`./text/${locale}.json`];
  const fallback = files["./text/en-US.json"] ?? files["./text/ko-KR.json"];
  const loader = own ?? fallback;
  if (!cache.has(locale)) cache.set(locale, loader ? loader() : Promise.resolve({ columns: {}, charts: {}, home: {} }));
  return cache.get(locale)!;
}

/** The guide text in the student's language (English while a language has no file yet); null while loading. */
export function useGuideText(locale: Locale): GuideText | null {
  const [text, setText] = useState<GuideText | null>(null);
  useEffect(() => {
    let live = true;
    setText(null);
    load(locale).then((t) => live && setText(t));
    return () => {
      live = false;
    };
  }, [locale]);
  return text;
}

/** Sources each column was written from, listed under it. */
export const COLUMN_SOURCES: Record<ColumnId, Source[]> = {
  visits: [
    { label: "OECD, Health at a Glance 2025: Consultations with doctors", url: "https://www.oecd.org/en/publications/health-at-a-glance-2025_8f9e3f98-en/full-report/consultations-with-doctors_6cbfac99.html" },
    { label: "NHIS, 연도별 요양기관 현황 (2025)", url: "https://www.nhis.or.kr/announce/wbhaec11404m01.do" },
    { label: "You, Kang, Kwon, IJHPM 2026;15:9763", url: "https://www.ijhpm.com/article_4921_b64a70760bb75e3ecfd1ad86d8f10c88.pdf" },
    { label: "국민건강보험법 시행령 [별표 2]", url: "https://www.law.go.kr/LSW/flDownload.do?gubun=&flSeq=169128695&bylClsCd=110201" },
  ],
  access: [
    { label: "NHIS, 연도별 요양기관 현황 (2025)", url: "https://www.nhis.or.kr/announce/wbhaec11404m01.do" },
    { label: "국민건강보험 요양급여의 기준에 관한 규칙 제2조", url: "https://www.law.go.kr/법령/국민건강보험요양급여의기준에관한규칙" },
    { label: "HIRA, 가산제도", url: "https://www.hira.or.kr/dummy.do?pgmid=HIRAA020028000000" },
    { label: "E-Gen 응급의료포털", url: "https://www.e-gen.or.kr/egen/main.do" },
    { label: "보건복지부 보도자료 2026-07-16", url: "https://mohw.go.kr/board.es?act=view&bid=0027&list_no=1491331&mid=a10503010100&nPage=1&tag=" },
  ],
  cost: [
    { label: "국민건강보험법 시행령 [별표 2] (2026-10-01 시행)", url: "https://www.law.go.kr/LSW/flDownload.do?gubun=&flSeq=169128695&bylClsCd=110201" },
    { label: "대한민국 정책브리핑 2026-06-26 (진찰료)", url: "https://www.korea.kr/news/policyNewsView.do?newsId=148967170" },
    { label: "요양급여의 기준에 관한 규칙 [별표 2] 비급여대상", url: "https://www.law.go.kr/LSW/flDownload.do?gubun=&flSeq=171466737&bylClsCd=110201" },
    { label: "OECD, Health at a Glance 2025 (Fig. 7.9)", url: "https://stat.link/ksa3d6" },
  ],
  insurance: [
    { label: "NHIS, Health insurance for foreigners", url: "https://www.nhis.or.kr/nhis/policy/wbhada02410m01.do" },
    { label: "NHIS, 2026년도 보험료율 기준 안내", url: "https://www.nhis.or.kr/nhis/together/wbhaea01000m01.do?mode=view&articleNo=11008009" },
    { label: "NHIS, 보험료 경감", url: "https://www.nhis.or.kr/static/html/wbma/b/wbmab0103.html" },
    { label: "NHIS English", url: "https://www.nhis.or.kr/english/index.do" },
  ],
  pharmacy: [
    { label: "보건복지부, 의약분업", url: "https://www.mohw.go.kr/menu.es?mid=a10702040100" },
    { label: "질병관리청, 항생제 바로 알기", url: "https://www.kdca.go.kr/kdca/3513/subview.do" },
    { label: "안전상비의약품 지정에 관한 고시", url: "https://www.law.go.kr/LSW/admRulInfoR.do?admRulSeq=2100000057432" },
    { label: "약사법 시행규칙", url: "https://www.law.go.kr/법령/약사법시행규칙" },
    { label: "보건복지부 보도자료 2026-07-16", url: "https://mohw.go.kr/board.es?act=view&bid=0027&list_no=1491331&mid=a10503010100&nPage=1&tag=" },
  ],
  emergency: [
    { label: "국민건강보험법 시행규칙 [별표 6] (2024-09-12 개정)", url: "https://www.law.go.kr/LSW/flDownload.do?flSeq=167380879" },
    { label: "대한민국 정책브리핑 2024-09-13", url: "https://www.korea.kr/briefing/policyBriefingView.do?newsId=156650977" },
    { label: "119구조ㆍ구급에 관한 법률", url: "https://www.law.go.kr/법령/119구조ㆍ구급에관한법률" },
    { label: "Gangdong-gu, 119 emergency (English)", url: "https://www.gangdong.go.kr/web/eng/contents/gde_040_040_030" },
    { label: "E-Gen 응급의료포털", url: "https://www.e-gen.or.kr/egen/main.do" },
  ],
};
