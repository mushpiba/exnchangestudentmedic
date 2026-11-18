import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, Languages, Pencil, Search, Siren, X } from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";
import { go, href } from "../app/router";
import { useCard } from "../state/card";
import { Chip } from "../components/ui";
import { Dictate } from "../components/Dictate";
import {
  ALLERGY_KINDS, AREAS, CATEGORIES, ONSETS, PAST, PREGNANCY, SIDES, SYMPTOMS,
  categoryKey, sideKey, symptom, symptomIds, symptomKey, vasKey, type Category,
} from "../content/symptoms";
import { matches } from "../lib/text";
import { DETAILS, GENERAL, detailKey, detailsFor, isDanger, optionKey, type DetailId } from "../content/details";
import { TRANSLATION_SERVER, translateOnServer } from "../lib/translate";

type Step = "main" | "area" | "detail" | "onset" | "pain" | "assoc" | "allergyMeds" | "history" | "notes";
const STEP_LABEL: Record<Step, MessageKey> = {
  main: "intake.stepMain",
  area: "intake.stepArea",
  detail: "intake.stepDetail",
  onset: "intake.stepOnset",
  pain: "intake.stepPain",
  assoc: "intake.stepAssoc",
  allergyMeds: "intake.stepAllergyMeds",
  history: "intake.stepHistory",
  notes: "intake.stepNotes",
};
const COMMON_ASSOC = ["fever", "chills", "fatigue", "headache", "dizziness", "nausea", "vomit", "diarrhea", "cough", "appetiteLoss"];

/**
 * The student's own words, translated into Korean for staff only when the student asks, after a notice that
 * the text goes to an outside server. Results are kept on the card so show mode never sends anything.
 */
function TranslateBox() {
  const { t, locale } = useI18n();
  const { card, set } = useCard();
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  const texts = [card.mainText, card.allergyText, card.takeText, card.notes].map((x) => x.trim()).filter(Boolean);
  if (locale === "ko-KR" || !texts.length) return null;
  const missing = texts.filter((x) => !card.translations[x]);

  async function run() {
    setState("busy");
    try {
      const next = { ...card.translations };
      for (const x of missing) next[x] = await translateOnServer(x, locale);
      set({ translations: next });
      setState("idle");
    } catch {
      setState("failed");
    }
  }

  return (
    <section className="translate-box" aria-labelledby="translate-title">
      <h2 id="translate-title">
        <Languages size={20} aria-hidden /> {t("intake.translateTitle")}
      </h2>
      <p className="muted">{t("intake.translateNotice")}</p>
      {missing.length > 0 && (
        <button type="button" disabled={state === "busy"} onClick={run}>
          {state === "busy" ? t("intake.translating") : t("intake.translateButton")}
        </button>
      )}
      {state === "failed" && <p role="alert">{t("intake.translateFailed")}</p>}
      {texts
        .filter((x) => card.translations[x])
        .map((x) => (
          <div className="translate-preview" key={x}>
            <span className="muted">{t("intake.translatePreview")}</span>
            <strong lang="ko">{card.translations[x]}</strong>
            <span dir="auto" className="muted">{x}</span>
          </div>
        ))}
      <p className="server-tag">{t("intake.translateServer", { name: TRANSLATION_SERVER.name })}</p>
    </section>
  );
}

/** One detail question: its choices, and a warning right under it if an emergency sign is chosen. */
function DetailQuestion({ id }: { id: DetailId }) {
  const { t } = useI18n();
  const { card, detail } = useCard();
  const q = DETAILS[id];
  const chosen = card.details[id] ?? [];
  return (
    <section className="detail-q" aria-labelledby={"dq-" + id}>
      <h2 id={"dq-" + id}>{t(detailKey(id))}</h2>
      <div className={"choices" + (q.options.length === 3 && !q.many ? " three" : "")}>
        {q.options.map((o) => (
          <Chip key={o} on={chosen.includes(o)} onClick={() => detail(id, o, q.many)}>
            {t(optionKey(id, o))}
          </Chip>
        ))}
      </div>
      {chosen.some((o) => isDanger(id, o)) && <DangerNotice />}
    </section>
  );
}

/** A possible emergency sign was chosen: say so right there, with a way to call. */
function DangerNotice() {
  const { t } = useI18n();
  return (
    <a className="emergency-strip danger-notice" href="tel:119" role="alert">
      <Siren size={20} aria-hidden />
      <span className="sos-text">
        <span className="sos-title">{t("intake.dangerNotice")}</span>
        <span className="sos-more" dir="ltr">119</span>
      </span>
    </a>
  );
}

