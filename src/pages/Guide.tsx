// Korean-healthcare guide: column list (on the guide tab), one column, and "my country vs Korea".
import { useMemo, useState } from "react";
import { ChevronRight, Globe2, Newspaper } from "lucide-react";
import { useI18n } from "../i18n";
import { href } from "../app/router";
import { BarChart, type Bar } from "../components/BarChart";
import { Notice, Out, PageHead, Section } from "../components/ui";
import { CHARTS, COLUMNS, COLUMN_FIGURES, COLUMN_SOURCES, useGuideText, type Block, type ChartId, type ColumnId, type GuideText } from "../content/guide";
import homeSources from "../content/guide/home-sources.json";
import { FLAGS } from "../content/conditions";
import { FlagList } from "./Info";
import { HOME_COUNTRIES, LOCALE_COUNTRY, WORLD_BANK_SOURCE, figure, figureSource, type Country, type Indicator } from "../content/guide/figures";

function useRegionName() {
  const { locale } = useI18n();
  return useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([locale, "en"], { type: "region" });
    } catch {
      names = null;
    }
    return (c: Country) => names?.of(c) ?? c;
  }, [locale]);
}

/** A chart from CHARTS, with the student's country added and emphasised. */
function GuideChart({ id, text }: { id: ChartId; text: GuideText }) {
  const { t, locale } = useI18n();
  const region = useRegionName();
  const def = CHARTS[id];
  const words = text.charts[id];
  if (!def || !words) return null;
  const home = LOCALE_COUNTRY[locale];
  const countries = home && !def.countries.includes(home) ? [...def.countries, home] : def.countries;
  const bars: Bar[] = countries.flatMap((c) => {
    const f = def.figure(c);
    return f ? [{ key: c, label: region(c), value: f[0], year: f[1], tone: c === "KR" ? "korea" : c === home ? "home" : "other" } as Bar] : [];
  });
  if (def.avg) bars.push({ key: "OECD", label: t("guide.oecdAvg"), value: def.avg[0], year: def.avg[1], tone: "avg" });
  bars.sort((a, b) => b.value - a.value);
  // Taiwan's figure comes from its own government statistics, not the chart's source.
  const tw = home === "TW" && def.indicator && bars.some((b) => b.key === "TW") ? t(`guide.tw.${def.indicator}` as const) : "";
  const note = [words.note, tw].filter(Boolean).join(" ") || undefined;
  const sources = tw && def.indicator ? [def.source(), figureSource("TW", def.indicator)] : def.source();
  return <BarChart title={words.title} note={note} bars={bars} source={sources} />;
}

