// 접수대 QR을 찍은 환자가 보는 화면. 의원이 고른 질문이 주소 안에 들어 있어 계정도 로그인도 없다.
// 환자는 자기 언어로 읽고 답하고, 마지막 화면은 직원이 읽도록 한국어로 바뀐다.
// 의원이 직접 적은 줄만 미리 번역된 것이 없어서, 화면이 열릴 때 번역한다(src/lib/translate.ts).
// 번역이 이상해 보이면 대조할 것이 두 개 있다 — 아래에 늘 있는 한국어 원문과, 켜고 끄는 영어.
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Globe, Languages } from "lucide-react";
import { useEnglish, useI18n } from "../i18n";
import { LOCALES } from "../i18n/locales";
import { DESK_LINES, decodeOwn, decodeSheet } from "../content/desk";
import { translateFromKorean, translateUrl } from "../lib/translate";
import { NaruMark } from "../components/art";

type Answer = "yes" | "no" | "unknown";
const ANSWER_KO: Record<Answer, string> = { yes: "예", no: "아니요", unknown: "모름" };

/** 한 줄. mine은 환자가 읽을 글, ko는 직원이 읽을 글. 의원이 직접 적은 줄은 처음에 mine·en이 비어 있다. */
type Row = { id: string; kind: "ask" | "tell"; mine: string; en: string; ko: string; own: boolean };

/** 의원이 적은 줄을 한 언어로 번역해 줄 id별로 모은다. 번역하지 못한 줄은 들어 있지 않다. */
async function collect(rows: Row[], locale: string) {
  const out = await Promise.all(rows.map((r) => translateFromKorean(r.ko, locale)));
  const got: Record<string, string> = {};
  rows.forEach((r, i) => {
    const text = out[i];
    if (text) got[r.id] = text;
  });
  return got;
}

