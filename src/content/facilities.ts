// Facilities near Inha University. "official" are hospitals from Incheon City's foreigner
// care guide; their language support has NOT been confirmed by us. "verified" facilities are
// added only after an operator confirms, per role, which languages work and when.

export type Facility = {
  ko: string;
  en: string;
  address: string;
  phone: string;
  /** Per role: languages confirmed by phone/visit. Empty until verified. */
  languages: { reception: string[]; consult: string[] };
  verifiedAt?: string;
};

export const OFFICIAL: Facility[] = [
  { ko: "인하대학교병원", en: "Inha University Hospital", address: "인천 중구 인항로 27", phone: "1600-8114", languages: { reception: [], consult: [] } },
  { ko: "인천사랑병원", en: "Incheon Sarang Hospital", address: "인천 미추홀구 미추홀대로 726", phone: "032-457-2000", languages: { reception: [], consult: [] } },
  { ko: "현대유비스병원", en: "Hyundai UVIS Hospital", address: "인천 미추홀구 독배로 503", phone: "032-888-7575", languages: { reception: [], consult: [] } },
];

/** Clinics and pharmacies whose language support an operator confirmed. Empty until field checks. */
export const VERIFIED: Facility[] = [];

export const QUICK_DEPTS = ["JIM", "JFM", "JEN", "JOS", "JDM", "JOP", "JDT", "JOG", "JUR", "JPY", "JNL", "JRM"];

export const LINKS = {
  incheonGuide: "https://www.incheon.go.kr/ml_kr/MLKR050223",
  nightPharmacy: "https://www.pharm114.or.kr/",
  emergency: "https://www.e-gen.or.kr/",
  nhis: "https://www.nhis.or.kr/english/main.do",
  inha: "https://internationalcenter.inha.ac.kr/",
};

export const mapSearch = (query: string) => "https://map.naver.com/p/search/" + encodeURIComponent(query);
