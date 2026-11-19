// Numbers behind the Korean-healthcare guide's charts. Every value carries its year; every set names its source.
// World Bank values: World Development Indicators API (WHO Global Health Expenditure Database for spending,
// WHO/OECD for physicians and beds, UN for life expectancy), fetched 2026-11-19, CC BY 4.0. Most recent value per country.

export type Country = "KR" | "US" | "ES" | "FR" | "JP" | "CN" | "TW" | "VN" | "RU" | "UZ" | "KZ" | "KG" | "MN" | "NP" | "SA" | "PK";
export type Indicator = "physicians" | "beds" | "spendGdp" | "oop" | "life" | "spendPc";
/** [value, year] */
export type Figure = [number, number];

/** Countries students come from, in the order the picker lists them. */
export const HOME_COUNTRIES: Exclude<Country, "KR">[] = ["CN", "VN", "UZ", "MN", "KZ", "KG", "NP", "PK", "JP", "TW", "RU", "SA", "US", "ES", "FR"];

/** The country each app language stands for on the comparison page. Korean has none: it shows a picker. */
export const LOCALE_COUNTRY: Record<string, Exclude<Country, "KR"> | undefined> = {
  "en-US": "US",
  "es-ES": "ES",
  "fr-FR": "FR",
  "ja-JP": "JP",
  "zh-CN": "CN",
  "zh-TW": "TW",
  "vi-VN": "VN",
  "ru-RU": "RU",
  uz: "UZ",
  kk: "KZ",
  ky: "KG",
  "mn-MN": "MN",
  "ne-NP": "NP",
  "ar-SA": "SA",
  "ur-PK": "PK",
};

export const WORLD_BANK: Partial<Record<Country, Partial<Record<Indicator, Figure>>>> = {
  KR: { physicians: [2.6, 2022], beds: [12.8, 2022], spendGdp: [8.7, 2024], oop: [33.7, 2024], life: [83.6, 2024], spendPc: [3137, 2024] },
  US: { physicians: [3.7, 2022], beds: [2.7, 2022], spendGdp: [16.7, 2023], oop: [10.9, 2023], life: [78.9, 2024], spendPc: [13473, 2023] },
  ES: { physicians: [4.3, 2022], beds: [2.9, 2023], spendGdp: [9.2, 2023], oop: [20.9, 2023], life: [83.9, 2024], spendPc: [3107, 2023] },
  FR: { physicians: [3.3, 2022], beds: [5.7, 2022], spendGdp: [11.5, 2024], oop: [9.2, 2024], life: [83, 2024], spendPc: [5327, 2024] },
  JP: { physicians: [2.7, 2022], beds: [12.6, 2022], spendGdp: [10.7, 2023], oop: [12.2, 2023], life: [84, 2024], spendPc: [3638, 2023] },
  CN: { physicians: [3.1, 2022], beds: [5.6, 2023], spendGdp: [5.9, 2023], oop: [32.2, 2023], life: [78, 2024], spendPc: [763, 2023] },
  VN: { physicians: [1.1, 2021], beds: [2.5, 2017], spendGdp: [4.6, 2023], oop: [39.2, 2023], life: [74.7, 2024], spendPc: [197, 2023] },
  RU: { physicians: [5.1, 2022], beds: [6.8, 2023], spendGdp: [7, 2023], oop: [28.4, 2023], life: [73.4, 2024], spendPc: [1003, 2023] },
  UZ: { physicians: [2.8, 2021], beds: [4.9, 2023], spendGdp: [6.7, 2023], oop: [64.1, 2023], life: [72.5, 2024], spendPc: [192, 2023] },
  KZ: { physicians: [3.8, 2023], beds: [6.5, 2020], spendGdp: [3.8, 2023], oop: [27.6, 2023], life: [74.5, 2024], spendPc: [490, 2023] },
  KG: { physicians: [1.6, 2023], beds: [3.7, 2023], spendGdp: [4.5, 2023], oop: [42.3, 2023], life: [72.4, 2024], spendPc: [97, 2023] },
  MN: { physicians: [4.1, 2022], beds: [8.6, 2023], spendGdp: [6.1, 2023], oop: [48.8, 2023], life: [72.4, 2024], spendPc: [360, 2023] },
  NP: { physicians: [1, 2023], beds: [0.5, 2023], spendGdp: [6.2, 2023], oop: [59.4, 2023], life: [70.6, 2024], spendPc: [84, 2023] },
  SA: { physicians: [3.4, 2023], beds: [2.4, 2023], spendGdp: [5.7, 2023], oop: [14.1, 2023], life: [79, 2024], spendPc: [1825, 2023] },
  PK: { physicians: [1.2, 2021], beds: [0.6, 2020], spendGdp: [2.5, 2023], oop: [52.9, 2023], life: [67.8, 2024], spendPc: [30, 2023] },
};

