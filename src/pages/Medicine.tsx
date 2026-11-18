import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Camera, Check, ClipboardPlus, ImageUp, Info as InfoIcon, Pill, Search, ShieldCheck } from "lucide-react";
import { useI18n } from "../i18n";
import { href } from "../app/router";
import { useCard } from "../state/card";
import { INGREDIENTS, PRODUCTS, cautionKey, classKey, ingredientKey, officialItem, officialSearch, useKey } from "../content/medicines";
import { analyze, overlap, type Found } from "../lib/medMatch";
import { readText } from "../lib/ocr";
import { Notice, Out, PageHead } from "../components/ui";
import { PhraseOverlay } from "../components/PhraseOverlay";

function IngredientCard({ id, amount }: { id: string; amount?: string }) {
  const { t, tk, locale } = useI18n();
  const ing = INGREDIENTS[id];
  const mine = t(ingredientKey(id));
  const ko = tk(ingredientKey(id));
  return (
    <article className="ingredient">
      <header>
        <h3>
          {mine}
          {amount && <span className="amount"> · {amount}</span>}
        </h3>
        {locale !== "ko-KR" && mine !== ko && (
          <span lang="ko" className="ko-name">
            {ko}
          </span>
        )}
        <span className="badge">{t(classKey(ing.cls))}</span>
      </header>
      <p className="label">{t("med.uses")}</p>
      <ul className="tags">
        {ing.uses.map((u) => (
          <li key={u}>{t(useKey(u))}</li>
        ))}
      </ul>
      {ing.cautions.length > 0 && (
        <>
          <p className="label">{t("med.cautions")}</p>
          <ul className="cautions">
            {ing.cautions.map((c) => (
              <li key={c}>
                <AlertTriangle size={16} aria-hidden />
                {t(cautionKey(c))}
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}

export function Medicine() {
  const { t, tk } = useI18n();
  const { card, addMed } = useCard();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Found | null>(null);
  const [failed, setFailed] = useState(false);
  const [added, setAdded] = useState(false);
  const [asking, setAsking] = useState(false);
  const run = useRef(0);

  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function read(picked: File) {
    const id = ++run.current;
    setFile(picked);
    setResult(null);
    setFailed(false);
    setAdded(false);
    try {
      const recognized = await readText(picked, (p) => id === run.current && setProgress(p));
      if (id !== run.current) return;
      setText(recognized);
      setFailed(!recognized);
      setResult(recognized ? analyze(recognized) : null);
    } catch {
      if (id === run.current) setFailed(true);
    } finally {
      if (id === run.current) setProgress(null);
    }
  }

  function search(value: string) {
    setQuery(value);
    setFile(null);
    setText("");
    setFailed(false);
    setAdded(false);
    setResult(value.trim().length >= 2 ? analyze(value) : null);
  }

  const ingredientIds = result?.ingredients.map((i) => i.id) ?? [];
  const duplicates = useMemo(
    () => overlap(ingredientIds, card.takeItems.flatMap((m) => m.ingredients)),
    [ingredientIds.join(), card.takeItems],
  );
  const productNames = result?.products.map((p) => PRODUCTS[p].ko) ?? [];
  const lookupName = productNames[0] ?? (ingredientIds[0] ? tk(ingredientKey(ingredientIds[0])) : query || text.split("\n")[0]);

  const input = (capture: boolean) => (
    <label className={"upload" + (capture ? " primary" : "")}>
      {capture ? <Camera size={22} aria-hidden /> : <ImageUp size={22} aria-hidden />}
      <span>{t(capture ? "med.camera" : "med.album")}</span>
      <input
        type="file"
        accept="image/*"
        {...(capture ? { capture: "environment" as const } : {})}
        disabled={progress !== null}
        onChange={(e) => {
          const picked = e.target.files?.[0];
          e.target.value = "";
          if (picked) read(picked);
        }}
      />
    </label>
  );

  return (
    <section className="medicine">
      <PageHead title={t("med.title")} intro={t("med.intro")} icon={<Pill />} />
      <div className="upload-row">
        {input(true)}
        {input(false)}
      </div>
      <p className="muted small">
        <ShieldCheck size={14} aria-hidden /> {t("med.firstLoad")}
      </p>

      <label className="search">
        <Search size={18} aria-hidden />
        <input
          type="search"
          dir="auto"
          value={query}
          placeholder={t("med.example")}
          aria-label={t("med.or")}
          onChange={(e) => search(e.target.value)}
        />
      </label>

      {preview && <img className="package" src={preview} alt="" />}
      {progress !== null && (
        <div className="progress-box" role="status">
          <progress max={100} value={progress} />
          <span>{t("med.analyzing", { p: progress })}</span>
        </div>
      )}
      {failed && <Notice>{t("med.noText")}</Notice>}

      {result && (
        <div className="med-result" aria-live="polite">
          {result.rx && <p className="flag rx">{t("med.rxSeen")}</p>}
          {result.otc && <p className="flag otc">{t("med.otcSeen")}</p>}
          {result.bag && <p className="flag">{t("med.bagSeen")}</p>}
          {duplicates.length > 0 && (
            <p className="flag danger" role="alert">
              <AlertTriangle size={18} aria-hidden />
              {t("med.duplicate", { names: duplicates.map((d) => t(ingredientKey(d))).join(", ") })}
            </p>
          )}

          {result.products.length > 0 && (
            <section className="section">
              <h2>{t("med.products")}</h2>
              {result.products.map((p) => (
                <div className="product" key={p}>
                  <strong lang="ko">{PRODUCTS[p].ko}</strong>
                  <small>
                    {t("med.mainIngredients")}: <span lang="ko">{PRODUCTS[p].mainKo}</span>
                  </small>
                  <Out href={officialItem(PRODUCTS[p].itemSeq)}>{t("med.official")}</Out>
                </div>
              ))}
            </section>
          )}

          {result.families.map((family) => {
            const options = Object.values(PRODUCTS).filter((p) => p.family === family);
            return (
              <div className="flag" key={family}>
                <div>
                  <p>{t("med.family", { brand: family })}</p>
                  <div className="row">
                    {options.map((p) => (
                      <button key={p.ko} type="button" lang="ko" onClick={() => search(p.ko)}>
                        {p.ko}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {result.ingredients.length > 0 ? (
            <section className="section">
              <h2>{t("med.ingredients")}</h2>
              {result.ingredients.map((i) => (
                <IngredientCard key={i.id} id={i.id} amount={i.amount} />
              ))}
              <p className="muted">
                <InfoIcon size={14} aria-hidden /> {t("med.dosage")}
              </p>
            </section>
          ) : (
            result.families.length === 0 && (
              <Notice>
                {t("med.notFound")} {t("med.notFoundHint")}
              </Notice>
            )
          )}

          <div className="actions column">
            {result.ingredients.length > 0 && (
              <button
                type="button"
                className="primary"
                disabled={added}
                onClick={() => {
                  addMed({
                    id: (result.products[0] ?? ingredientIds.join("+")) + ":" + ingredientIds.join("+"),
                    name: productNames[0] ?? ingredientIds.map((i) => tk(ingredientKey(i))).join(" + "),
                    ingredients: ingredientIds,
                  });
                  setAdded(true);
                }}
              >
                {added ? <Check aria-hidden /> : <ClipboardPlus aria-hidden />}
                {added ? t("med.added") : t("med.addToCard")}
              </button>
            )}
            {added && (
              <a className="button" href={href("card")}>
                {t("nav.card")}
              </a>
            )}
            <button type="button" onClick={() => setAsking(true)}>
              {t("med.askPharmacist")}
            </button>
            {lookupName && <Out href={officialSearch(lookupName)}>{t("med.official")}</Out>}
          </div>

          {text && (
            <details className="recognized">
              <summary>{t("med.recognized")}</summary>
              <p className="muted">{t("med.recognizedHint")}</p>
              <textarea dir="auto" value={text} onChange={(e) => setText(e.target.value)} />
              <button type="button" onClick={() => setResult(analyze(text))}>
                {t("med.reanalyze")}
              </button>
            </details>
          )}
        </div>
      )}

      {!result && !file && (
        <p className="muted small">
          {t("med.knownCount", { n: Object.keys(INGREDIENTS).length, m: Object.keys(PRODUCTS).length })}
        </p>
      )}
      <p className="disclaimer">{t("disclaimer.otc")}</p>
      {asking && <PhraseOverlay phrase="med.askPharmacistLine" kind="say" onClose={() => setAsking(false)} />}
    </section>
  );
}
