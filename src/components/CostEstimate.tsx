import { useState } from "react";
import { Wallet } from "lucide-react";
import { useI18n } from "../i18n";
import { COSTS_CHECKED, ER_MINOR_SHARE, estimateVisit } from "../content/costs";

const won = (n: number) => n.toLocaleString("en-US");

/** Two choices only, because they are the two that change the number most: whether the student's health
 *  insurance is active yet, and whether they go during office hours. Everything else is published rate. */
export function CostEstimate({ emergency }: { emergency?: boolean }) {
  const { t } = useI18n();
  const [insured, setInsured] = useState(true);
  const [afterHours, setAfterHours] = useState(false);
  const { mine, total, insurance } = estimateVisit({ insured, afterHours });
  const range = (v: [number, number]) => `₩${won(v[0])}~${won(v[1])}`;

  return (
    <section className="section cost-estimate">
      <h2>
        <Wallet size={20} aria-hidden /> {t("cost.title")}
      </h2>
      <p className="ix-hint">{t("cost.lead")}</p>

      <div className="cost-switches">
        <div className="ix-seg two" role="group" aria-label={t("cost.insuredLabel")}>
          <button type="button" aria-pressed={insured} onClick={() => setInsured(true)}>
            {t("cost.insured")}
          </button>
          <button type="button" aria-pressed={!insured} onClick={() => setInsured(false)}>
            {t("cost.uninsured")}
          </button>
        </div>
        <div className="ix-seg two" role="group" aria-label={t("cost.hoursLabel")}>
          <button type="button" aria-pressed={!afterHours} onClick={() => setAfterHours(false)}>
            {t("cost.weekday")}
          </button>
          <button type="button" aria-pressed={afterHours} onClick={() => setAfterHours(true)}>
            {t("cost.afterHours")}
          </button>
        </div>
      </div>

      <p className="cost-mine">
        <span>{t("cost.mine")}</span>
        <strong dir="ltr">{range(mine)}</strong>
      </p>
      <dl className="cost-split">
        <dt>{t("cost.total")}</dt>
        <dd dir="ltr">{range(total)}</dd>
        <dt>{t("cost.byInsurance")}</dt>
        <dd dir="ltr">{insured ? range(insurance) : "₩0"}</dd>
      </dl>

      {emergency && <p className="flag danger">{t("cost.erNote", { n: Math.round(ER_MINOR_SHARE * 100) })}</p>}
      <p className="disclaimer">{t("cost.disclaimer", { date: COSTS_CHECKED })}</p>
    </section>
  );
}
