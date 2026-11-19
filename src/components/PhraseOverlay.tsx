import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CircleHelp, Info, Siren, Smartphone, X } from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";
import { Tick } from "./ui";

const QUESTION_ANSWERS: MessageKey[] = ["ans.yes", "ans.no", "ans.unsure"];
const STATEMENT_ANSWERS: MessageKey[] = ["ans.ok", "ans.again"];

/**
 * Full-screen phrase for a face-to-face moment.
 * Staff tap a Korean phrase → the student reads it in their language and taps an answer →
 * the answer appears large in Korean, on the paper slip, for staff.
 * "say": the student shows a Korean sentence to staff (`params` fill its placeholders in each language).
 */
export function PhraseOverlay({
  phrase,
  kind,
  onClose,
  onAnswer,
  params,
}: {
  phrase: MessageKey;
  kind: "question" | "statement" | "say";
  onClose: () => void;
  onAnswer?: (answer: MessageKey) => void;
  params?: { mine: Record<string, string | number>; ko: Record<string, string | number> };
}) {
  const { t, tk, locale, rtl } = useI18n();
  const [answer, setAnswer] = useState<MessageKey | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  const mine = { lang: locale, dir: rtl ? "rtl" : "ltr" } as const;
  const isEr = phrase === "staff.s.er";

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const close = () => ref.current?.close();
  const answers = kind === "question" ? QUESTION_ANSWERS : kind === "statement" ? STATEMENT_ANSWERS : [];
  const closeButton = (
    <button className="ov-close" type="button" onClick={close} aria-label={t("common.close")}>
      <X size={22} aria-hidden />
    </button>
  );

  let body;
  if (kind === "say") {
    body = (
      <>
        <div className="ov-top">{closeButton}</div>
        <div className="ov-a">
          <div className="slip answer-slip" lang="ko" dir="ltr">
            <div className="slip-stub">
              <p className="a-label" {...mine}>
                {t(phrase, params?.mine)}
              </p>
            </div>
            <div className="slip-body">
              <p className="say-ko">{tk(phrase, params?.ko)}</p>
            </div>
          </div>
        </div>
      </>
    );
  } else if (answer) {
    const ko = tk(answer);
    body = (
      <>
        <div className="ov-top">{closeButton}</div>
        <div className="ov-a" lang="ko" dir="ltr" aria-live="polite">
          <p className="a-asked">
            {kind === "question" ? <CircleHelp size={20} aria-hidden /> : <Info size={20} aria-hidden />}
            <span>{tk(phrase)}</span>
          </p>
          <div className="slip answer-slip">
            <div className="slip-stub">
              <p className="a-label">{tk("show.answer")}</p>
            </div>
            <div className="slip-body">
              <p className={"a-ko" + (ko.length <= 3 ? " is-short" : "")}>
                <Tick on />
                <span className="hl on">{ko}</span>
              </p>
              {locale !== "ko-KR" && (
                <p className="a-mine" {...mine}>
                  {t(answer)}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="ov-foot" lang="ko" dir="ltr">
          <button type="button" className="primary" onClick={close}>
            {tk("show.toCard")}
          </button>
          <button type="button" onClick={() => setAnswer(null)}>
            <ArrowLeft size={20} aria-hidden />
            {tk("common.back")}
          </button>
        </div>
      </>
    );
  } else {
    body = (
      <>
        <div className="ov-top">
          <p className="ov-note" lang="ko" dir="ltr">
            <Smartphone size={20} aria-hidden />
            {tk("show.forStudent")}
          </p>
          {closeButton}
        </div>
        <div className={"ov-q" + (isEr ? " is-er" : "")} {...mine}>
          {isEr && <Siren className="er-ic" aria-hidden />}
          <p className="q-mine" id="phrase-title">
            {t(phrase)}
          </p>
          <p className="q-ko" lang="ko" dir="ltr">
            {tk(phrase)}
          </p>
        </div>
        <div className="ov-answers" {...mine} role="group" aria-labelledby="phrase-title">
          {answers.map((a) => (
            <button
              key={a}
              type="button"
              className="ans"
              onClick={() => {
                setAnswer(a);
                onAnswer?.(a);
              }}
            >
              <Tick />
              {t(a)}
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <dialog ref={ref} className="phrase" onClose={onClose} onCancel={onClose} aria-labelledby={answer || kind === "say" ? undefined : "phrase-title"}>
      <div className="ov-inner">{body}</div>
    </dialog>
  );
}