// Remember the step while the student visits another tab (e.g. to photograph a medicine).
let lastStep: Step = "main";

/**
 * Search plus category browse.
 * Main step: one pick, or the student's own words when nothing matches.
 * Associated step (`suggested` given): any number of picks across all categories. It starts on the suggested
 * (related) symptoms until a category is tapped, and keeps picked symptoms at the top of whatever list is showing.
 */
function SymptomSearch({
  picked,
  onPick,
  suggested,
  exclude,
}: {
  picked: string[];
  onPick: (id: string, custom?: string) => void;
  suggested?: string[];
  exclude?: string;
}) {
  const { t, variants, locale } = useI18n();
  const multi = !!suggested;
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | null>(multi ? null : "BFR");
  const found = query ? symptomIds.filter((id) => matches(variants(symptomKey(id)), query, locale)) : [];
  const shown = (
    query ? found : cat ? symptomIds.filter((id) => (SYMPTOMS[id].cats as string[]).includes(cat)) : (suggested ?? [])
  ).filter((id) => id !== exclude);
  const list = multi && !query ? [...picked.filter((id) => !shown.includes(id)), ...shown] : shown;
  // "Search symptoms (e.g. fever, cough)": the examples go under the field so the placeholder is never cut off.
  const full = t("intake.searchPlaceholder");
  const parts = full.match(/^(.*?)\s*[(（](.*)[)）]\s*$/);
  return (
    <>
      <label className="search">
        <Search size={18} aria-hidden />
        <input
          type="search"
          dir="auto"
          value={query}
          placeholder={parts ? parts[1] : full}
          aria-label={full}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button type="button" className="clear" aria-label={t("common.clear")} onClick={() => setQuery("")}>
            <X size={20} aria-hidden />
          </button>
        )}
      </label>
      {parts && !query && <p className="search-hint">{parts[2]}</p>}
      {!query && (
        <div className="cats" role="group" aria-label={t("intake.browse")}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className="cat"
              aria-pressed={cat === c}
              onClick={() => setCat(multi && cat === c ? null : c)}
            >
              {cat === c && <Check size={16} aria-hidden />}
              {t(categoryKey(c))}
            </button>
          ))}
        </div>
      )}
      <div className="choices">
        {list.map((id) => (
          <Chip key={id} on={picked.includes(id)} onClick={() => onPick(id)}>
            {t(symptomKey(id))}
          </Chip>
        ))}
      </div>
      {query && !multi && (
        <button type="button" className="own" onClick={() => onPick("", query)}>
          <Pencil size={20} aria-hidden />
          <span>
            {t("intake.noResult")} · <bdi>{query}</bdi>
          </span>
        </button>
      )}
    </>
  );
}

