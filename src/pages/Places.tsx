import { Suspense, lazy, useState } from "react";
import { Building2, MapPin, MessagesSquare, Moon, Phone, Siren } from "lucide-react";
import { useI18n } from "../i18n";
import { nativeName } from "../i18n/locales";
import { href } from "../app/router";
import { deptKey } from "../content/symptoms";
import { LINKS, OFFICIAL, QUICK_DEPTS, mapSearch, type Facility } from "../content/facilities";
import { SCHOOL } from "../content/school";
import { openNaverSearch } from "../lib/naver";
import { Chip, Out, PageHead, Section } from "../components/ui";

// The map library loads only when this tab opens.
const PlaceMap = lazy(() => import("../components/PlaceMap"));

function FacilityRow({ f }: { f: Facility }) {
  const { t } = useI18n();
  const known = f.languages.reception.length + f.languages.consult.length > 0;
  return (
    <article className="facility">
      <strong lang="ko">{f.ko}</strong>
      <span lang="en">{f.en}</span>
      <small lang="ko">{f.address}</small>
      {known ? (
        <dl className="langs-by-role">
          <dt>{t("places.reception")}</dt>
          <dd>{f.languages.reception.map(nativeName).join(", ")}</dd>
          <dt>{t("places.consult")}</dt>
          <dd>{f.languages.consult.map(nativeName).join(", ")}</dd>
          {f.verifiedAt && <dd className="muted">{t("places.statusVerified", { date: f.verifiedAt })}</dd>}
        </dl>
      ) : (
        <span className="status unknown">{t("places.statusUnknown")}</span>
      )}
      <div className="row">
        <a className="button" href={"tel:" + f.phone}>
          <Phone size={16} aria-hidden /> {f.phone}
        </a>
        <Out className="button" href={mapSearch(f.ko)}>
          <MapPin size={16} aria-hidden /> {t("common.map")}
        </Out>
      </div>
    </article>
  );
}

export function Places() {
  const { t, tk } = useI18n();
  const [dept, setDept] = useState("JIM");
  return (
    <section className="places">
      <PageHead title={t("places.title")} icon={<Building2 />} />

      <Section title={t("places.mapTitle")}>
        <Suspense fallback={<div className="place-map" aria-busy="true" />}>
          <PlaceMap />
        </Suspense>
      </Section>

      <Section title={t("places.deptPick")}>
        <div className="choices">
          {QUICK_DEPTS.map((d) => (
            <Chip key={d} on={dept === d} onClick={() => setDept(d)}>
              {t(deptKey(d))}
            </Chip>
          ))}
        </div>
        {/* Naver's own search is what finds the rest; all this screen can do is aim it. The app scheme
            takes no coordinates, so the school's name goes in the words; the web map is framed on campus. */}
        <button
          type="button"
          className="button primary wide"
          onClick={() => openNaverSearch(tk(SCHOOL.name) + " " + tk(deptKey(dept)), SCHOOL.location)}
        >
          <MapPin size={18} aria-hidden /> {t("places.mapSearch", { dept: t(deptKey(dept)) })}
        </button>
        <p className="muted small">{t("places.naverNote")}</p>
        <details className="hint">
          <summary>{t("places.which")}</summary>
          <p>{t("places.whichBody")}</p>
          <a className="button" href={href("card")}>
            {t("home.cardCta")}
          </a>
        </details>
      </Section>

      <div className="link-tiles">
        <Out className="tile" href={LINKS.nightPharmacy}>
          <Moon aria-hidden /> {t("places.nightPharmacy")}
        </Out>
        <Out className="tile danger" href={LINKS.emergency}>
          <Siren aria-hidden /> {t("places.erFinder")}
        </Out>
      </div>

      <a className="button wide" href={href("community", "review")}>
        <MessagesSquare size={18} aria-hidden /> {t("places.reviews")}
      </a>

      <Section title={t("places.official")}>
        <p className="muted">{t("places.callToConfirm")}</p>
        {OFFICIAL.map((f) => (
          <FacilityRow key={f.phone} f={f} />
        ))}
        <Out href={LINKS.incheonGuide}>
          {t("common.source")} · 인천광역시
        </Out>
      </Section>
    </section>
  );
}