function Blocks({ blocks, text }: { blocks: Block[]; text: GuideText }) {
  return (
    <>
      {blocks.map((b, i) => {
        if ("p" in b) return <p key={i}>{b.p}</p>;
        if ("h" in b) return <h2 key={i}>{b.h}</h2>;
        if ("list" in b)
          return (
            <ul key={i} className="guide-list">
              {b.list.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          );
        if ("chart" in b) return <GuideChart key={i} id={b.chart} text={text} />;
        if ("flags" in b) return <FlagList key={i} flags={Object.keys(FLAGS)} />;
        if ("tip" in b)
          return (
            <p key={i} className="guide-tip">
              {b.tip}
            </p>
          );
        return (
          <div key={i} className="guide-table-wrap">
            <table className="guide-table">
              {b.table.caption && <caption>{b.table.caption}</caption>}
              <thead>
                <tr>
                  {b.table.head.map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.table.rows.map((r, j) => (
                  <tr key={j}>
                    {r.map((c, k) => (k === 0 ? <th key={k} scope="row">{c}</th> : <td key={k}>{c}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}

/** Top of the guide tab: the comparison card and the column list. */
export function GuideHome() {
  const { t, locale } = useI18n();
  const text = useGuideText(locale);
  const region = useRegionName();
  const home = LOCALE_COUNTRY[locale];
  return (
    <>
      <a className="compare-card" href={href("info", "compare")}>
        <Globe2 size={26} aria-hidden />
        <span>
          <strong>{t("guide.compare")}</strong>
          <small>{home ? region(home) + " · " + region("KR") : t("guide.compareSub")}</small>
        </span>
        <ChevronRight className="flip" size={20} aria-hidden />
      </a>
      <Section title={t("guide.columns")}>
        {text === null ? (
          <p className="muted">{t("common.loading")}</p>
        ) : (
          <ul className="column-list">
            {COLUMNS.filter((id) => text.columns[id]).map((id) => (
              <li key={id}>
                <a href={href("info", "guide", id)}>
                  <Newspaper size={20} aria-hidden />
                  <span>
                    <strong>{text.columns[id]!.title}</strong>
                    <small>{text.columns[id]!.lead}</small>
                    {COLUMN_FIGURES[id]?.[0] && (
                      <span className="guide-figure-tag" dir="ltr">
                        {COLUMN_FIGURES[id][0].value}
                      </span>
                    )}
                  </span>
                  <ChevronRight className="flip" size={20} aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

/** The column's own numbers, before its words. Large on purpose: this is the part that gets read. */
function Figures({ id }: { id: ColumnId }) {
  const { t } = useI18n();
  const figures = COLUMN_FIGURES[id];
  if (!figures?.length) return null;
  return (
    <ul className="guide-figures">
      {figures.map((f) => (
        <li key={f.label}>
          <strong dir="ltr">{f.value}</strong>
          <span>{t(f.label)}</span>
        </li>
      ))}
    </ul>
  );
}

export function GuideColumn({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const text = useGuideText(locale);
  const column = text?.columns[id as ColumnId];
  return (
    <article className="guide-column">
      {text === null ? (
        <p className="muted">{t("common.loading")}</p>
      ) : !column ? (
        <Notice>{t("community.empty")}</Notice>
      ) : (
        <>
          <PageHead title={column.title} intro={column.lead} icon={<Newspaper />} />
          <Figures id={id as ColumnId} />
          <Blocks blocks={column.blocks} text={text} />
          <Section title={t("guide.sources")}>
            <ul className="source-list">
              {COLUMN_SOURCES[id as ColumnId]?.map((s) => (
                <li key={s.url}>
                  <Out href={s.url}>{s.label}</Out>
                </li>
              ))}
            </ul>
          </Section>
          <p className="disclaimer">{t("guide.draft")}</p>
        </>
      )}
    </article>
  );
}

const COMPARE: Indicator[] = ["physicians", "beds", "spendGdp", "oop", "spendPc", "life"];

export function GuideCompare() {
  const { t, locale } = useI18n();
  const text = useGuideText(locale);
  const region = useRegionName();
  const own = LOCALE_COUNTRY[locale];
  const [country, setCountry] = useState<Exclude<Country, "KR">>(own ?? HOME_COUNTRIES[0]);
  const words = text?.home[country];
  const sources = (homeSources as Record<string, { summary?: string; points: string[] }>)[country];
  return (
    <article className="guide-compare">
      <PageHead title={t("guide.compare")} intro={t("guide.compareIntro")} icon={<Globe2 />} />
      <label className="field">
        <span>{t("guide.pickCountry")}</span>
        <select value={country} onChange={(e) => setCountry(e.target.value as Exclude<Country, "KR">)}>
          {HOME_COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {region(c)}
            </option>
          ))}
        </select>
      </label>

      {words ? (
        <Section title={t("guide.differences", { country: region(country) })}>
          <p>
            {words.summary} {sources?.summary && <Out href={sources.summary}>{t("common.source")}</Out>}
          </p>
          <ul className="diff-list">
            {words.points.map((p, i) => (
              <li key={p.home}>
                <p className="diff-home">
                  <strong>{region(country)}</strong> {p.home}
                </p>
                <p className="diff-korea">
                  <strong>{region("KR")}</strong> {p.korea}
                </p>
                {sources?.points[i] && (
                  <Out className="out diff-source" href={sources.points[i]}>
                    {t("common.source")}
                  </Out>
                )}
              </li>
            ))}
          </ul>
        </Section>
      ) : (
        text && <Notice>{t("guide.onlyNumbers")}</Notice>
      )}

      <Section title={t("guide.numbers")}>
        {COMPARE.map((ind) => {
          const pair = ([country, "KR"] as Country[]).flatMap((c) => {
            const f = figure(c, ind);
            return f ? [{ key: c, label: region(c), value: f[0], year: f[1], tone: c === "KR" ? "korea" : "home" } as Bar] : [];
          });
          return pair.length === 2 ? (
            <BarChart
              key={ind}
              title={t(`guide.ind.${ind}` as const)}
              bars={pair}
              note={country === "TW" ? t(`guide.tw.${ind}` as const) : undefined}
              source={figureSource(country, ind)}
            />
          ) : null;
        })}
        <p className="muted small">
          {t("guide.numbersNote", { date: WORLD_BANK_SOURCE.fetched })} <Out href={WORLD_BANK_SOURCE.url}>World Bank</Out>
        </p>
      </Section>
      <p className="disclaimer">{t("guide.draft")}</p>
    </article>
  );
}