export function Sheet({ code, own }: { code?: string; own?: string }) {
  const { t, tk, locale, rtl, setLocale } = useI18n();
  const te = useEnglish();
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [translated, setTranslated] = useState<Record<string, string>>({});
  const [english, setEnglish] = useState<Record<string, string>>({});
  const [tried, setTried] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [showStaff, setShowStaff] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const mine = { lang: locale, dir: rtl ? "rtl" : "ltr" } as const;

  const rows = useMemo<Row[]>(() => {
    const picked = decodeSheet(code).map((i) => ({
      id: "n" + i,
      kind: DESK_LINES[i].kind,
      mine: t(DESK_LINES[i].k),
      en: te(DESK_LINES[i].k),
      ko: tk(DESK_LINES[i].k),
      own: false,
    }));
    const extra = decodeOwn(own).map((line, j) => ({
      id: "o" + j,
      kind: line.kind,
      mine: "",
      en: "",
      ko: line.ko,
      own: true,
    }));
    return [...picked, ...extra];
  }, [code, own, t, te, tk]);

  const owns = useMemo(() => rows.filter((r) => r.own), [rows]);

  // 의원이 적은 줄은 환자가 누르기를 기다리지 않는다. 열자마자 번역해 두고, 아무것도 못 하면 바깥 링크를 보여 준다.
  useEffect(() => {
    if (!owns.length || locale === "ko-KR") {
      setTried(true);
      return;
    }
    let alive = true;
    setTried(false);
    collect(owns, locale).then((got) => {
      if (!alive) return;
      setTranslated(got);
      setTried(true);
    });
    return () => {
      alive = false;
    };
  }, [owns, locale]);

  // 영어는 눌렀을 때만 가져온다. 목록 질문은 이미 영어로 있고, 의원이 적은 줄만 번역이 필요하다.
  useEffect(() => {
    if (!showEnglish || !owns.length) return;
    let alive = true;
    collect(owns, "en-US").then((got) => alive && setEnglish(got));
    return () => {
      alive = false;
    };
  }, [showEnglish, owns]);

  if (!rows.length)
    return (
      <div className="sheetpage" {...mine}>
        <p className="muted">{t("common.none")}</p>
      </div>
    );

  const asked = rows.filter((r) => r.kind === "ask");

  if (showStaff)
    return (
      <div className="sheetpage" lang="ko" dir="ltr">
        <header className="sheet-top">
          <span className="brand" aria-label="NARU">
            <NaruMark />
          </span>
          <button type="button" onClick={() => setShowStaff(false)}>
            <ArrowLeft size={18} aria-hidden /> 환자 화면으로
          </button>
        </header>
        <h1>환자의 답</h1>
        <p className="muted">환자가 자기 언어로 읽고 고른 답입니다. 중요한 내용은 한 번 더 확인하세요.</p>
        <ol className="sheet-answers">
          {rows.map((row) => (
            <li key={row.id}>
              <span className="sheet-q">{row.ko}</span>
              {row.kind === "ask" && (
                <strong className={"sheet-a " + (answers[row.id] ?? "none")}>
                  {answers[row.id] ? ANSWER_KO[answers[row.id]] : "답하지 않음"}
                </strong>
              )}
            </li>
          ))}
        </ol>
      </div>
    );

  return (
    <div className="sheetpage" {...mine}>
      <header className="sheet-top">
        <span className="brand" dir="ltr" aria-label="NARU">
          <NaruMark />
        </span>
        <span className="sheet-tools">
          {/* 번역을 못 믿겠을 때 대 볼 수 있는 세 번째 글. 어느 언어로 보고 있든 이름은 English 그대로다. */}
          {locale !== "en-US" && (
            <button
              type="button"
              className="en-toggle"
              lang="en"
              dir="ltr"
              aria-pressed={showEnglish}
              onClick={() => setShowEnglish((v) => !v)}
            >
              English
            </button>
          )}
          <button type="button" className="lang-button" onClick={() => setLangOpen((v) => !v)}>
            <Globe size={18} aria-hidden />
            <span lang={locale}>{LOCALES.find((l) => l.code === locale)?.native}</span>
          </button>
        </span>
      </header>

      {langOpen && (
        <div className="langs sheet-langs">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              lang={l.code}
              dir={l.rtl ? "rtl" : "ltr"}
              aria-pressed={l.code === locale}
              onClick={async () => {
                await setLocale(l.code);
                setLangOpen(false);
              }}
            >
              {l.native}
              {l.code === locale && <Check size={16} aria-hidden />}
            </button>
          ))}
        </div>
      )}

      <ol className="sheet-lines">
        {rows.map((row) => {
          const says = row.own ? translated[row.id] : row.mine;
          const reads = row.own ? english[row.id] : row.en;
          return (
            <li key={row.id} className={row.kind}>
              {says && <p className="sheet-mine">{says}</p>}
              {showEnglish && reads && (
                <p className={says ? "sheet-en" : "sheet-mine"} lang="en" dir="ltr">
                  {reads}
                </p>
              )}
              {/* The Korean under each line is there for the member of staff reading over the patient's
                  shoulder, and for the patient who thinks the translation came out wrong.
                  A Korean-reading patient would just see the same sentence twice. */}
              {(!says || locale !== "ko-KR") && (
                <p className={says || reads ? "sheet-ko" : "sheet-mine"} lang="ko" dir="ltr">
                  {row.ko}
                </p>
              )}
              {/* 기기도 서버도 이 언어를 못 하면 남는 길은 바깥 번역기다. 환자가 직접 누를 때만 열린다. */}
              {row.own && !says && tried && locale !== "ko-KR" && (
                <p className="sheet-translate">
                  <a className="button" href={translateUrl(row.ko, locale)} target="_blank" rel="noreferrer">
                    <Languages size={16} aria-hidden /> {t("common.translate")}
                  </a>
                </p>
              )}
              {row.kind === "ask" && (
                <div className="sheet-buttons" role="group">
                  {(["yes", "no", "unknown"] as Answer[]).map((a) => (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={answers[row.id] === a}
                      onClick={() => setAnswers((prev) => ({ ...prev, [row.id]: a }))}
                    >
                      {a === "yes" ? t("common.yes") : a === "no" ? t("common.no") : t("common.unknown")}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="sheet-foot">
        <p className="muted small">
          {t("common.selected", { n: Object.keys(answers).length })} / {asked.length}
        </p>
        <button type="button" className="primary" onClick={() => setShowStaff(true)}>
          {t("common.show")}
        </button>
      </div>
    </div>
  );
}
