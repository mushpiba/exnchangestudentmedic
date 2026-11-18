import { Camera, Pencil } from "lucide-react";
import { useI18n } from "../i18n";
import type { Line, Value } from "../state/card";

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
          <div className="line" key={line.label + i}>
            <dt>{tk(line.label)}</dt>
            <dd>
              {line.original ? (
                <>
                  <span className="v-orig" dir="auto">
                    {line.values.map((v) => value(v, true)).join(", ")}
                  </span>
                  <span className="v-note">
                    <Pencil size={16} aria-hidden />
                    {tk("card.originalNote")}
                  </span>
                </>
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
