// Home medicine → Korean medicine: the student types what they took at home, sees its ingredients in their language,
// Korean OTC products with the same ingredients, and a Korean sentence to show the pharmacist.
import { useMemo, useState } from "react";
import { ArrowLeft, Check, ClipboardPlus, Globe, Info as InfoIcon, Search } from "lucide-react";
import { useI18n } from "../i18n";
import { href } from "../app/router";
import { useCard } from "../state/card";
import { INGREDIENTS, PRODUCTS, ingredientKey, officialItem } from "../content/medicines";
import { FOREIGN, FOREIGN_CHECKED, type ForeignIngredient, type ForeignProduct } from "../content/foreignMeds";
import { findForeign, koreanAlternatives } from "../lib/medMatch";
import { Chip, Notice, Out, PageHead, Section } from "../components/ui";
import { PhraseOverlay } from "../components/PhraseOverlay";
import { IngredientCard } from "./Medicine";

const COMMON = ["acetaminophen", "ibuprofen", "aspirin", "cetirizine", "loratadine", "loperamide", "smectite", "famotidine", "dextromethorphan", "ambroxol"];

/** The ingredient's Latin name, for staff and for students who know it from the pack. */
const latin = (id: string) => INGREDIENTS[id].names.find((n) => /^[a-z]/.test(n)) ?? id;

function KoreanProducts({ ids }: { ids: string[] }) {
  const { t } = useI18n();
  return (
    <>
      {ids.map((p) => (
        <div className="product" key={p}>
          <strong lang="ko">{PRODUCTS[p].ko}</strong>
          <small>
            {t("med.mainIngredients")}: <span lang="ko">{PRODUCTS[p].mainKo}</span>
          </small>
          <Out href={officialItem(PRODUCTS[p].itemSeq)}>{t("med.official")}</Out>
        </div>
      ))}
    </>
  );
}

