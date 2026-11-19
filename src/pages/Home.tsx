import { Suspense, lazy, useEffect, useState } from "react";
import {
  Ambulance, ArrowRight, BookOpen, Camera, ChevronRight, ClipboardList, Globe, GraduationCap, Heart, MapPin, MessageCircle,
  Moon, Phone, Route, Search, ShieldCheck, Siren, UsersRound,
} from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";
import { nativeName } from "../i18n/locales";
import { href } from "../app/router";
import { useCard } from "../state/card";
import { LINKS } from "../content/facilities";
import { SCHOOL } from "../content/school";
import { CONTACT_ICON } from "./Campus";
import { campusAuth, community, type Board, type PostSummary } from "../campus/api";
import { useSchool } from "../state/prefs";

// The map library loads with the home screen's map, in its own chunk (shared with the map tab).
const PlaceMap = lazy(() => import("../components/PlaceMap"));

type Shortcut = { label: MessageKey; Icon: typeof MapPin; to: string; external?: boolean };

const SHORTCUTS: Shortcut[] = [
  { label: "home.gridFirst", Icon: Route, to: href("school", "first-visit") },
  { label: "nav.guide", Icon: BookOpen, to: href("info") },
  { label: "home.gridNight", Icon: Moon, to: LINKS.nightPharmacy, external: true },
  { label: "home.gridEr", Icon: Ambulance, to: LINKS.emergency, external: true },
  { label: "home.grid1345", Icon: Phone, to: "tel:1345" },
  { label: "school.homepage", Icon: Globe, to: SCHOOL.homepage, external: true },
];

// Boards in the order a newcomer most likely wants them.
const HOME_BOARDS: Board[] = ["buddy", "review", "info", "qna", "free"];

export function Home() {
  const { t } = useI18n();
  const { lines } = useCard();
  const school = useSchool();
  const shortcuts = school === "inha" ? SHORTCUTS : SHORTCUTS.filter((s) => s.label !== "school.homepage");
  const [hot, setHot] = useState<PostSummary[] | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([campusAuth(), community()])
      .then(([auth, api]) => (["preview", "member"].includes(auth.current().status) ? api.list("hot") : []))
      .then((posts) => live && setHot(posts.slice(0, 3)))
      .catch(() => live && setHot([]));
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="home">
      <section className="hello">
        <h1>{t("home.hello")}</h1>
        <p>{t("home.helloSub")}</p>
      </section>

      <section className="map-panel" aria-labelledby="map-panel-title">
        <div className="map-panel-head">
          <h2 id="map-panel-title">{t("places.mapTitle")}</h2>
          <a className="mp-open" href={href("places")}>
            {t("home.mapOpen")}
            <ArrowRight className="flip" size={18} aria-hidden />
          </a>
        </div>
        <p className="mp-hint">{t("home.mapHint")}</p>
        <Suspense fallback={<div className="place-map preview" aria-busy="true" />}>
          <PlaceMap preview />
        </Suspense>
      </section>

      <div className="primary-actions">
        <a className="action2" href={href("meds", "home")}>
          <span className="icon-box">
            <Globe size={20} aria-hidden />
          </span>
          <span className="a2-text">
            <span className="a2-title">{t("meds.fromHome")}</span>
            <span className="a2-sub">{t("meds.fromHomeSub")}</span>
          </span>
          <ChevronRight className="flip chev" size={20} aria-hidden />
        </a>
        <a className="action2" href={href("meds", "korea")}>
          <span className="icon-box">
            <Camera size={20} aria-hidden />
          </span>
          <span className="a2-text">
            <span className="a2-title">{t("meds.fromKorea")}</span>
            <span className="a2-sub">{t("home.medsSub")}</span>
          </span>
          <ChevronRight className="flip chev" size={20} aria-hidden />
        </a>
        <a className="action2" href={lines.length ? href("card", "view") : href("card")}>
          <span className="icon-box">
            <ClipboardList size={20} aria-hidden />
          </span>
          <span className="a2-text">
            <span className="a2-title">{t("home.cardCta")}</span>
            <span className="a2-sub">{lines.length ? t("home.cardResume", { n: lines.length }) : t("home.sub")}</span>
          </span>
          <ChevronRight className="flip chev" size={20} aria-hidden />
        </a>
      </div>

      <a className="emergency-strip" href={href("info", "flags")}>
        <Siren size={20} aria-hidden />
        <span className="sos-text">
          <span className="sos-title">{t("home.emergencyTitle")}</span>
          <span className="sos-more">{t("home.emergencyMore")}</span>
        </span>
        <ChevronRight className="flip" size={20} aria-hidden />
      </a>

      {school === "inha" && (
      <section className="school-card" aria-labelledby="school-card-title">
        <a className="school-card-head" href={href("school")}>
          <GraduationCap size={20} aria-hidden />
          <span id="school-card-title">{t("school.cardTitle")}</span>
          <ChevronRight className="flip chev" size={20} aria-hidden />
        </a>
        <a className="buddy-cta" href={href("school", "buddy")}>
          <UsersRound size={22} aria-hidden />
          <span>
            <strong>{t("school.buddyCta")}</strong>
            <small>{t("school.buddySub")}</small>
          </span>
          <ArrowRight className="flip" size={20} aria-hidden />
        </a>
        <div className="grid4">
          {SCHOOL.contacts.map((c) => {
            const Icon = CONTACT_ICON[c.id];
            return (
              <a key={c.id} href={href("school", "contacts")}>
                <span className="icon-box">
                  <Icon size={22} aria-hidden />
                </span>
                {t(c.short)}
              </a>
            );
          })}
          <a href={href("school", "insurance")}>
            <span className="icon-box">
              <ShieldCheck size={22} aria-hidden />
            </span>
            {t("school.claim")}
          </a>
        </div>
      </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>{t("home.community")}</h2>
          <a href={href("community", "hot")}>{t("common.more")}</a>
        </div>
        <div className="quick scroll">
          <a href={href("community", "all")} className="quick-chip">
            <Search size={18} aria-hidden /> {t("community.search")}
          </a>
          {HOME_BOARDS.map((b) => (
            <a key={b} href={href("community", b)} className="quick-chip">
              {t(("community.board." + b) as MessageKey)}
            </a>
          ))}
        </div>
        {hot === null ? (
          <p className="muted">{t("common.loading")}</p>
        ) : hot.length === 0 ? (
          <p className="muted">{t("community.hotEmpty")}</p>
        ) : (
          <ul className="rows hot-rows">
            {hot.map((p) => (
              <li key={p.id}>
                <a className="post-row" href={href("community", "post", p.id)}>
                  <strong dir="auto">{p.title}</strong>
                  <span className="meta">
                    <span lang={p.locale}>{nativeName(p.locale)}</span>
                    <span className="counts">
                      <Heart size={16} aria-hidden /> {p.likes}
                    </span>
                    <span className="counts">
                      <MessageCircle size={16} aria-hidden /> {p.comments}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2>{t("home.tools")}</h2>
        <div className="grid4">
          {shortcuts.map(({ label, Icon, to, external }) => (
            <a key={label} href={to} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
              <span className="icon-box">
                <Icon size={22} aria-hidden />
              </span>
              {t(label)}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
