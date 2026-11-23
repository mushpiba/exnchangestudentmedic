import { useEffect, useState } from "react";
import { AlertTriangle, BookOpen, ChevronRight, ClipboardList, MessageCircleMore, Siren } from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";
import { href } from "../app/router";
import { CONDITIONS, FLAGS, careKey, flagKey, otcKey, summaryKey } from "../content/conditions";
import { deptKey, symptomKey } from "../content/symptoms";
import { Bilingual, CallButton, Notice, PageHead, Section } from "../components/ui";
import { PhraseOverlay } from "../components/PhraseOverlay";
import { GuideHome } from "./Guide";

const STEPS = ["book", "bring", "reception", "consult", "pay", "pharmacy"];

/** How a visit to a Korean clinic goes, start to finish. Nothing about it is school business -- it is
 *  the same six steps for every student -- so it sits with the rest of the guide. */
function FirstVisit() {
  const { t } = useI18n();
  const [say, setSay] = useState<MessageKey | null>(null);
  return (
    <Section title={t("campus.firstVisit")} id="first-visit">
      <ol className="visit-steps">
        {STEPS.map((s, i) => (
          <li key={s}>
            <span className="num" aria-hidden>
              {i + 1}
            </span>
            <div>
              <strong>{t(("campus.step." + s) as MessageKey)}</strong>
              <p>{t(("campus.step." + s + ".body") as MessageKey)}</p>
              <button type="button" className="say" onClick={() => setSay(("campus.step." + s + ".say") as MessageKey)}>
                <MessageCircleMore size={16} aria-hidden /> {t("campus.sayThis")}
              </button>
            </div>
          </li>
        ))}
      </ol>
      {say && <PhraseOverlay phrase={say} kind="say" onClose={() => setSay(null)} />}
    </Section>
  );
}

export function FlagList({ flags }: { flags: string[] }) {
  const { t } = useI18n();
  const emergency = flags.filter((f) => FLAGS[f] === "emergency");
  const urgent = flags.filter((f) => FLAGS[f] === "urgent");
  return (
    <div className="flags">
      {emergency.length > 0 && (
        <div className="flag-group emergency">
          <h3>
            <Siren size={18} aria-hidden /> {t("info.emergencyList")}
          </h3>
          <ul>
            {emergency.map((f) => (
              <li key={f}>{t(flagKey(f))}</li>
            ))}
          </ul>
          <CallButton number="119" label={t("emergency.call119")} tone="danger" />
          {emergency.includes("selfHarm") && <CallButton number="109" label={t("emergency.call109")} />}
        </div>
      )}
      {urgent.length > 0 && (
        <div className="flag-group urgent">
          <h3>
            <AlertTriangle size={18} aria-hidden /> {t("info.urgentList")}
          </h3>
          <ul>
            {urgent.map((f) => (
              <li key={f}>{t(flagKey(f))}</li>
            ))}
          </ul>
          <a className="button" href={href("places")}>
            {t("card.findPlace")}
          </a>
        </div>
      )}
    </div>
  );
}

/** One condition. It lives in the symptom-card tab (#/card/info/<id>): a student who reads about a
 *  cough is a tap away from filling in the card for it, and the card sends them back here. */
export function Condition({ id }: { id: string }) {
  const { t } = useI18n();
  const c = CONDITIONS[id];
  return (
    <article className="condition">
      <PageHead title={t(c.name)} intro={t(summaryKey(id))} icon={<BookOpen />} />
      <Section title={t("info.symptoms")}>
        <ul className="sym-links">
          {c.symptoms.map((s) => (
            <li key={s}>
              <a href={href("card", s)}>{t(symptomKey(s))}</a>
            </li>
          ))}
        </ul>
        <p className="muted small">{t("info.pickSymptom")}</p>
        <a className="button primary" href={href("card", c.symptoms[0])}>
          <ClipboardList size={18} aria-hidden /> {t("info.makeCard")}
        </a>
      </Section>
      <Section title={t("info.selfCare")}>
        <ul className="checks">
          {c.care.map((k) => (
            <li key={k}>{t(careKey(k))}</li>
          ))}
        </ul>
      </Section>
      <Section title={t("info.redFlags")}>
        <FlagList flags={c.flags} />
      </Section>
      <Section title={t("info.relatedDept")}>
        <ul className="dept-list">
          {c.depts.map((d) => (
            <li key={d}>
              <Bilingual k={deptKey(d)} />
            </li>
          ))}
        </ul>
      </Section>
      <Section title={t("info.otc")}>
        {c.otc.length ? (
          <>
            <ul className="tags">
              {c.otc.map((o) => (
                <li key={o}>{t(otcKey(o))}</li>
              ))}
            </ul>
            <p className="muted small">{t("otc.definition")}</p>
            <a className="button" href={href("meds")}>
              {t("home.medsCta")}
            </a>
          </>
        ) : (
          <p>{t("info.noOtc")}</p>
        )}
      </Section>
      <Notice>
        {t("disclaimer.notDiagnosis")} {t("info.reviewed")}
      </Notice>
    </article>
  );
}

/** The seventeen conditions. This list belongs to the symptom-card tab: looking up what you have and
 *  writing the card for it are one errand, and splitting them across two tabs made it two. */
export function ConditionList() {
  const { t } = useI18n();
  return (
    <>
      <h2 className="list-head">{t("guide.conditions")}</h2>
      <p className="muted">{t("info.intro")}</p>
      <ul className="condition-list">
        {Object.entries(CONDITIONS).map(([cid, c]) => (
          <li key={cid}>
            <a href={href("card", "info", cid)}>
              <span>
                <strong>{t(c.name)}</strong>
                <small>{t(summaryKey(cid))}</small>
              </span>
              <ChevronRight className="flip" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

export function Info({ id }: { id?: string }) {
  const { t } = useI18n();
  useEffect(() => {
    // After the app's scroll-to-top on navigation. Both are places on this screen, not screens of their own.
    if (id === "flags" || id === "first-visit") setTimeout(() => document.getElementById(id)?.scrollIntoView(), 0);
  }, [id]);
  return (
    <section className="info">
      <PageHead title={t("guide.title")} intro={t("guide.intro")} icon={<BookOpen />} />
      <GuideHome />
      <FirstVisit />
      <Section title={t("info.redFlags")} id="flags">
        <FlagList flags={Object.keys(FLAGS)} />
        <CallButton number="1345" label={t("emergency.call1345")} />
      </Section>
      <p className="disclaimer">{t("disclaimer.severe")}</p>
    </section>
  );
}
