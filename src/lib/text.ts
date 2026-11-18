export function normalize(text: string) {
  return text
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[ʻ’‘ʼ`'·\-\s]/g, "");
}

// Uzbek is written in both Latin and Cyrillic; our Uzbek strings are Latin.
const CYRILLIC_TO_UZ_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k",
  л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts",
  ч: "ch", ш: "sh", ъ: "", ь: "", э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

/** True when the query appears in any known spelling of a label. */
export function matches(variants: string[], query: string, locale: string) {
  const q = normalize(query);
  if (!q) return true;
  const queries = locale === "uz" ? [q, Array.from(q, (c) => CYRILLIC_TO_UZ_LATIN[c] ?? c).join("")] : [q];
  return variants.some((v) => queries.some((x) => normalize(v).includes(x)));
}
