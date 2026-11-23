// Conversational intake: pick a main symptom, then one question at a time. Each answer decides the next
// question through the Simtomi branch data (src/intake/engine.ts). Associated symptoms can be added or removed
// at any time and appear as chips at the top. Answers are only collected here; nothing is diagnosed.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Camera, Check, Languages, ListChecks, Mic, Pencil, Phone, Plus, RotateCcw, Search, Siren, X } from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";
import { go, href } from "../app/router";
import { useCard, type Card, type Value } from "../state/card";
import { Tick } from "../components/ui";
import { Dictate } from "../components/Dictate";
import { ALLERGY_KINDS, CATEGORIES, ONSETS, PREGNANCY, categoryKey, symptom, symptomKey } from "../content/symptoms";
import { hear, type Speech } from "../intake/speech";
import { DETAILS, detailKey, optionKey } from "../content/details";
import { TRANSLATION_SERVER, translateOnServer } from "../lib/translate";
import { useIntakeText, type IntakeText } from "../intake/text";
import * as E from "../intake/engine";
import {
  HISTORY_KINDS, LIFE, answerRows, answeredSteps, currentStep, departments, flowLines, historyFor, historyRows, historyStep,
  naruId, previousStep, remainingSteps, sequence, stepsAbout, type HistoryKind, type Row,
} from "../intake/sequence";
import "../intake/intake.css";

type T = (k: MessageKey, p?: Record<string, string | number>) => string;
/** "Search symptoms (e.g. fever, cough)": the examples go under the field so the placeholder is never cut off. */
function searchLabel(full: string) {
  const parts = full.match(/^(.*?)s*[(（](.*)[)）]s*$/);
  return parts ? { placeholder: parts[1], hint: parts[2] } : { placeholder: full, hint: "" };
}

type Ctx = { x: IntakeText; flow: E.Flow; update: (f: E.Flow) => void; t: T };

/** Banners dismissed in this tab ("level:step:option"), kept across tab switches. */
const dismissed = new Set<string>();

export function Intake({ start }: { start?: string }) {
  const { t } = useI18n();
  const { text, failed, retry } = useIntakeText();
  if (failed)
    return (
      <section className="ix">
        <p role="alert">{t("common.loading")}…</p>
        <button type="button" onClick={retry}>
          <RotateCcw size={18} aria-hidden /> {t("common.retry")}
        </button>
      </section>
    );
  if (!text)
    return (
      <section className="ix" aria-busy="true">
        <p className="muted">{t("common.loading")}</p>
      </section>
    );
  return <Flow x={text} start={start} />;
}

function Flow({ x, start }: { x: IntakeText; start?: string }) {
  const { t } = useI18n();
  const { bank } = x;
  const { card, set } = useCard();
  const flow = card.flow;
  const update = (f: E.Flow) => set({ flow: f });
  const [prefill, setPrefill] = useState("");
  const [sheet, setSheet] = useState(false);
  // Going back to the symptom list without throwing the answers away: they survive if the same one is picked.
  const [picking, setPicking] = useState(false);
  const [, rerender] = useState(0);

  // Keep the card's derived fields in step with the answers.
  useEffect(() => {
    const patch: Partial<Card> = {};
    const lines = flowLines(bank, flow, card);
    if (JSON.stringify(lines) !== JSON.stringify(card.flowLines)) patch.flowLines = lines;
    const depts = departments(bank, flow);
    if (depts.join() !== card.depts.join()) patch.depts = depts;
    const main = flow.main ? naruId(bank, flow.main) : "";
    if (main !== card.main) patch.main = main;
    if (flow.mainText !== card.mainText) patch.mainText = flow.mainText;
    if (Object.keys(patch).length) set(patch);
  }, [flow, card.onset, card.flowLines, card.depts, card.main, card.mainText]);

  // Started from a shortcut (#/card/<id>): a Simtomi id or one of NARU's older symptom ids.
  useEffect(() => {
    if (!start) return;
    const sid = bank.symptoms[start] ? start : bank.naru[start];
    if (sid) set({ ...resetIntake(), flow: E.setMain(bank, sid, flow.sex, flow.age) });
    else if (symptom(start)) setPrefill(t(symptomKey(start)));
    history.replaceState(null, "", href("card"));
  }, [start]);

  const ctx: Ctx = { x, flow, update, t };
  const chosen = !!flow.main || !!flow.mainText;
  if (!chosen || picking)
    return (
      <Start
        ctx={ctx}
        prefill={prefill}
        resume={chosen}
        onPick={(sid) => {
          setPicking(false);
          if (sid !== flow.main) set({ ...resetIntake(), flow: E.setMain(bank, sid, flow.sex, flow.age) });
        }}
        onOwn={(text) => {
          setPicking(false);
          if (text !== flow.mainText) set({ ...resetIntake(), flow: E.setOwnWords(text, flow.sex, flow.age) });
        }}
        onCancel={chosen ? () => setPicking(false) : undefined}
        onSpoken={(heard, text) => {
          setPicking(false);
          set({ ...resetIntake(), notes: text, onset: heard.onset, flow: heard.flow });
        }}
      />
    );

  const step = currentStep(bank, flow);
  return (
    <section className="ix">
      <Alerts ctx={ctx} onChange={() => rerender((n) => n + 1)} />
      <Chips ctx={ctx} onAdd={() => setSheet(true)} onChangeMain={() => setPicking(true)} />
      {step ? (
        <StepScreen ctx={ctx} step={step} onBack={() => setPicking(true)} />
      ) : (
        <Summary ctx={ctx} onAdd={() => setSheet(true)} />
      )}
      {sheet && <AddSheet ctx={ctx} onClose={() => setSheet(false)} />}
    </section>
  );
}

