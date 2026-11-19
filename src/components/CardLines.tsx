import { Camera, Languages, Pencil, Siren } from "lucide-react";
import { useI18n } from "../i18n";
import { useKorean } from "../lib/translate";
import { useCard, type Line, type Value } from "../state/card";
import { useIntakeText } from "../intake/text";

/**
 * The student's own words: a Korean translation on top when this device can translate on its own,
 * the original underneath. Without a translation, the original with a note that it is untranslated.
 */
function OriginalWords({ text }: { text: string }) {
  const { tk, locale } = useI18n();
  const { card } = useCard();
  const onDevice = useKorean(card.translations[text] ? "" : text, locale);
  const korean = card.translations[text] ?? onDevice;
  if (!korean)
    return (
      <>
        <span className="v-orig" dir="auto">
          {text}
        </span>
        <span className="v-note">
          <Pencil size={16} aria-hidden />
          {tk("card.originalNote")}
        </span>
      </>
    );
  return (
    <>
      <span className="v-ko">{korean}</span>
      <span className="v-note">
        <Languages size={16} aria-hidden />
        {tk("card.autoTranslated")}
      </span>
      <span className="v-orig-label">{tk("card.originalText")}</span>
      <span className="v-orig small-orig" dir="auto">
        {text}
      </span>
    </>
  );
}

/** Korean label and value for staff; the student's language small under each line so they can check it. */
export function CardLines({ lines, size = "normal" }: { lines: Line[]; size?: "normal" | "large" }) {
  const { t, tk, locale, rtl } = useI18n();
  // Intake texts (questions, answers, symptom names) load with the intake; only needed when the card has them.
  const { text: intake } = useIntakeText();
  const showMine = locale !== "ko-KR";
  const value = (v: Value, korean: boolean): string => {
    if ("text" in v) return v.text;
    if ("it" in v) return intake ? (korean ? intake.ik(v.it, v.params) : intake.it(v.it, v.params)) : "…";
    if ("sym" in v) return intake ? (korean ? intake.sk(v.sym) : intake.sn(v.sym)) : "…";
    return korean ? tk(v.key, v.params) : t(v.key, v.params);
  };
  const label = (line: Line, korean: boolean) => {
    const base = line.labelIt ? (intake ? (korean ? intake.ik(line.labelIt) : intake.it(line.labelIt)) : "…") : korean ? tk(line.label) : t(line.label);
    const about = line.about && intake ? (korean ? intake.sk(line.about) : intake.sn(line.about)) : "";
    return about ? `${base} (${about})` : base;
  };
  const mineProps = { lang: locale, dir: rtl ? "rtl" : "ltr" } as const;

  return (
    <dl className={"lines " + size}>
      {lines.map((line, i) => {
        const translated = line.values.some((v) => !("text" in v));
        return (
          <div className={"line" + (line.danger ? " is-danger" : "") + (line.note ? " is-note" : "")} key={(line.labelIt ?? line.label) + i}>
            <dt>
              {label(line, true)}
              {line.danger && (
                <span className="danger-tag">
                  <Siren size={14} aria-hidden />
                  {tk("card.dangerSign")}
                </span>
              )}
              {line.note && !line.danger && intake && <span className="note-tag">{intake.ik("ui.flagged")}</span>}
            </dt>
            <dd>
              {line.original ? (
                <OriginalWords text={line.values.map((v) => value(v, true)).join(", ")} />
              ) : (
                <>
                  <span className="v-ko">{line.values.map((v) => value(v, true)).join(", ")}</span>
                  {line.source && (
                    <span className="v-note" lang="ko">
                      <Camera size={16} aria-hidden />
                      {line.source}
                    </span>
                  )}
                </>
              )}
              {showMine && (
                <span className="v-mine" {...mineProps}>
                  {label(line, false)}
                  {translated && !line.original && ": " + line.values.map((v) => value(v, false)).join(rtl ? "، " : ", ")}
                </span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
