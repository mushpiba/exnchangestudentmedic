// The student's school. One school for now (Inha). Facts come from the school's own pages, checked on the
// date below; NARU is not run by the school and says so on screen. Re-check before each semester.
import type { MessageKey } from "../i18n";

export type SchoolContact = {
  id: "health" | "oia" | "counsel";
  title: MessageKey;
  short: MessageKey;
  sub: MessageKey;
  phone: string;
  source: string;
};

export const SCHOOL = {
  name: "school.inha" as MessageKey,
  checked: "2026-11-18",
  homepage: "https://www.inha.ac.kr/",
  international: "https://internationalcenter.inha.ac.kr/",
  contacts: [
    {
      id: "health",
      title: "school.health",
      short: "school.healthShort",
      sub: "school.healthSub",
      phone: "032-860-8311",
      source: "https://health.inha.ac.kr/health/10787/subview.do",
    },
    {
      id: "oia",
      title: "school.oia",
      short: "school.oiaShort",
      sub: "school.oiaSub",
      phone: "032-860-7039",
      source: "https://internationalcenter.inha.ac.kr/internationalcenter/9881/subview.do",
    },
    {
      id: "counsel",
      title: "school.counsel",
      short: "school.counselShort",
      sub: "school.counselSub",
      phone: "032-860-8262",
      source: "https://studlife.inha.ac.kr/",
    },
  ] satisfies SchoolContact[],
};
