// The schools NARU knows. One today (Inha); the list is what the picker shows and what a saved choice is
// checked against, so adding a second school is a new entry here with its own contacts — no screen changes.
// Facts come from each school's own pages, checked on the date below; NARU is not run by the school and
// says so on screen. Re-check before each semester.
import type { MessageKey } from "../i18n";

export type SchoolContact = {
  id: "health" | "oia" | "counsel";
  title: MessageKey;
  short: MessageKey;
  sub: MessageKey;
  phone: string;
  source: string;
};

const INHA = {
  id: "inha",
  name: "school.inha" as MessageKey,
  city: "welcome.cityIncheon" as MessageKey,
  checked: "2026-11-18",
  /** Campus position (OpenStreetMap). The health center is in the Student Union building on campus. */
  location: { lat: 37.449443, lng: 126.653445 },
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

export type SchoolInfo = typeof INHA;

/** Every school the picker offers, in the order it offers them. */
export const SCHOOLS: SchoolInfo[] = [INHA];

export const schoolById = (id: string | null) => SCHOOLS.find((s) => s.id === id) ?? null;

/** The campus the clinic and pharmacy list was collected around (src/content/osm-places.json). A student
 *  with no school still sees that area, so this is the fallback wherever a screen needs a place to stand. */
export const SCHOOL = INHA;
