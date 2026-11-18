import { useEffect, useState } from "react";
import {
  Ambulance, ArrowRight, BookOpen, Camera, ChevronRight, Globe, GraduationCap, Heart, MapPin, MessageCircle,
  MessagesSquare, Moon, Phone, Route, ShieldCheck, Siren, UsersRound,
} from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";
import { nativeName } from "../i18n/locales";
import { href } from "../app/router";
import { useCard } from "../state/card";
import { SYMPTOMS, symptomKey, type SymptomId } from "../content/symptoms";
import { LINKS } from "../content/facilities";
import { SCHOOL } from "../content/school";
import { CONTACT_ICON } from "./Campus";
import { campusAuth, community, type PostSummary } from "../campus/api";
import { useSchool } from "../state/prefs";

const QUICK = (Object.keys(SYMPTOMS) as SymptomId[]).filter((id) => (SYMPTOMS[id].cats as string[]).includes("BFR"));

/** The Korean intake slip in miniature: what the main action makes. */
function MiniSlip() {
  const { tk } = useI18n();
  return (
    <span className="slip mini-slip" lang="ko" dir="ltr" aria-hidden>
      <span className="slip-stub">
        <span className="ms-title">{tk("card.title")}</span>
      </span>
      <span className="slip-body">
        {(["card.chief", "card.onset", "card.pain"] as const).map((k) => (
          <span className="ms-row" key={k}>
            <span>{tk(k)}</span>
            <i />
          </span>
        ))}
      </span>
    </span>
  );
}

type Shortcut = { label: MessageKey; Icon: typeof MapPin; to: string; external?: boolean };

const SHORTCUTS: Shortcut[] = [
  { label: "nav.places", Icon: MapPin, to: href("places") },
  { label: "home.gridNight", Icon: Moon, to: LINKS.nightPharmacy, external: true },
  { label: "home.gridEr", Icon: Ambulance, to: LINKS.emergency, external: true },
  { label: "nav.info", Icon: BookOpen, to: href("info") },
  { label: "home.gridFirst", Icon: Route, to: href("school", "first-visit") },
  { label: "school.board", Icon: MessagesSquare, to: href("community") },
  { label: "school.homepage", Icon: Globe, to: SCHOOL.homepage, external: true },
  { label: "home.grid1345", Icon: Phone, to: "tel:1345" },
];

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
        <h1>{t("home.greeting")}</h1>
        <p>{t("home.sub")}</p>
      </section>

      <div className="primary-actions">
        <a className="cta" href={lines.length ? href("card", "view") : href("card")}>
          <span className="cta-row">
            <span className="cta-title">
              {t("home.cardCta")}
              {lines.length > 0 && <small>{t("home.cardResume", { n: lines.length })}</small>}
            </span>
            <span className="cta-go">
              <ArrowRight className="flip" size={20} aria-hidden />
            </span>
          </span>
          <MiniSlip />
        </a>
        <a className="action2" href={href("meds")}>
          <span className="icon-box">
            <Camera size={20} aria-hidden />
          </span>
          <span className="a2-text">
            <span className="a2-title">{t("home.medsCta")}</span>
            <span className="a2-sub">{t("home.medsSub")}</span>
          </span>
          <ChevronRight className="flip chev" size={20} aria-hidden />
        </a>
      </div>

      <section className="section">
        <h2>{t("home.quick")}</h2>
        <div className="quick scroll">
          {QUICK.map((id) => (
            <a key={id} href={href("card", id)} className="quick-chip">
              {t(symptomKey(id))}
            </a>
          ))}
        </div>
      </section>

      <a className="emergency-strip" href={href("info", "flags")}>
        <Siren size={20} aria-hidden />
        <span className="sos-text">
          <span className="sos-title">{t("home.emergencyTitle")}</span>
          <span>{t("home.emergencyBody")}</span>
          <span className="sos-more">{t("home.emergencyMore")}</span>
        </span>
        <ChevronRight className="flip" size={20} aria-hidden />
      </a>

      {school === "inha" && (
      <section className="school-card" aria-labelledby="school-card-title">
        <a className="school-card-head" href={href("school")}>
          <GraduationCap size={20} aria-hidden />
          <span id="school-card-title">{t("school.cardTitle", { school: t(SCHOOL.name) })}</span>
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

      <section className="section">
        <div className="section-head">
          <h2>{t("home.hot")}</h2>
          <a href={href("community", "hot")}>{t("common.more")}</a>
        </div>
        {hot === null ? (
          <p className="muted">{t("common.loading")}</p>
        ) : hot.length === 0 ? (
          <p className="muted">{t("community.hotEmpty")}</p>
        ) : (
          <ul className="rows">
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
    </div>
  );
}