/** Throw the card away and start over. The intake is kept between visits to the tab, which is what makes
 *  this necessary: without it a half-answered card from yesterday is the only card there is. */
function Restart() {
  const { t } = useI18n();
  const { reset } = useCard();
  const [asking, setAsking] = useState(false);
  if (!asking)
    return (
      <button type="button" className="ix-plain" onClick={() => setAsking(true)}>
        {t("intake.restart")}
      </button>
    );
  return (
    <div className="confirm" role="alertdialog" aria-label={t("card.clearConfirm")}>
      <p>{t("card.clearConfirm")}</p>
      <div className="row">
        <button type="button" onClick={() => setAsking(false)}>
          {t("common.cancel")}
        </button>
        <button type="button" className="danger" onClick={reset}>
          {t("intake.restart")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- the opening screens

type Stage = "intro" | "sex" | "age" | "way" | "speak" | "heard" | "pick";

/** Before any question: what the card is, then the two facts every intake starts from, then the symptom.
 *  One thing per screen with a way back, so the start of the intake has the same shape as the rest of it. */
function Start({
  ctx, prefill, resume, onPick, onOwn, onCancel, onSpoken,
}: {
  ctx: Ctx;
  prefill: string;
  /** Returning to change a symptom already chosen: the opening screens are behind us. */
  resume: boolean;
  onPick: (sid: string) => void;
  onOwn: (text: string) => void;
  onCancel?: () => void;
  onSpoken: (heard: Speech, text: string) => void;
}) {
  const { t } = useI18n();
  const { x, flow, update } = ctx;
  const [spoken, setSpoken] = useState("");
  const [heard, setHeard] = useState<Speech | null>(null);
  const [stage, setStage] = useState<Stage>(resume || prefill ? "pick" : "intro");
  // "" is both "prefer not to say" and "not asked yet", so nothing is drawn as chosen until it is chosen.
  const [sexAsked, setSexAsked] = useState(!!flow.sex);
  useEffect(() => {
    if (prefill) setStage("pick");
  }, [prefill]);

  /** `to` is the screen behind this one; with none, the back button leaves the picker as it was. */
  const bar = (to: Stage | null) => (
    <div className="ix-bar">
      <button type="button" className="ix-back" disabled={!to && !onCancel} onClick={() => (to ? setStage(to) : onCancel?.())}>
        <ArrowLeft className="flip" size={18} aria-hidden /> {t("intake.back")}
      </button>
    </div>
  );

  if (stage === "intro")
    return (
      <section className="ix ix-ask">
        <h1>{t("intake.introTitle")}</h1>
        <p className="ix-hint">{t("intake.introBody")}</p>
        <ol className="ix-steps">
          <li>{t("intake.introStep1")}</li>
          <li>{t("intake.introStep2")}</li>
          <li>{t("intake.introStep3")}</li>
        </ol>
        <p className="ix-notice">{t("intake.introCost")}</p>
        <button type="button" className="primary wide" onClick={() => setStage("sex")}>
          {t("intake.start")}
        </button>
      </section>
    );

  if (stage === "sex")
    return (
      <section className="ix ix-ask">
        {bar(resume ? null : "intro")}
        <h1>{x.it("ui.sexTitle")}</h1>
        <p className="ix-hint">{x.it("ui.sexWhy")}</p>
        <div className="ix-seg">
          {(["F", "M", ""] as const).map((sx) => (
            <button
              key={sx || "x"}
              type="button"
              aria-pressed={sexAsked && flow.sex === sx}
              onClick={() => {
                setSexAsked(true);
                update({ ...flow, sex: sx });
                setStage("age");
              }}
            >
              {x.it(sx === "F" ? "ui.sexF" : sx === "M" ? "ui.sexM" : "ui.sexX")}
            </button>
          ))}
        </div>
      </section>
    );

  if (stage === "age")
    return (
      <section className="ix ix-ask">
        {bar("sex")}
        <h1>{t("intake.ageTitle")}</h1>
        <p className="ix-hint">{t("intake.ageWhy")}</p>
        <label className="ix-age">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={flow.age}
            aria-label={t("intake.ageLabel")}
            onChange={(e) => update({ ...flow, age: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })}
          />
          <span aria-hidden>{t("intake.ageUnit")}</span>
        </label>
        <button type="button" className="primary wide" onClick={() => setStage("way")}>
          {x.it("ui.next")}
        </button>
        <button
          type="button"
          className="ix-plain"
          onClick={() => {
            update({ ...flow, age: "" });
            setStage("way");
          }}
        >
          {x.it("ui.skip")}
        </button>
      </section>
    );

  // Two ways in. Tapping through the list is the sure one; speaking first is the short one, and the
  // screen says plainly that it takes a moment and that it only fills in what it recognises.
  if (stage === "way")
    return (
      <section className="ix ix-ask">
        {bar("age")}
        <h1>{t("intake.wayTitle")}</h1>
        <div className="ix-ways">
          <button type="button" className="ix-way" onClick={() => setStage("pick")}>
            <ListChecks size={24} aria-hidden />
            <span>
              <strong>{t("intake.wayPick")}</strong>
              <small>{t("intake.wayPickSub")}</small>
            </span>
          </button>
          <button type="button" className="ix-way" onClick={() => setStage("speak")}>
            <Mic size={24} aria-hidden />
            <span>
              <strong>{t("intake.waySpeak")}</strong>
              <small>{t("intake.waySpeakSub")}</small>
            </span>
          </button>
        </div>
      </section>
    );

  if (stage === "speak")
    return (
      <section className="ix ix-ask">
        {bar("way")}
        <h1>{t("intake.speakTitle")}</h1>
        <p className="ix-hint">{t("intake.speakHint")}</p>
        <textarea
          dir="auto"
          value={spoken}
          maxLength={500}
          aria-label={t("intake.speakTitle")}
          placeholder={t("intake.speakExample")}
          onChange={(e) => setSpoken(e.target.value)}
        />
        <Dictate append={(text) => setSpoken((now) => [now, text].filter(Boolean).join(" "))} />
        <p className="ix-notice">{t("intake.speakSlow")}</p>
        <button
          type="button"
          className="primary wide"
          disabled={!spoken.trim()}
          onClick={() => {
            setHeard(hear(x, spoken.trim(), flow.sex, flow.age, onsetLabels(t)));
            setStage("heard");
          }}
        >
          {t("intake.speakGo")}
        </button>
      </section>
    );

  // Nothing starts from speech alone: this screen is where the student corrects what was heard.
  if (stage === "heard" && heard)
    return (
      <section className="ix ix-ask">
        {bar("speak")}
        <h1>{t("intake.heardTitle")}</h1>
        {heard.found.length === 0 ? (
          <p className="ix-notice">{t("intake.heardNone")}</p>
        ) : (
          <>
            <p className="ix-hint">{t("intake.heardFilled", { n: heard.filled })}</p>
            <div className="ix-chips plain">
              <span className="ix-chip is-main">
                <span className="ix-chip-tag">{x.it("ui.main")}</span>
                <bdi>{x.sn(heard.found[0])}</bdi>
              </span>
              {heard.flow.manual.map((sid) => (
                <span className="ix-chip" key={sid}>
                  <bdi>{x.sn(sid)}</bdi>
                  <button
                    type="button"
                    aria-label={x.it("ui.removeSymptom", { name: x.sn(sid) })}
                    onClick={() => setHeard({ ...heard, flow: E.toggleSymptom(x.bank, heard.flow, sid) })}
                  >
                    <X size={16} aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          </>
        )}
        <button type="button" className="primary wide" onClick={() => onSpoken(heard, spoken.trim())}>
          <Check size={18} aria-hidden /> {t("intake.heardGo")}
        </button>
        <button type="button" className="ix-plain" onClick={() => setStage("pick")}>
          {t("intake.heardOther")}
        </button>
      </section>
    );

  return <Picker ctx={ctx} prefill={prefill || spoken} onPick={onPick} onOwn={onOwn} bar={bar(resume ? null : "way")} />;
}

/** The onset question's own words, which a spoken sentence is matched against. */
const onsetLabels = (t: T): Record<string, string> =>
  Object.fromEntries(ONSETS.map((o) => [o, t(("onset." + o) as MessageKey)]));

/** Card fields the intake owns; cleared when a new main symptom starts a new intake. */
const resetIntake = (): Partial<Card> => ({ onset: "", preg: "", notes: "", details: {}, flowLines: [], depts: [] });

// ---------------------------------------------------------------- picker

function Picker({ ctx, prefill, onPick, onOwn, bar }: { ctx: Ctx; prefill: string; onPick: (sid: string) => void; onOwn: (text: string) => void; bar?: ReactNode }) {
  const { t } = useI18n();
  const { x, flow, update } = ctx;
  const { bank } = x;
  const [query, setQuery] = useState(prefill);
  const [cat, setCat] = useState<string>("BFR");
  useEffect(() => setQuery(prefill), [prefill]);
  const allowed = (sid: string) => E.sexOk(flow.sex, bank.symptoms[sid]);
  const cats = useMemo(() => CATEGORIES.filter((c) => Object.values(bank.symptoms).some((s) => s.cats.includes(c))), [bank]);
  const list = (query.trim()
    ? x.search(query)
    : cat === "BFR"
      ? bank.common
      : Object.keys(bank.symptoms).filter((s) => bank.symptoms[s].cats.includes(cat)).sort((a, b) => x.sn(a).localeCompare(x.sn(b)))
  ).filter(allowed);
  const results = query.trim() ? list.slice(0, 30) : list;

  return (
    <section className="ix ix-pick">
      {bar}
      <h1>{x.it("ui.pickTitle")}</h1>
      <p className="ix-hint">{x.it("ui.pickHint")}</p>

      <label className="search">
        <Search size={18} aria-hidden />
        <input type="search" dir="auto" value={query} placeholder={searchLabel(x.it("ui.search")).placeholder} aria-label={x.it("ui.search")} onChange={(e) => setQuery(e.target.value)} />
        {query && (
          <button type="button" className="clear" aria-label={t("common.clear")} onClick={() => setQuery("")}>
            <X size={20} aria-hidden />
          </button>
        )}
      </label>

      {!query.trim() && searchLabel(x.it("ui.search")).hint && <p className="search-hint">{searchLabel(x.it("ui.search")).hint}</p>}
      {!query.trim() && (
        <div className="cats" role="group" aria-label={x.it("ui.browse")}>
          {cats.map((c) => (
            <button key={c} type="button" className="cat" aria-pressed={cat === c} onClick={() => setCat(c)}>
              {t(categoryKey(c))}
            </button>
          ))}
        </div>
      )}

      <p className="ix-count" aria-live="polite">
        {query.trim() ? x.it("ui.results", { n: results.length }) : cat === "BFR" ? x.it("ui.common") : ""}
      </p>
      <div className="ix-options">
        {results.map((sid) => (
          <button key={sid} type="button" className="ix-opt" onClick={() => onPick(sid)}>
            <span className="ix-opt-label">{x.sn(sid)}</span>
          </button>
        ))}
      </div>
      {query.trim() && (
        <button type="button" className="own" onClick={() => onOwn(query.trim())}>
          <Pencil size={20} aria-hidden />
          <span>
            {x.it("ui.noResult")} · <bdi>{query.trim()}</bdi>
          </span>
        </button>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- chips and the add sheet

function Chips({ ctx, onAdd, onChangeMain }: { ctx: Ctx; onAdd: () => void; onChangeMain: () => void }) {
  const { x, flow, update, t } = ctx;
  const assoc = flow.main ? E.plan(x.bank, flow).associated : [];
  return (
    <div className="ix-chips" role="group" aria-label={x.it("ui.chips")}>
      <span className="ix-chip is-main">
        <span className="ix-chip-tag">{x.it("ui.main")}</span>
        <bdi>{flow.main ? x.sn(flow.main) : flow.mainText}</bdi>
        <button type="button" aria-label={t("intake.changeMain")} onClick={onChangeMain}>
          <Pencil size={16} aria-hidden />
        </button>
      </span>
      {assoc.map((sid) => (
        <span className="ix-chip" key={sid}>
          <bdi>{x.sn(sid)}</bdi>
          <button type="button" aria-label={x.it("ui.removeSymptom", { name: x.sn(sid) })} onClick={() => update(E.toggleSymptom(x.bank, flow, sid))}>
            <X size={16} aria-hidden />
          </button>
        </span>
      ))}
      {flow.main && (
        <button type="button" className="ix-add" onClick={onAdd}>
          <Plus size={18} aria-hidden /> {x.it("ui.addSymptom")}
        </button>
      )}
    </div>
  );
}

function AddSheet({ ctx, onClose }: { ctx: Ctx; onClose: () => void }) {
  const { t } = useI18n();
  const { x, flow, update } = ctx;
  const { bank } = x;
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const assoc = E.plan(bank, flow).associated;
  const list = (query.trim() ? x.search(query).slice(0, 30) : E.suggestions(bank, flow)).filter(
    (s) => s !== flow.main && E.sexOk(flow.sex, bank.symptoms[s]),
  );
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("input")?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <div className="ix-sheet-back" onClick={onClose}>
      <div className="ix-sheet" role="dialog" aria-modal="true" aria-labelledby="ix-add-title" ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="ix-sheet-head">
          <h2 id="ix-add-title">{x.it("ui.addTitle")}</h2>
          <button type="button" className="ix-icon" aria-label={x.it("ui.close")} onClick={onClose}>
            <X size={22} aria-hidden />
          </button>
        </div>
        <p className="ix-hint">{x.it("ui.addHint")}</p>
        <label className="search">
          <Search size={18} aria-hidden />
          <input type="search" dir="auto" value={query} placeholder={searchLabel(x.it("ui.search")).placeholder} aria-label={x.it("ui.search")} onChange={(e) => setQuery(e.target.value)} />
          {query && (
            <button type="button" className="clear" aria-label={t("common.clear")} onClick={() => setQuery("")}>
              <X size={20} aria-hidden />
            </button>
          )}
        </label>
        {!query.trim() && <h3 className="ix-sub">{x.it("ui.suggested")}</h3>}
        <div className="ix-options">
          {list.map((sid) => (
            <Choice key={sid} on={assoc.includes(sid)} onClick={() => update(E.toggleSymptom(bank, flow, sid))}>
              {x.sn(sid)}
            </Choice>
          ))}
        </div>
        <button type="button" className="primary wide" onClick={onClose}>
          {x.it("ui.next")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- emergency banner

const CALLS: Record<string, string[]> = { emergency: ["119"], crisis: ["109", "119"], assault: ["1366", "1577-1366"], urgent: [] };

function Alerts({ ctx, onChange }: { ctx: Ctx; onChange: () => void }) {
  const { x, flow } = ctx;
  const list = E.alerts(x.bank, flow).filter((a) => a.level !== "note");
  const ref = useRef<HTMLDivElement>(null);
  const top = list[0];
  const id = top ? `${top.level}:${top.key}:${top.option}` : "";
  const open = !!top && !dismissed.has(id);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [id, open]);
  if (!top) return null;
  const q = x.bank.questions[top.key.split("|").pop()!];
  const reason = q?.o[top.option] ? x.it(q.o[top.option].x) : "";
  const calls = CALLS[top.level];
  return (
    <div ref={ref} tabIndex={-1} className={"ix-alert is-" + top.level + (open ? "" : " is-small")} role="alert">
      <Siren size={22} aria-hidden />
      <div className="ix-alert-body">
        <strong>{x.it("ui.em." + top.level)}</strong>
        {open && <p>{x.it("ui.em." + top.level + "Body")}</p>}
        {open && reason && <p className="ix-alert-reason">{x.it("ui.em.reason", { text: reason })}</p>}
        <div className="ix-alert-actions">
          {calls.map((n) => (
            <a key={n} className="button ix-call" href={"tel:" + n}>
              <Phone size={18} aria-hidden /> {x.it("ui.em.call", { n })}
            </a>
          ))}
          {open && (
            <button
              type="button"
              onClick={() => {
                dismissed.add(id);
                onChange();
              }}
            >
              {x.it("ui.em.continue")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- one question

function StepScreen({ ctx, step, onBack }: { ctx: Ctx; step: E.Step; onBack: () => void }) {
  const { x, flow, update, t } = ctx;
  const { bank } = x;
  const head = useRef<HTMLHeadingElement>(null);
  const prev = previousStep(bank, flow, step.key);
  const count = answeredSteps(bank, flow);
  const total = sequence(bank, flow).length;
  // Skipping a symptom means answering its remaining questions with "skipped", so the card says so.
  const rest = step.owner ? stepsAbout(bank, flow, step.owner) : [];
  const editing = !!flow.cursor && !!flow.answers[step.key];

  useEffect(() => {
    head.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [step.key]);

  const done = (a: E.Answer) => update(E.answer(bank, { ...flow, cursor: null }, step.key, a));
  const title = stepTitle(ctx, step);
  const about = step.owner ? x.it("ui.about", { name: x.sn(step.owner) }) : x.it("ui.general");

  return (
    <>
      <div className="ix-bar">
        <button type="button" className="ix-back" onClick={() => (prev ? update(E.edit(flow, prev.key)) : onBack())}>
          <ArrowLeft className="flip" size={18} aria-hidden /> {prev ? x.it("ui.back") : t("intake.back")}
        </button>
        <span className="ix-progress" aria-live="polite">
          {t("intake.progress", { n: count + 1, total })}
        </span>
      </div>
      <Trail ctx={ctx} step={step} />
      <article className="ix-q" key={step.key} aria-labelledby={"q-" + step.key}>
        <p className="ix-about">{about}</p>
        <h1 id={"q-" + step.key} ref={head} tabIndex={-1}>
          {title}
        </h1>
        {editing && <p className="ix-editing">{x.it("ui.editing")}</p>}
        {step.qid.startsWith("G_") ? <GeneralStep ctx={ctx} step={step} onDone={done} /> : <SymptomStep ctx={ctx} step={step} onDone={done} />}
        <div className="ix-outs">
          {rest.length > 1 && (
            <button
              type="button"
              className="ix-plain"
              onClick={() =>
                update({
                  ...flow,
                  cursor: null,
                  answers: { ...flow.answers, ...Object.fromEntries(rest.map((s) => [s.key, { kind: "skip" } as const])) },
                })
              }
            >
              {t("intake.skipSymptom", { name: x.sn(step.owner), n: rest.length })}
            </button>
          )}
          {count > 0 && (
            <button type="button" className="ix-plain" onClick={() => update({ ...flow, cursor: null, done: true })}>
              {t("intake.finishNow")}
            </button>
          )}
          <Restart />
        </div>
      </article>
    </>
  );
}

/** Answered questions just before this one, folded into small cards that reopen the question. */
function Trail({ ctx, step }: { ctx: Ctx; step: E.Step }) {
  const { x, flow, update } = ctx;
  const seq = sequence(x.bank, flow);
  const at = seq.findIndex((s) => s.key === step.key);
  const before = seq.slice(0, at < 0 ? seq.length : at).filter((s) => flow.answers[s.key]).slice(-2);
  if (!before.length) return null;
  return (
    <ol className="ix-trail">
      {before.map((s) => (
        <li key={s.key}>
          <button type="button" onClick={() => update(E.edit(flow, s.key))}>
            <span className="ix-trail-q">{stepTitle(ctx, s)}</span>
            <span className="ix-trail-a">{answerText(ctx, s)}</span>
            <Pencil size={16} aria-hidden />
          </button>
        </li>
      ))}
    </ol>
  );
}

function stepTitle(ctx: Ctx, step: E.Step) {
  const { x, t } = ctx;
  if (!step.qid.startsWith("G_")) return x.it(x.bank.questions[step.qid].q);
  if (step.qid === "G_ONSET") return t("q.onset");
  if (step.qid === "G_ALLERGY") return t("intake.allergyTitle");
  if (step.qid === "G_MEDS") return t("intake.medsTitle");
  if (step.qid === "G_PREG") return t("intake.pregTitle");
  if (step.qid === "G_NOTES") return t("q.toDoctor");
  if (step.qid.startsWith("G_LIFE_")) return t(detailKey(step.qid.slice(7)));
  const kind = step.qid.slice(2).toLowerCase() as HistoryKind;
  return x.it("ui.h." + kind);
}

/** The answer in the student's language, for the folded cards. */
function answerText(ctx: Ctx, step: E.Step): string {
  const { x, flow } = ctx;
  const a = flow.answers[step.key];
  if (!a) return "";
  if (a.kind === "skip") return x.it("ui.ansSkip");
  if (a.kind === "unknown") return x.it("ui.ansUnknown");
  if (step.qid.startsWith("G_")) return generalAnswerText(ctx, step);
  const q = x.bank.questions[step.qid];
  if (a.kind === "no") {
    const none = q.o.find((o) => o.k === "none");
    return x.it(none && !E.isYesItem(q) ? none.x : "ui.ansNo");
  }
  if (a.kind === "pick") return (E.isYesItem(q) ? [x.it("ui.yes")] : a.options.map((i) => x.it(q.o[i].x))).join(", ");
  return "";
}

function generalAnswerText(ctx: Ctx, step: E.Step): string {
  const { x, flow, t } = ctx;
  const a = flow.answers[step.key];
  if (!a) return "";
  if (a.kind === "no") return t("common.none");
  if (a.kind !== "values") return "";
  if (step.qid === "G_ONSET") return a.values.map((v) => t(("onset." + v) as MessageKey)).join(", ");
  if (step.qid === "G_PREG") return a.values.map((v) => t(("preg." + v) as MessageKey)).join(", ");
  if (step.qid === "G_ALLERGY") return a.values.map((v) => t(("allergy." + v) as MessageKey)).join(", ");
  if (step.qid === "G_MEDS") return a.values.map((v) => t(("take." + v) as MessageKey)).join(", ");
  if (step.qid === "G_NOTES") return a.values.join(" ");
  if (step.qid.startsWith("G_LIFE_")) return a.values.map((v) => t(optionKey(step.qid.slice(7), v))).join(", ");
  return a.values.map((v) => x.it(x.bank.hist[v])).join(", ");
}

// ---------------------------------------------------------------- answer controls

function Choice({ on, onClick, children, img, alt }: { on: boolean; onClick: () => void; children: ReactNode; img?: string; alt?: string }) {
  return (
    <button type="button" className="ix-opt" aria-pressed={on} onClick={onClick}>
      <Tick />
      {img && <img src={"intake-img/" + img} alt={alt ?? ""} loading="lazy" />}
      <span className="ix-opt-label chip-label">
        <span className="hl">{children}</span>
      </span>
    </button>
  );
}

/** Not sure / skip, kept apart from no. */
function Escape({ ctx, onDone, current }: { ctx: Ctx; onDone: (a: E.Answer) => void; current?: E.Answer }) {
  const { x } = ctx;
  return (
    <div className="ix-escape">
      <button type="button" aria-pressed={current?.kind === "unknown"} onClick={() => onDone({ kind: "unknown" })}>
        {x.it("ui.unknown")}
      </button>
      <button type="button" aria-pressed={current?.kind === "skip"} onClick={() => onDone({ kind: "skip" })}>
        {x.it("ui.skip")}
      </button>
    </div>
  );
}

/** Pick one: the choice shows as chosen at once, then the next question comes up. */
function useChoose(onDone: (a: E.Answer) => void) {
  const [chosen, setChosen] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const choose = (id: string, a: E.Answer) => {
    if (chosen) return;
    setChosen(id);
    timer.current = window.setTimeout(() => onDone(a), 180);
  };
  return { chosen, choose };
}

function SymptomStep({ ctx, step, onDone }: { ctx: Ctx; step: E.Step; onDone: (a: E.Answer) => void }) {
  const { x, flow } = ctx;
  const q = x.bank.questions[step.qid];
  const prior = flow.answers[step.key];
  const vis = E.visibleOptions(x.bank, flow, step.qid, step.owner);
  const none = vis.find((i) => q.o[i].k === "none");
  const { chosen, choose } = useChoose(onDone);
  const [multi, setMulti] = useState<number[]>(prior?.kind === "pick" ? prior.options : prior?.kind === "no" && none !== undefined ? [none] : []);
  const img = q.img ? <img className="ix-q-img" src={"intake-img/" + q.img} alt={x.it("ui.imageOf", { name: x.it(q.q) })} /> : null;

  if (E.isYesItem(q)) {
    const yes = vis[0];
    const on = (id: string) => chosen === id || (!chosen && ((id === "yes" && prior?.kind === "pick") || (id === "no" && prior?.kind === "no")));
    return (
      <>
        {img}
        <p className="ix-yes-label">{x.it(q.o[yes].x)}</p>
        <div className="ix-options two">
          <Choice on={on("yes")} onClick={() => choose("yes", { kind: "pick", options: [yes] })}>
            {x.it("ui.yes")}
          </Choice>
          <Choice on={on("no")} onClick={() => choose("no", { kind: "no" })}>
            {x.it("ui.no")}
          </Choice>
        </div>
        <Escape ctx={ctx} onDone={onDone} current={prior} />
      </>
    );
  }

  if (E.isMulti(q)) {
    const toggle = (i: number) =>
      setMulti((now) => (now.includes(i) ? now.filter((n) => n !== i) : i === none ? [i] : [...now.filter((n) => n !== none), i]));
    const submit = () => onDone(multi.length === 1 && multi[0] === none ? { kind: "no" } : { kind: "pick", options: multi.filter((i) => i !== none) });
    return (
      <>
        {img}
        <p className="ix-hint">{x.it("ui.multi")}</p>
        <div className="ix-options" role="group" aria-labelledby={"q-" + step.key}>
          {vis.map((i) => (
            <Choice key={i} on={multi.includes(i)} onClick={() => toggle(i)} img={q.o[i].img}>
              {q.o[i].k === "add" && <Plus size={16} aria-hidden className="ix-add-mark" />}
              {x.it(q.o[i].x)}
            </Choice>
          ))}
        </div>
        <button type="button" className="primary wide ix-next" disabled={!multi.length} onClick={submit}>
          {x.it("ui.next")}
        </button>
        <Escape ctx={ctx} onDone={onDone} current={prior} />
      </>
    );
  }

  return (
    <>
      {img}
      <div className="ix-options" role="group" aria-labelledby={"q-" + step.key}>
        {vis.map((i) => {
          const id = String(i);
          const was = prior?.kind === "pick" ? prior.options.includes(i) : prior?.kind === "no" && i === none;
          return (
            <Choice
              key={i}
              on={chosen === id || (!chosen && !!was)}
              img={q.o[i].img}
              onClick={() => choose(id, i === none ? { kind: "no" } : { kind: "pick", options: [i] })}
            >
              {x.it(q.o[i].x)}
            </Choice>
          );
        })}
      </div>
      <Escape ctx={ctx} onDone={onDone} current={prior} />
    </>
  );
}

// ---------------------------------------------------------------- general block (NARU's own questions)

function GeneralStep({ ctx, step, onDone }: { ctx: Ctx; step: E.Step; onDone: (a: E.Answer) => void }) {
  const { t, locale } = useI18n();
  const { x, flow } = ctx;
  const { card, set, removeMed } = useCard();
  const prior = flow.answers[step.key];
  const { chosen, choose } = useChoose(onDone);
  const single = (options: readonly string[], keyOf: (o: string) => MessageKey, save: (o: string) => void, current?: string) => (
    <>
      <div className="ix-options">
        {options.map((o) => (
          <Choice
            key={o}
            on={chosen === o || (!chosen && current === o)}
            onClick={() => {
              save(o);
              choose(o, { kind: "values", values: [o] });
            }}
          >
            {t(keyOf(o))}
          </Choice>
        ))}
      </div>
      <Escape ctx={ctx} onDone={onDone} current={prior} />
    </>
  );

  if (step.qid === "G_ONSET") return single(ONSETS, (o) => ("onset." + o) as MessageKey, (o) => set({ onset: o }), card.onset);
  if (step.qid === "G_PREG") return single(PREGNANCY, (o) => ("preg." + o) as MessageKey, (o) => set({ preg: o }), card.preg);
  if (step.qid.startsWith("G_LIFE_")) {
    const id = step.qid.slice(7) as (typeof LIFE)[number];
    return single(DETAILS[id].options, (o) => optionKey(id, o), (o) => set({ details: { ...card.details, [id]: [o] } }), card.details[id]?.[0]);
  }
  if (step.qid.startsWith("G_") && HISTORY_KINDS.some((k) => step.qid === historyStep(k)))
    return <HistoryStep ctx={ctx} kind={step.qid.slice(2).toLowerCase() as HistoryKind} prior={prior} onDone={onDone} />;

  if (step.qid === "G_ALLERGY")
    return (
      <>
        <div className="ix-options">
          {(["none", "yes", "unknown"] as const).map((a) => (
            <Choice key={a} on={card.allergy === a} onClick={() => set({ allergy: a })}>
              {t(("allergy." + a) as MessageKey)}
            </Choice>
          ))}
        </div>
        {card.allergy === "yes" && (
          <div className="ix-sub-block">
            <h2>{t("intake.allergyWhat")}</h2>
            <div className="ix-options">
              {ALLERGY_KINDS.map((k) => (
                <Choice
                  key={k}
                  on={card.allergyKinds.includes(k)}
                  onClick={() => set({ allergyKinds: card.allergyKinds.includes(k) ? card.allergyKinds.filter((v) => v !== k) : [...card.allergyKinds, k] })}
                >
                  {t(("allergy." + k) as MessageKey)}
                </Choice>
              ))}
            </div>
            <input dir="auto" value={card.allergyText} placeholder={t("intake.allergyText")} aria-label={t("intake.allergyText")} onChange={(e) => set({ allergyText: e.target.value })} />
          </div>
        )}
        <button
          type="button"
          className="primary wide ix-next"
          disabled={!card.allergy}
          onClick={() => onDone(card.allergy === "none" ? { kind: "no" } : card.allergy === "unknown" ? { kind: "unknown" } : { kind: "values", values: ["yes"] })}
        >
          {x.it("ui.next")}
        </button>
        <Escape ctx={ctx} onDone={onDone} current={prior} />
      </>
    );

  if (step.qid === "G_MEDS")
    return (
      <>
        <div className="ix-options">
          {(["none", "yes", "unknown"] as const).map((a) => (
            <Choice key={a} on={card.take === a} onClick={() => set({ take: a })}>
              {t(("take." + a) as MessageKey)}
            </Choice>
          ))}
        </div>
        {(card.take === "yes" || card.takeItems.length > 0) && (
          <div className="ix-sub-block">
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
            <input dir="auto" value={card.takeText} placeholder={t("intake.medsText")} aria-label={t("intake.medsText")} onChange={(e) => set({ takeText: e.target.value })} />
          </div>
        )}
        <button
          type="button"
          className="primary wide ix-next"
          disabled={!card.take && !card.takeItems.length}
          onClick={() => onDone(card.take === "none" ? { kind: "no" } : card.take === "unknown" ? { kind: "unknown" } : { kind: "values", values: ["yes"] })}
        >
          {x.it("ui.next")}
        </button>
        <Escape ctx={ctx} onDone={onDone} current={prior} />
      </>
    );

  // G_NOTES
  return (
    <>
      <p className="ix-hint">{x.it("ui.notesHint")}</p>
      <textarea dir="auto" value={card.notes} placeholder={t("intake.notesPlaceholder")} aria-label={t("q.toDoctor")} maxLength={1000} onChange={(e) => set({ notes: e.target.value })} />
      <Dictate append={(text) => set({ notes: [card.notes, text].filter(Boolean).join(" ") })} />
      {locale !== "ko-KR" && <TranslateBox />}
      <button
        type="button"
        className="primary wide ix-next"
        onClick={() => onDone(card.notes.trim() ? { kind: "values", values: [card.notes.trim()] } : { kind: "skip" })}
      >
        {x.it("ui.toSummary")}
      </button>
    </>
  );
}

function HistoryStep({ ctx, kind, prior, onDone }: { ctx: Ctx; kind: HistoryKind; prior?: E.Answer; onDone: (a: E.Answer) => void }) {
  const { t } = useI18n();
  const { x, flow } = ctx;
  const list = historyFor(x.bank, flow, kind);
  const [sel, setSel] = useState<string[]>(prior?.kind === "values" ? prior.values : prior?.kind === "no" ? ["none"] : []);
  const toggle = (v: string) => setSel((now) => (now.includes(v) ? now.filter((n) => n !== v) : v === "none" ? ["none"] : [...now.filter((n) => n !== "none"), v]));
  return (
    <>
      <p className="ix-hint">{x.it("ui.multi")}</p>
      <div className="ix-options">
        {list.map((v) => (
          <Choice key={v} on={sel.includes(v)} onClick={() => toggle(v)}>
            {x.it(x.bank.hist[v])}
          </Choice>
        ))}
        <Choice on={sel.includes("none")} onClick={() => toggle("none")}>
          {t("common.none")}
        </Choice>
      </div>
      <button
        type="button"
        className="primary wide ix-next"
        disabled={!sel.length}
        onClick={() => onDone(sel.includes("none") ? { kind: "no" } : { kind: "values", values: sel })}
      >
        {x.it("ui.next")}
      </button>
      <Escape ctx={ctx} onDone={onDone} current={prior} />
    </>
  );
}

/** The student's own words, translated for staff only on request (after a notice that text leaves the device). */
function TranslateBox() {
  const { t, locale } = useI18n();
  const { card, set } = useCard();
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  const texts = [card.flow.mainText, card.allergyText, card.takeText, card.notes].map((s) => s.trim()).filter(Boolean);
  if (!texts.length) return null;
  const missing = texts.filter((s) => !card.translations[s]);
  async function run() {
    setState("busy");
    try {
      const next = { ...card.translations };
      for (const s of missing) next[s] = await translateOnServer(s, locale);
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
      <p className="server-tag">{t("intake.translateServer", { name: TRANSLATION_SERVER.name })}</p>
    </section>
  );
}

// ---------------------------------------------------------------- summary

function Summary({ ctx, onAdd }: { ctx: Ctx; onAdd: () => void }) {
  const { t } = useI18n();
  const { x, flow, update } = ctx;
  const { reset } = useCard();
  const [confirm, setConfirm] = useState(false);
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => head.current?.focus({ preventScroll: true }), []);
  const value = (v: Value) =>
    "text" in v ? v.text : "it" in v ? x.it(v.it, v.params) : "sym" in v ? x.sn(v.sym) : t(v.key, v.params);
  const open = (key: string) => update(E.edit(flow, key));
  const answers = flow.main ? answerRows(x.bank, flow) : [];
  const history = historyRows(x.bank, flow);
  const assoc = flow.main ? E.plan(x.bank, flow).associated : [];
  const left = remainingSteps(x.bank, flow);
  const general = sequence(x.bank, flow).filter((s) => s.qid.startsWith("G_") && !s.qid.startsWith("G_PAST") && !s.qid.startsWith("G_DRUG") && !s.qid.startsWith("G_FAMILY"));

  const answered = (s: E.Step) => !!flow.answers[s.key] && flow.answers[s.key].kind !== "skip";
  const historyGeneral = general.filter((s) => (s.qid === "G_ALLERGY" || s.qid === "G_MEDS") && answered(s));
  const otherGeneral = general.filter((s) => s.qid !== "G_ALLERGY" && s.qid !== "G_MEDS" && answered(s));
  const generalRow = (s: E.Step) => (
    <li key={s.key}>
      <button type="button" className="ix-row" onClick={() => open(s.key)}>
        <span className="ix-row-q">{stepTitle(ctx, s)}</span>
        <span className="ix-row-a">{answerText(ctx, s)}</span>
        <Pencil size={16} aria-hidden className="ix-row-edit" />
      </button>
    </li>
  );
  const row = (r: Row) => (
    <li key={r.key}>
      <button type="button" className={"ix-row" + (r.danger ? " is-danger" : r.note ? " is-note" : "")} onClick={() => open(r.key)}>
        <span className="ix-row-q">
          {r.labelIt ? x.it(r.labelIt) : t(r.label)}
          {r.about && <span className="muted"> · {x.sn(r.about)}</span>}
        </span>
        <span className="ix-row-a">{r.values.map(value).join(", ")}</span>
        {r.danger && <Siren size={16} aria-hidden className="ix-row-flag" />}
        <Pencil size={16} aria-hidden className="ix-row-edit" />
      </button>
    </li>
  );

  return (
    <section className="ix-summary">
      <h1 ref={head} tabIndex={-1}>
        {x.it("ui.summaryTitle")}
      </h1>
      <p className="ix-hint">{x.it("ui.summaryHint")}</p>
      <p className="ix-notice">{x.it("ui.noDiagnosis")}</p>
      <div className="ix-outs">
        {left > 0 && (
          <button type="button" className="ix-plain" onClick={() => update({ ...flow, done: false })}>
            {t("intake.resume", { n: left })}
          </button>
        )}
        <Restart />
      </div>

      <h2>{x.it("ui.secMain")}</h2>
      <p className="ix-main">
        <bdi>{flow.main ? x.sn(flow.main) : flow.mainText}</bdi>
      </p>

      {flow.main && (
        <>
          <h2>{x.it("ui.secAssoc")}</h2>
          <div className="ix-chips plain">
            {assoc.map((sid) => (
              <span className="ix-chip" key={sid}>
                <bdi>{x.sn(sid)}</bdi>
              </span>
            ))}
            <button type="button" className="ix-add" onClick={onAdd}>
              <Plus size={18} aria-hidden /> {x.it("ui.addSymptom")}
            </button>
          </div>
        </>
      )}

      {answers.length > 0 && (
        <>
          <h2>{x.it("ui.secAnswers")}</h2>
          <ul className="ix-rows">{answers.map(row)}</ul>
        </>
      )}

      {(history.length > 0 || historyGeneral.length > 0) && (
        <>
          <h2>{x.it("ui.secHistory")}</h2>
          <ul className="ix-rows">
            {history.map(row)}
            {historyGeneral.map(generalRow)}
          </ul>
        </>
      )}

      {otherGeneral.length > 0 && (
        <>
          <h2>{x.it("ui.secOther")}</h2>
          <ul className="ix-rows">{otherGeneral.map(generalRow)}</ul>
        </>
      )}

      <div className="ix-actions">
        <button type="button" className="primary wide" onClick={() => go("card", "view")}>
          {x.it("ui.makeCard")}
        </button>
        <button type="button" className="ghost" aria-expanded={confirm} onClick={() => setConfirm(!confirm)}>
          <RotateCcw size={18} aria-hidden /> {x.it("ui.restart")}
        </button>
        {confirm && (
          <div className="confirm" role="alertdialog" aria-label={x.it("ui.restartConfirm")}>
            <p>{x.it("ui.restartConfirm")}</p>
            <div className="row">
              <button type="button" onClick={() => setConfirm(false)}>
                {t("common.cancel")}
              </button>
              <button type="button" className="danger" onClick={() => reset()}>
                {t("common.clear")}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

