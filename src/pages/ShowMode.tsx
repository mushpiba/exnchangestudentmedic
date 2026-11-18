import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, CircleHelp, Info, MessageSquareText, Siren, Type } from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";
import { koreanName } from "../i18n/locales";
import { go } from "../app/router";
import { useCard } from "../state/card";
import { CardLines } from "../components/CardLines";
import { PhraseOverlay } from "../components/PhraseOverlay";
import { Tick } from "../components/ui";

type Scene = { label: MessageKey; questions: MessageKey[]; statements: MessageKey[] };

/** Staff phrases by where the student is. Questions get yes / no / not sure; statements get understood / say again. */
const SCENES: Scene[] = [
  {
    label: "show.group.desk",
    questions: [
      "staff.q.firstVisit", "staff.q.reservation", "staff.q.insurance", "staff.q.schoolInsurance",
      "staff.q.interpreter", "staff.q.companion", "staff.q.koreanFriend",
    ],
    statements: [
      "staff.s.showId", "staff.s.fillForm", "staff.q.phone", "staff.s.wait", "staff.s.waitLong",
      "staff.s.otherDept", "staff.s.noInsurance",
    ],
  },
  {
    label: "show.group.exam",
    questions: [
      "staff.q.fever", "staff.q.breathing", "staff.q.chestPain", "staff.q.worse", "staff.q.sameBefore",
      "staff.q.injured", "staff.q.canEat", "staff.q.blood", "staff.q.tookMeds", "staff.q.regularMeds",
      "staff.q.drugAllergy", "staff.q.chronic", "staff.q.pregnant", "staff.q.alcohol", "staff.q.travel",
    ],
    statements: [
      "staff.q.point", "staff.s.goRoom", "staff.s.vitals", "staff.s.lieDown", "staff.s.openMouth",
      "staff.s.breathe", "staff.s.sleeve", "staff.s.painScale",
    ],
  },
  {
    label: "show.group.tests",
    questions: ["staff.q.fasting", "staff.q.period", "staff.q.faintedBefore"],
    statements: [
      "staff.s.tests", "staff.s.bloodTest", "staff.s.urine", "staff.s.xray", "staff.s.gown",
      "staff.s.injection", "staff.s.iv", "staff.s.results",
    ],
  },
  {
    label: "show.group.after",
    questions: ["staff.q.takenBefore"],
    statements: [
      "staff.s.pay", "staff.s.receipt", "staff.s.prescription", "staff.s.afterMeal", "staff.s.beforeSleep",
      "staff.s.asNeeded", "staff.s.finishAll", "staff.s.drowsy", "staff.s.noAlcohol", "staff.s.external",
      "staff.s.revisit", "staff.s.comeBackIf", "staff.s.referral",
    ],
  },
];

type WakeLock = { release: () => Promise<void> };
type Open = { key: MessageKey; kind: "question" | "statement" };

/** What the student hands over the counter: the Korean slip, large, with the staff phrase panel under it. */
export function ShowMode() {
  const { t, tk, locale, rtl } = useI18n();
  const { lines } = useCard();
  const [large, setLarge] = useState(true);
  const [panel, setPanel] = useState(true);
  const [scene, setScene] = useState(0);
  const [phrase, setPhrase] = useState<Open | null>(null);
  const [answers, setAnswers] = useState<Partial<Record<MessageKey, MessageKey>>>({});

  useEffect(() => {
    let lock: WakeLock | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLock> } };
    nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    return () => {
      lock?.release().catch(() => {});
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!lines.length) go("card");
  }, [lines.length]);
  if (!lines.length) return null;

  const mine = { lang: locale, dir: rtl ? "rtl" : "ltr" } as const;
  const current = SCENES[scene];

  const phraseButton = (key: MessageKey, kind: Open["kind"]) => {
    const er = key === "staff.s.er";
    const answer = answers[key];
    return (
      <li key={key}>
        <button
          type="button"
          className={"ph" + (kind === "statement" ? " st" : "") + (er ? " er" : "")}
          onClick={() => setPhrase({ key, kind })}
        >
          {er ? <Siren size={20} aria-hidden /> : kind === "question" ? <CircleHelp size={20} aria-hidden /> : <Info size={20} aria-hidden />}
          <span className="ph-text">{tk(key)}</span>
          {answer && (
            <span className="stamp">
              <Tick on />
              {tk(answer)}
            </span>
          )}
        </button>
      </li>
    );
  };

  return (
    <div className={"show" + (large ? " large" : "")}>
      <header className="show-head" {...mine}>
        <button type="button" onClick={() => go("card", "view")}>
          <ArrowLeft className="flip" size={20} aria-hidden /> {t("show.exit")}
        </button>
        <button type="button" aria-pressed={large} onClick={() => setLarge(!large)}>
          <Type size={20} aria-hidden /> {t("show.bigger")}
        </button>
      </header>

      <article className="slip card" lang="ko" dir="ltr">
        <div className="slip-stub">
          <h1 className="card-title">{tk("card.title")}</h1>
          <p className="for-staff">{tk("card.forStaff")}</p>
          <p className="lang-line">
            <span>{tk("card.language")}</span>
            <strong>{koreanName(locale)}</strong>
          </p>
        </div>
        <div className="slip-body">
          <CardLines lines={lines} size={large ? "large" : "normal"} />
          <p className="staff-note">
            <Info size={20} aria-hidden />
            <span>{tk("card.staffNote")}</span>
          </p>
        </div>
      </article>

      <section className="staff" lang="ko" dir="ltr">
        <button type="button" className="primary staff-toggle" aria-expanded={panel} aria-controls="phrases" onClick={() => setPanel(!panel)}>
          <span>
            <MessageSquareText size={20} aria-hidden />
            {tk("show.staffQuestions")}
          </span>
          <ChevronDown className="tog" size={20} aria-hidden />
        </button>
        <div id="phrases" hidden={!panel}>
          <p className="staff-hint">{tk("show.staffHint")}</p>
          <div className="scenes" role="group" aria-label={tk("show.staffQuestions")}>
            {SCENES.map((s, i) => (
              <button key={s.label} type="button" aria-pressed={scene === i} onClick={() => setScene(i)}>
                {tk(s.label)}
              </button>
            ))}
          </div>
          <div className="ph-head">
            <h3>{tk("show.questions")}</h3>
            <span>{tk("show.questionsHint")}</span>
          </div>
          <ul className="ph-list">{current.questions.map((k) => phraseButton(k, "question"))}</ul>
          <div className="ph-head">
            <h3>{tk("show.statements")}</h3>
            <span>{tk("show.statementsHint")}</span>
          </div>
          <ul className="ph-list">{current.statements.map((k) => phraseButton(k, "statement"))}</ul>
          <ul className="ph-list">{phraseButton("staff.s.er", "statement")}</ul>
        </div>
      </section>
      {phrase && (
        <PhraseOverlay
          phrase={phrase.key}
          kind={phrase.kind}
          onAnswer={(a) => setAnswers((prev) => ({ ...prev, [phrase.key]: a }))}
          onClose={() => setPhrase(null)}
        />
      )}
    </div>
  );
}
