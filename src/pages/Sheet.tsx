// 접수대 QR을 찍은 환자가 보는 화면. 의원이 고른 질문이 주소 안에 들어 있어 서버도 계정도 없다.
// 환자는 자기 언어로 읽고 답하고, 마지막 화면은 직원이 읽도록 한국어로 바뀐다.
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Globe } from "lucide-react";
import { useI18n } from "../i18n";
import { LOCALES } from "../i18n/locales";
import { DESK_LINES, decodeSheet } from "../content/desk";
import { NaruMark } from "../components/art";

type Answer = "yes" | "no" | "unknown";
const ANSWER_KO: Record<Answer, string> = { yes: "예", no: "아니요", unknown: "모름" };

export function Sheet({ code }: { code?: string }) {
  const { t, tk, locale, rtl, setLocale } = useI18n();
  const picked = useMemo(() => decodeSheet(code), [code]);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [showStaff, setShowStaff] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const mine = { lang: locale, dir: rtl ? "rtl" : "ltr" } as const;

  if (!picked.length)
    return (
      <div className="sheetpage" {...mine}>
        <p className="muted">{t("common.none")}</p>
      </div>
    );

  const asked = picked.filter((i) => DESK_LINES[i].kind === "ask");

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
          {picked.map((i) => (
            <li key={i}>
              <span className="sheet-q">{tk(DESK_LINES[i].k)}</span>
              {DESK_LINES[i].kind === "ask" && (
                <strong className={"sheet-a " + (answers[i] ?? "none")}>
                  {answers[i] ? ANSWER_KO[answers[i]] : "답하지 않음"}
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
        <button type="button" className="lang-button" onClick={() => setLangOpen((v) => !v)}>
          <Globe size={18} aria-hidden />
          <span lang={locale}>{LOCALES.find((l) => l.code === locale)?.native}</span>
        </button>
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
        {picked.map((i) => {
          const line = DESK_LINES[i];
          return (
            <li key={i} className={line.kind}>
              <p className="sheet-mine">{t(line.k)}</p>
              {/* The Korean under each line is there for the member of staff reading over the patient's
                  shoulder. A Korean-reading patient would just see the same sentence twice. */}
              {locale !== "ko-KR" && (
                <p className="sheet-ko" lang="ko" dir="ltr">
                  {tk(line.k)}
                </p>
              )}
              {line.kind === "ask" && (
                <div className="sheet-buttons" role="group">
                  {(["yes", "no", "unknown"] as Answer[]).map((a) => (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={answers[i] === a}
                      onClick={() => setAnswers((prev) => ({ ...prev, [i]: a }))}
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
