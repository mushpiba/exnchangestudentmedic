import { useState } from "react";
import { BookOpen, ClipboardList, Info, MapPin, Maximize2, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "../i18n";
import { koreanName, nativeName } from "../i18n/locales";
import { go, href } from "../app/router";
import { useCard } from "../state/card";
import { CardLines } from "../components/CardLines";
import { Bilingual, Notice } from "../components/ui";
import { CostEstimate } from "../components/CostEstimate";
import { departmentsFor, deptKey } from "../content/symptoms";
import { CONDITIONS, conditionsFor } from "../content/conditions";

/** Fullscreen and wake lock must start inside the tap that opens the show mode. */
export async function enterShowMode() {
  try {
    await document.documentElement.requestFullscreen?.({ navigationUI: "hide" });
  } catch {
    /* iOS Safari: no fullscreen API for pages; the layout still fills the screen */
  }
  go("card", "show");
}

export function CardView() {
  const { t, tk, locale } = useI18n();
  const { card, lines, reset } = useCard();
  const [confirming, setConfirming] = useState(false);

  if (!lines.length)
    return (
      <section className="empty">
        <ClipboardList size={40} aria-hidden />
        <h1>{t("intake.title")}</h1>
        <p>{t("card.empty")}</p>
        <a className="button primary" href={href("card")}>
          {t("home.cardCta")}
        </a>
      </section>
    );

  const depts = card.depts.length ? card.depts : card.main ? departmentsFor(card.main) : ["JIM", "JFM"];
  const related = card.main ? conditionsFor(card.main) : [];

  return (
    <section className="card-view">
      <article className="slip card" lang="ko" dir="ltr" aria-labelledby="card-title">
        <div className="slip-stub">
          <h1 className="card-title" id="card-title">
            <Bilingual k="card.title" />
          </h1>
          <p className="for-staff">
            <Bilingual k="card.forStaff" />
          </p>
          <p className="lang-line">
            <span>{tk("card.language")}</span>
            <strong>{koreanName(locale)}</strong>
            <span lang={locale}>{nativeName(locale)}</span>
          </p>
        </div>
        <div className="slip-body">
          <CardLines lines={lines} />
          <p className="staff-note">
            <Info size={20} aria-hidden />
            <Bilingual k="card.staffNote" />
          </p>
        </div>
      </article>

      <button type="button" className="primary wide big-action" onClick={enterShowMode}>
        <Maximize2 aria-hidden /> {t("card.show")}
      </button>

      <div className="actions">
        <a className="button" href={href("card")}>
          <Pencil size={18} aria-hidden /> {t("common.edit")}
        </a>
        <button type="button" aria-expanded={confirming} onClick={() => setConfirming(!confirming)}>
          <Trash2 size={18} aria-hidden /> {t("common.clear")}
        </button>
      </div>
      {confirming && (
        <div className="confirm" role="alertdialog" aria-label={t("card.clearConfirm")}>
          <p>{t("card.clearConfirm")}</p>
          <div className="row">
            <button type="button" onClick={() => setConfirming(false)}>
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                reset();
                go("home");
              }}
            >
              {t("common.clear")}
            </button>
          </div>
        </div>
      )}

      <section className="section">
        <h2>{t("card.deptHint")}</h2>
        <ul className="dept-list">
          {depts.map((d) => (
            <li key={d}>
              <Bilingual k={deptKey(d)} />
            </li>
          ))}
        </ul>
        <a className="button" href={href("places")}>
          <MapPin size={18} aria-hidden /> {t("card.findPlace")}
        </a>
      </section>

      <CostEstimate emergency={lines.some((l) => l.danger)} />

      {related.length > 0 && (
        <section className="section">
          <h2>{t("nav.info")}</h2>
          <ul className="link-list">
            {related.map((id) => (
              <li key={id}>
                <a href={href("info", id)}>
                  <BookOpen size={18} aria-hidden /> {t(CONDITIONS[id].name)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Notice>{t("card.sessionNote")}</Notice>
    </section>
  );
}