export function Intake({ start }: { start?: string }) {
  const { t } = useI18n();
  const { card, set, toggle, removeMed } = useCard();
  const loc = symptom(card.main)?.loc;
  const details = useMemo(() => detailsFor(card.main), [card.main]);
  const steps = useMemo<Step[]>(
    () => [
      "main",
      ...(loc ? (["area"] as Step[]) : []),
      ...(details.length ? (["detail"] as Step[]) : []),
      "onset", "pain", "assoc", "allergyMeds", "history", "notes",
    ],
    [loc, details.length],
  );
  const [step, setStepState] = useState<Step>(() => (steps.includes(lastStep) ? lastStep : "main"));
  const setStep = (s: Step) => {
    lastStep = s;
    setStepState(s);
    window.scrollTo(0, 0);
  };

  // Started from a quick symptom on Home or an info page.
  useEffect(() => {
    if (start && symptom(start)) {
      set({ main: start, mainText: "", area: "", side: "", details: {} });
      const next: Step = symptom(start)?.loc ? "area" : detailsFor(start).length ? "detail" : "onset";
      lastStep = next;
      setStepState(next);
      history.replaceState(null, "", href("card"));
    }
  }, [start]);

  const index = Math.max(0, steps.indexOf(step));
  const hasMain = !!(card.main || card.mainText);
  const next = () => (index === steps.length - 1 ? finish() : setStep(steps[index + 1]));
  const back = () => (index === 0 ? go("home") : setStep(steps[index - 1]));
  function finish() {
    lastStep = "main";
    go("card", "view");
  }

  const related = useMemo(() => {
    const cats: Category[] = symptom(card.main)?.cats.filter((c) => c !== "BFR") ?? [];
    const same = symptomIds.filter((id) => id !== card.main && symptom(id)!.cats.some((c) => cats.includes(c)));
    return [...new Set([...same, ...COMMON_ASSOC])].filter((id) => id !== card.main);
  }, [card.main]);

  return (
    <section className="intake">
      <div className="steps-head">
        <span className="step-count">{t("intake.step", { n: index + 1, total: steps.length })}</span>
        <span className="step-name">{t(STEP_LABEL[step])}</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label={t("intake.title")}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={index + 1}
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((s, i) => (
          <span key={s} className={i <= index ? "on" : undefined} />
        ))}
      </div>

      {step === "main" && (
        <>
          <h1>{t("intake.stepMain")}</h1>
          <p className="step-hint">{t("intake.mainHint")}</p>
          {card.mainText && (
            <div className="picked">
              <Pencil size={20} aria-hidden />
              <span>
                <bdi>{card.mainText}</bdi>
              </span>
              <button type="button" aria-label={t("common.clear")} onClick={() => set({ mainText: "" })}>
                <X size={20} aria-hidden />
              </button>
            </div>
          )}
          <SymptomSearch
            picked={card.main ? [card.main] : []}
            onPick={(id, custom) =>
              set(
                custom
                  ? { main: "", mainText: custom, area: "", side: "", details: {} }
                  : { main: card.main === id ? "" : id, mainText: "", area: "", side: "", details: {} },
              )
            }
          />
        </>
      )}

      {step === "area" && (
        <>
          {loc === "area" && (
            <>
              <h1>{t("intake.areaTitle")}</h1>
              <div className="choices">
                {AREAS.map((a) => (
                  <Chip key={a} on={card.area === a} onClick={() => set({ area: card.area === a ? "" : a })}>
                    {t(("area." + a) as MessageKey)}
                  </Chip>
                ))}
              </div>
            </>
          )}
          {loc === "side" ? <h1>{t("intake.sideTitle")}</h1> : <h2>{t("intake.sideTitle")}</h2>}
          <div className="choices three">
            {SIDES.map((s) => (
              <Chip key={s} on={card.side === s} onClick={() => set({ side: card.side === s ? "" : s })}>
                {t(sideKey(s))}
              </Chip>
            ))}
          </div>
        </>
      )}

      {step === "detail" && (
        <>
          <h1>{t("intake.detailTitle")}</h1>
          <p className="step-hint">{t("intake.detailSub")}</p>
          {details.map((id) => (
            <DetailQuestion key={id} id={id} />
          ))}
        </>
      )}

      {step === "onset" && (
        <>
          <h1>{t("q.onset")}</h1>
          <div className="choices">
            {ONSETS.map((o) => (
              <Chip key={o} on={card.onset === o} onClick={() => set({ onset: card.onset === o ? "" : o })}>
                {t(("onset." + o) as MessageKey)}
              </Chip>
            ))}
          </div>
        </>
      )}

      {step === "pain" && (
        <>
          <h1>{t("q.pain")}</h1>
          <div className="vas" role="radiogroup" aria-label={t("card.pain")}>
            {Array.from({ length: 11 }, (_, n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={card.pain === n}
                className={"vas-" + Math.floor(n / 2) * 2}
                onClick={() => set({ pain: n })}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="vas-label" aria-live="polite">
            {typeof card.pain === "number" ? t(vasKey(card.pain)) : " "}
          </p>
          <Chip on={card.pain === null} onClick={() => set({ pain: card.pain === null ? undefined : null })}>
            {t("intake.painSkip")}
          </Chip>
          <h2>{t("intake.tempTitle")}</h2>
          <div className="row">
            <label className="temp">
              <input
                type="number"
                inputMode="decimal"
                min="34"
                max="43"
                step="0.1"
                value={card.temp}
                aria-label={t("card.temperature")}
                onChange={(e) => set({ temp: e.target.value })}
              />
              <span>℃</span>
            </label>
            <Chip on={!card.temp} onClick={() => set({ temp: "" })}>
              {t("intake.tempNone")}
            </Chip>
          </div>
        </>
      )}

      {step === "assoc" && (
        <>
          <h1>{t("q.associated")}</h1>
          <SymptomSearch picked={card.assoc} suggested={related} exclude={card.main} onPick={(id) => toggle("assoc", id)} />
        </>
      )}

      {step === "allergyMeds" && (
        <>
          <h1>{t("intake.allergyTitle")}</h1>
          <div className="choices three">
            {(["none", "yes", "unknown"] as const).map((a) => (
              <Chip key={a} on={card.allergy === a} onClick={() => set({ allergy: card.allergy === a ? "" : a })}>
                {t(("allergy." + a) as MessageKey)}
              </Chip>
            ))}
          </div>
          {card.allergy === "yes" && (
            <div className="sub">
              <h2>{t("intake.allergyWhat")}</h2>
              <div className="choices">
                {ALLERGY_KINDS.map((k) => (
                  <Chip key={k} on={card.allergyKinds.includes(k)} onClick={() => toggle("allergyKinds", k)}>
                    {t(("allergy." + k) as MessageKey)}
                  </Chip>
                ))}
              </div>
              <input
                dir="auto"
                value={card.allergyText}
                placeholder={t("intake.allergyText")}
                aria-label={t("intake.allergyText")}
                onChange={(e) => set({ allergyText: e.target.value })}
              />
            </div>
          )}
          <h1 className="second">{t("intake.medsTitle")}</h1>
          <div className="choices three">
            {(["none", "yes", "unknown"] as const).map((a) => (
              <Chip key={a} on={card.take === a} onClick={() => set({ take: card.take === a ? "" : a })}>
                {t(("take." + a) as MessageKey)}
              </Chip>
            ))}
          </div>
          {(card.take === "yes" || card.takeItems.length > 0) && (
            <div className="sub">
              {card.takeItems.map((m) => (
                <div className="picked" key={m.id}>
                  <span lang="ko">{m.name}</span>
                  <button type="button" aria-label={t("common.clear")} onClick={() => removeMed(m.id)}>
                    <X size={20} aria-hidden />
                  </button>
                </div>
              ))}
              <a className="button" href={href("meds")}>
                <Camera size={18} aria-hidden /> {t("intake.medsFromPhoto")}
              </a>
              <input
                dir="auto"
                value={card.takeText}
                placeholder={t("intake.medsText")}
                aria-label={t("intake.medsText")}
                onChange={(e) => set({ takeText: e.target.value })}
              />
            </div>
          )}
        </>
      )}

      {step === "history" && (
        <>
          <h1>{t("q.past")}</h1>
          <div className="choices">
            {PAST.map((p) => (
              <Chip key={p} on={card.past.includes(p)} onClick={() => toggle("past", p)}>
                {t(("past." + p) as MessageKey)}
              </Chip>
            ))}
          </div>
          <h2>{t(detailKey("family"))}</h2>
          <div className="choices">
            {DETAILS.family.options.map((f) => (
              <Chip key={f} on={card.family.includes(f)} onClick={() => toggle("family", f)}>
                {t(optionKey("family", f))}
              </Chip>
            ))}
          </div>
          <h2>{t("intake.pregTitle")}</h2>
          <div className="choices">
            {PREGNANCY.map((p) => (
              <Chip key={p} on={card.preg === p} onClick={() => set({ preg: card.preg === p ? "" : p })}>
                {t(("preg." + p) as MessageKey)}
              </Chip>
            ))}
          </div>
          <h1 className="second">{t("intake.lifeTitle")}</h1>
          {GENERAL.map((id) => (
            <DetailQuestion key={id} id={id} />
          ))}
        </>
      )}

      {step === "notes" && (
        <>
          <h1>{t("q.toDoctor")}</h1>
          <textarea
            dir="auto"
            value={card.notes}
            placeholder={t("intake.notesPlaceholder")}
            aria-label={t("q.toDoctor")}
            maxLength={1000}
            onChange={(e) => set({ notes: e.target.value })}
          />
          <Dictate append={(text) => set({ notes: [card.notes, text].filter(Boolean).join(" ") })} />
          <TranslateBox />
        </>
      )}

      <div className="step-actions">
        <button type="button" onClick={back}>
          <ArrowLeft className="flip" size={18} aria-hidden />
          {t("common.back")}
        </button>
        <button type="button" className="primary" disabled={step === "main" && !hasMain} onClick={next}>
          {index === steps.length - 1 ? t("common.done") : t("common.next")}
          <ArrowRight className="flip" size={18} aria-hidden />
        </button>
      </div>
      {hasMain && step !== "main" && index < steps.length - 1 && (
        <button type="button" className="ghost make-now" onClick={finish}>
          {t("intake.makeNow")}
        </button>
      )}
    </section>
  );
}
