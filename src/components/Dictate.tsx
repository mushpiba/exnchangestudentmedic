import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useI18n } from "../i18n";

type Recognition = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};

const SPEECH_LANG: Record<string, string> = { uz: "uz-UZ", kk: "kk-KZ", ky: "ky-KG" };

/** Browser dictation. The student confirms in their own language first, then edits the transcript. */
export function Dictate({ append }: { append: (text: string) => void }) {
  const { t, locale } = useI18n();
  const api = window as typeof window & {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  const Engine = api.SpeechRecognition ?? api.webkitSpeechRecognition;
  const [asking, setAsking] = useState(false);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("");
  const ref = useRef<Recognition | null>(null);

  useEffect(
    () => () => {
      if (!ref.current) return;
      ref.current.onresult = ref.current.onend = ref.current.onerror = null;
      ref.current.abort();
    },
    [locale],
  );

  if (!Engine) return null;

  function start() {
    setAsking(false);
    const r = new Engine!();
    ref.current = r;
    r.lang = SPEECH_LANG[locale] ?? locale;
    r.interimResults = false;
    r.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript;
      if (text) {
        append(text);
        setMessage(t("speech.check"));
      }
    };
    r.onerror = () => {
      setMessage(t("speech.fail"));
      setActive(false);
    };
    r.onend = () => setActive(false);
    try {
      r.start();
      setActive(true);
    } catch {
      setMessage(t("speech.fail"));
    }
  }

  return (
    <div className="dictate">
      {active ? (
        <button type="button" onClick={() => ref.current?.abort()}>
          <Square size={16} aria-hidden /> {t("speech.stop")}
        </button>
      ) : asking ? (
        <div className="consent" role="dialog" aria-label={t("speech.label")}>
          <p>{t("speech.consent")}</p>
          <div className="row">
            <button type="button" onClick={() => setAsking(false)}>
              {t("common.cancel")}
            </button>
            <button type="button" className="primary" onClick={start}>
              {t("speech.start")}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAsking(true)}>
          <Mic size={16} aria-hidden /> {t("speech.label")}
        </button>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