export function FromHome() {
  const { t, tk } = useI18n();
  const { addMed } = useCard();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<ForeignProduct | null>(null);
  const [chip, setChip] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [added, setAdded] = useState(false);

  const found = useMemo(() => findForeign(query), [query]);
  // One product found, or one picked from the list, or ingredient names typed directly.
  const product = picked ?? (found.products.length === 1 ? found.products[0] : null);
  const ingredients: ForeignIngredient[] = chip
    ? [{ id: chip, inn: latin(chip) }]
    : product
      ? product.ingredients
      : found.products.length
        ? []
        : [...found.ingredients.map((id) => ({ id, inn: latin(id) })), ...found.inns.map((inn) => ({ inn }))];
  const known = ingredients.flatMap((i) => (i.id && INGREDIENTS[i.id] ? [i.id] : []));
  const alt = useMemo(() => koreanAlternatives(known, known.length === ingredients.length), [known.join(), ingredients.length]);

  const reset = (value = "") => {
    setQuery(value);
    setPicked(null);
    setChip(null);
    setAdded(false);
  };
  const names = (inKorean: boolean) =>
    ingredients.map((i) => (i.id && INGREDIENTS[i.id] ? (inKorean ? tk(ingredientKey(i.id)) : t(ingredientKey(i.id))) + ` (${i.inn})` : i.inn)).join(", ");

  return (
    <section className="medicine from-home">
      <a className="page-back" href={href("meds")}>
        <ArrowLeft className="flip" size={18} aria-hidden /> {t("meds.back")}
      </a>
      <PageHead title={t("meds.fromHome")} intro={t("hm.intro")} icon={<Globe />} />

      <label className="search">
        <Search size={18} aria-hidden />
        <input
          type="search"
          dir="auto"
          value={query}
          placeholder={t("hm.example")}
          aria-label={t("hm.searchLabel")}
          onChange={(e) => reset(e.target.value)}
        />
      </label>

      {!query.trim() && (
        <Section title={t("hm.common")}>
          <div className="choices">
            {COMMON.filter((id) => INGREDIENTS[id]).map((id) => (
              <Chip key={id} on={chip === id} onClick={() => { reset(); setChip(chip === id ? null : id); }}>
                {t(ingredientKey(id))}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      {!picked && !chip && found.products.length > 1 && (
        <Section title={t("hm.pick")}>
          <ul className="rows">
            {found.products.map((p) => (
              <li key={p.key}>
                <button type="button" className="item" onClick={() => setPicked(p)}>
                  <span className="item-text">
                    <span className="item-title" lang="en" dir="ltr">{p.name}</span>
                    <span className="item-sub" dir="ltr">{p.ingredients.map((i) => i.inn + (i.amount ? " " + i.amount : "")).join(" · ")}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {query.trim().length >= 2 && !product && !chip && !found.products.length && !ingredients.length && <Notice>{t("hm.notFound")}</Notice>}

      {ingredients.length > 0 && (
        <div className="med-result" aria-live="polite">
          <Section title={product ? t("hm.ingredientsOf", { name: product.name }) : undefined}>
            {product && (
              <p className="flag">
                <InfoIcon size={18} aria-hidden />
                <span>
                  {t("hm.countryNote")} <Out href={product.source}>{t("common.source")}</Out>
                </span>
              </p>
            )}
            {ingredients.map((i) =>
              i.id && INGREDIENTS[i.id] ? (
                <IngredientCard key={i.inn} id={i.id} amount={i.amount} />
              ) : (
                <article className="ingredient" key={i.inn}>
                  <header>
                    <h3 lang="en" dir="ltr">
                      {i.inn}
                      {i.amount && <span className="amount"> · {i.amount}</span>}
                    </h3>
                  </header>
                  <p className="muted">{t("hm.unknown")}</p>
                </article>
              ),
            )}
          </Section>

          {alt.same.length > 0 && (
            <Section title={t("hm.same")}>
              <KoreanProducts ids={alt.same} />
            </Section>
          )}
          {alt.each.map(({ id, kind, products }) => {
            const ingredient = t(ingredientKey(id));
            const title =
              kind === "combo" ? t("hm.combos", { name: ingredient }) : known.length > 1 ? t("hm.single", { name: ingredient }) : t("hm.same");
            return (
              <Section key={id} title={title}>
                {kind === "none" ? <Notice>{t("hm.none")}</Notice> : <KoreanProducts ids={products.slice(0, 6)} />}
              </Section>
            );
          })}
          {(alt.same.length > 0 || alt.each.some((a) => a.kind !== "none")) && (
            <p className="muted">
              <InfoIcon size={14} aria-hidden /> {t("hm.doseNote")}
            </p>
          )}
          {ingredients.some((i) => !i.id || !INGREDIENTS[i.id]) && known.length === 0 && <Notice>{t("hm.none")}</Notice>}

          <div className="actions column">
            <button type="button" className="primary" onClick={() => setAsking(true)}>
              {t("hm.ask")}
            </button>
            {known.length > 0 && (
              <button
                type="button"
                disabled={added}
                onClick={() => {
                  addMed({ id: "home:" + (product?.key ?? known.join("+")), name: product?.name ?? known.map((i) => tk(ingredientKey(i))).join(" + "), ingredients: known });
                  setAdded(true);
                }}
              >
                {added ? <Check aria-hidden /> : <ClipboardPlus aria-hidden />}
                {added ? t("med.added") : t("med.addToCard")}
              </button>
            )}
            <button type="button" onClick={() => reset()}>
              {t("hm.again")}
            </button>
          </div>
        </div>
      )}

      <p className="muted small">{t("hm.data", { n: FOREIGN.length, date: FOREIGN_CHECKED })}</p>
      <p className="disclaimer">{t("disclaimer.otc")}</p>
      {asking && (
        <PhraseOverlay
          phrase="hm.askLine"
          kind="say"
          params={{ mine: { names: names(false) }, ko: { names: names(true) } }}
          onClose={() => setAsking(false)}
        />
      )}
    </section>
  );
}
