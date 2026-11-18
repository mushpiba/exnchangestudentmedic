import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Camera, ChevronRight, GraduationCap, Heart, MapPin, MessageCircle, MessagesSquare, Siren } from "lucide-react";
import { useI18n } from "../i18n";
import { href } from "../app/router";
import { useCard } from "../state/card";
import { SYMPTOMS, symptomKey, type SymptomId } from "../content/symptoms";
import { campusAuth, community, type PostSummary } from "../campus/api";

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

export function Home() {
  const { t } = useI18n();
  const { lines } = useCard();
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

  const tools = [
    { to: "places", Icon: MapPin, title: t("nav.places"), sub: t("home.placesSub") },
    { to: "info", Icon: BookOpen, title: t("nav.info"), sub: t("home.infoSub") },
    { to: "campus", Icon: GraduationCap, title: t("campus.title"), sub: t("home.campusSub") },
    { to: "community", Icon: MessagesSquare, title: t("nav.community"), sub: t("home.communitySub") },
  ];

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
        <div className="quick">
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

      <section className="section">
        <h2>{t("home.tools")}</h2>
        <ul className="rows">
          {tools.map(({ to, Icon, title, sub }) => (
            <li key={to}>
              <a href={href(to)} className="item">
                <span className="icon-box">
                  <Icon size={20} aria-hidden />
                </span>
                <span className="item-text">
                  <span className="item-title">{title}</span>
                  <span className="item-sub">{sub}</span>
                </span>
                <ChevronRight className="flip chev" size={20} aria-hidden />
              </a>
            </li>
          ))}
        </ul>
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
