// Horizontal bar chart for one measure across countries. Korea and the student's country are emphasised and
// labelled with their value; the other bars are context, their values in the table view (and the row's tooltip).
import { useI18n } from "../i18n";
import { Out } from "./ui";

export type Bar = { key: string; label: string; value: number; year: number; tone: "korea" | "home" | "avg" | "other" };

type Source = { label: string; url: string };

export function BarChart({ title, bars, note, source }: { title: string; bars: Bar[]; note?: string; source?: Source | Source[] }) {
  const { t, locale } = useI18n();
  const max = Math.max(...bars.map((b) => b.value));
  const fmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return (
    <figure className="chart">
      <figcaption className="chart-title">{title}</figcaption>
      <ul className="bars">
        {bars.map((b) => (
          <li key={b.key} className={"bar-row " + b.tone} title={`${b.label}: ${fmt.format(b.value)} (${b.year})`}>
            <span className="bar-label">{b.label}</span>
            <span className="bar-track">
              <span className="bar" style={{ width: `calc((100% - 64px) * ${max ? b.value / max : 0})` }} />
              <span className={b.tone === "other" ? "bar-value sr-only" : "bar-value"}>{fmt.format(b.value)}</span>
            </span>
          </li>
        ))}
      </ul>
      {note && <p className="chart-note">{note}</p>}
      <details className="chart-table">
        <summary>{t("guide.table")}</summary>
        <table>
          <tbody>
            {bars.map((b) => (
              <tr key={b.key}>
                <th scope="row">{b.label}</th>
                <td>{fmt.format(b.value)}</td>
                <td className="muted">{t("guide.year", { year: b.year })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      {[source ?? []].flat().map((s) => (
        <p className="chart-source" key={s.url}>
          <Out href={s.url}>
            {t("common.source")} · {s.label}
          </Out>
        </p>
      ))}
    </figure>
  );
}