export const WORLD_BANK_SOURCE = {
  label: "World Bank, World Development Indicators (WHO GHED, WHO/OECD, UN WPP)",
  url: "https://data.worldbank.org/indicator/SH.MED.PHYS.ZS",
  fetched: "2026-11-19",
};

/** World Bank indicator codes, for the per-figure source links. */
export const WORLD_BANK_CODE: Record<Indicator, string> = {
  physicians: "SH.MED.PHYS.ZS",
  beds: "SH.MED.BEDS.ZS",
  spendGdp: "SH.XPD.CHEX.GD.ZS",
  oop: "SH.XPD.OOPC.CH.ZS",
  life: "SP.DYN.LE00.IN",
  spendPc: "SH.XPD.CHEX.PC.CD",
};

/**
 * Taiwan is not in World Bank data: official figures from the Ministry of Health and Welfare (MOHW) and the Ministry
 * of the Interior. Physicians count Western-medicine physicians only; out-of-pocket uses MOHW's broad definition,
 * which also counts over-the-counter medicines and health foods, so it reads higher than a World Bank figure would.
 */
export const TAIWAN: Partial<Record<Indicator, Figure>> = {
  physicians: [2.4, 2025],
  beds: [5.8, 2025],
  spendGdp: [6.9, 2024],
  oop: [39.9, 2024],
  life: [81.3, 2025],
};

const TAIWAN_SOURCE: Partial<Record<Indicator, string>> = {
  physicians: "https://www.mohw.gov.tw/dl-63140-2b5ec371-267a-4872-90d9-04ddf7f75bfe.html",
  beds: "https://www.mohw.gov.tw/dl-63137-7d7b4ed9-2100-4127-8021-ba0c2a220cd0.html",
  spendGdp: "https://www.mohw.gov.tw/dl-99631-cfe880cf-a90b-4eba-b240-351bf8abfd75.html",
  oop: "https://www.mohw.gov.tw/dl-99631-cfe880cf-a90b-4eba-b240-351bf8abfd75.html",
  life: "https://www.moi.gov.tw/News_Content.aspx?n=4&s=340439",
};

/** One country's value for an indicator, from whichever source covers it. */
export function figure(c: Country, ind: Indicator): Figure | undefined {
  return c === "TW" ? TAIWAN[ind] : WORLD_BANK[c]?.[ind];
}

export function figureSource(c: Country, ind: Indicator) {
  return c === "TW"
    ? { label: "Taiwan MOHW / MOI", url: TAIWAN_SOURCE[ind] ?? "https://www.mohw.gov.tw/" }
    : { label: "World Bank WDI", url: "https://data.worldbank.org/indicator/" + WORLD_BANK_CODE[ind] };
}

/**
 * OECD (2025), Health at a Glance 2025: OECD Indicators, from each figure's StatLink data. "OECD" is the unweighted
 * average OECD prints in the figure. Japan and the US report 2021-22 for some indicators (shown as 2022).
 */
export const OECD: Record<"visits" | "perDoctor", Partial<Record<Country | "OECD", Figure>>> = {
  visits: { KR: [18, 2023], JP: [12.1, 2022], ES: [5.9, 2023], FR: [5.4, 2023], US: [3.5, 2022], OECD: [6.5, 2023] },
  perDoctor: { KR: [6755, 2023], JP: [4566, 2022], FR: [1386, 2023], ES: [1344, 2023], US: [1287, 2022], OECD: [1908, 2023] },
};

export const OECD_SOURCE = {
  visits: { label: "OECD, Health at a Glance 2025 (Fig. 5.16)", url: "https://stat.link/rqt74h" },
  perDoctor: { label: "OECD, Health at a Glance 2025 (Fig. 5.18)", url: "https://stat.link/pm3teq" },
};
