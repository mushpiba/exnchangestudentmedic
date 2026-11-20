import { useState } from "react";
import { ArrowLeft, ArrowRight, GraduationCap, MinusCircle } from "lucide-react";
import { useI18n } from "../i18n";
import { LOCALES, koreanName } from "../i18n/locales";
import { SCHOOLS, schoolById } from "../content/school";
import { setSchool, useSchool, type SchoolChoice } from "../state/prefs";
import { Tick } from "../components/ui";
import { NaruMark } from "../components/art";

/**
 * First run: pick a language, then a school (or none). The paper slip at the top fills in as the student
 * chooses — the same slip that staff later read — so the first thing the app shows is what it is for.
 */
export function Welcome({ onDone, start = 1 }: { onDone: () => void; start?: 1 | 2 }) {
  const { t, tk, locale, rtl, setLocale } = useI18n();
  const saved = useSchool();
  const [step, setStep] = useState<1 | 2>(start);
  const [school, setChoice] = useState<SchoolChoice | null>(saved);
  const mine = { lang: locale, dir: rtl ? "rtl" : "ltr" } as const;

  const finish = () => {
    if (!school) return;
    setSchool(school);
    onDone();
  };

  return (
    <div className="welcome" {...mine}>
      <header className="welcome-top">
        <span className="brand" dir="ltr" aria-label="NARU">
          <NaruMark />
          <span className="brand-word" aria-hidden>
            NARU
          </span>
        </span>
        <span className="step-count" dir="ltr">
          {t("intake.step", { n: step, total: 2 })}
        </span>
      </header>

      <div className="slip welcome-slip" lang="ko" dir="ltr" aria-hidden>
        <div className="slip-stub">
          <span className="ws-title">NARU · 나루</span>
        </div>
        <div className="slip-body">
          <span className="ws-row">
            <span>{tk("card.language")}</span>
            <strong>{koreanName(locale)}</strong>
          </span>
          <span className="ws-row">
            <span>{tk("welcome.slipSchool")}</span>
            <strong>{schoolById(school) ? tk(schoolById(school)!.name) : school === "none" ? "—" : ""}</strong>
          </span>
        </div>
      </div>

      {step === 1 ? (
        <section aria-labelledby="welcome-title">
          <h1 id="welcome-title">{t("welcome.langTitle")}</h1>
          <p className="muted">{t("welcome.langSub")}</p>
          <div className="choices welcome-langs" role="group" aria-labelledby="welcome-title">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                className="chip"
                aria-pressed={l.code === locale}
                lang={l.code}
                dir={l.rtl ? "rtl" : "ltr"}
                onClick={() => setLocale(l.code)}
              >
                <Tick />
                <span className="chip-label">
                  <span className="hl">{l.native}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="welcome-actions">
            <button type="button" className="primary" onClick={() => setStep(2)}>
              {t("common.next")}
              <ArrowRight className="flip" size={20} aria-hidden />
            </button>
          </div>
        </section>
      ) : (
        <section aria-labelledby="welcome-title">
          <h1 id="welcome-title">{t("welcome.schoolTitle")}</h1>
          <p className="muted">{t("welcome.schoolSub")}</p>
          <div className="welcome-schools" role="group" aria-labelledby="welcome-title">
            {SCHOOLS.map((s) => (
              <button key={s.id} type="button" className="chip school-option" aria-pressed={school === s.id} onClick={() => setChoice(s.id)}>
                <Tick />
                <span className="icon-box">
                  <GraduationCap size={22} aria-hidden />
                </span>
                <span className="option-text">
                  <span className="chip-label">
                    <span className="hl">{t(s.name)}</span>
                  </span>
                  <small>{t(s.city)}</small>
                </span>
              </button>
            ))}
            <button type="button" className="chip school-option" aria-pressed={school === "none"} onClick={() => setChoice("none")}>
              <Tick />
              <span className="icon-box">
                <MinusCircle size={22} aria-hidden />
              </span>
              <span className="option-text">
                <span className="chip-label">
                  <span className="hl">{t("welcome.noSchool")}</span>
                </span>
                <small>{t("welcome.noSchoolSub")}</small>
              </span>
            </button>
          </div>
          <p className="muted small">{t("welcome.moreSchools")}</p>
          <div className="welcome-actions">
            <button type="button" onClick={() => setStep(1)}>
              <ArrowLeft className="flip" size={20} aria-hidden />
              {t("common.back")}
            </button>
            <button type="button" className="primary" disabled={!school} onClick={finish}>
              {t("welcome.start")}
              <ArrowRight className="flip" size={20} aria-hidden />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
