import { Camera, Languages, Pencil, Siren } from "lucide-react";
import { useI18n } from "../i18n";
import { useKorean } from "../lib/translate";
import { useCard, type Line, type Value } from "../state/card";

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
  const showMine = locale !== "ko-KR";
  const value = (v: Value, korean: boolean) => ("text" in v ? v.text : korean ? tk(v.key, v.params) : t(v.key, v.params));
  const mineProps = { lang: locale, dir: rtl ? "rtl" : "ltr" } as const;

  return (
    <dl className={"lines " + size}>
      {lines.map((line, i) => {
        const translated = line.values.some((v) => !("text" in v));
        return (
          <div className={"line" + (line.danger ? " is-danger" : "")} key={line.label + i}>
            <dt>
              {tk(line.label)}
              {line.danger && (
                <span className="danger-tag">
                  <Siren size={14} aria-hidden />
                  {tk("card.dangerSign")}
                </span>
              )}
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
                  {t(line.label)}
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
