import { useEffect } from "react";
import { AlertTriangle, BookOpen, ChevronRight, ClipboardList, Siren } from "lucide-react";
import { useI18n } from "../i18n";
import { href } from "../app/router";
import { CONDITIONS, FLAGS, careKey, flagKey, otcKey, summaryKey } from "../content/conditions";
import { deptKey, symptomKey } from "../content/symptoms";
import { Bilingual, CallButton, Notice, PageHead, Section } from "../components/ui";

function FlagList({ flags }: { flags: string[] }) {
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

function Condition({ id }: { id: string }) {
  const { t } = useI18n();
  const c = CONDITIONS[id];
  return (
    <article className="condition">
      <PageHead title={t(c.name)} intro={t(summaryKey(id))} icon={<BookOpen />} />
      <Section title={t("info.symptoms")}>
        <ul className="tags">
          {c.symptoms.map((s) => (
            <li key={s}>{t(symptomKey(s))}</li>
          ))}
        </ul>
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

export function Info({ id }: { id?: string }) {
  const { t } = useI18n();
  useEffect(() => {
    // After the app's scroll-to-top on navigation.
    if (id === "flags") setTimeout(() => document.getElementById("flags")?.scrollIntoView(), 0);
  }, [id]);
  if (id && CONDITIONS[id]) return <Condition id={id} />;
  return (
    <section className="info">
      <PageHead title={t("info.title")} intro={t("info.intro")} icon={<BookOpen />} />
      <ul className="condition-list">
        {Object.entries(CONDITIONS).map(([cid, c]) => (
          <li key={cid}>
            <a href={href("info", cid)}>
              <span>
                <strong>{t(c.name)}</strong>
                <small>{t(summaryKey(cid))}</small>
              </span>
              <ChevronRight className="flip" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <Section title={t("info.redFlags")} id="flags">
        <FlagList flags={Object.keys(FLAGS)} />
        <CallButton number="1345" label={t("emergency.call1345")} />
      </Section>
      <p className="disclaimer">{t("disclaimer.severe")}</p>
    </section>
  );
}
