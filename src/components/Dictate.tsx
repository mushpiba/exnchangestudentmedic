import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useI18n } from "../i18n";

type Result = ArrayLike<{ transcript: string }> & { isFinal: boolean };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<Result> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

const SPEECH_LANG: Record<string, string> = { uz: "uz-UZ", kk: "kk-KZ", ky: "ky-KG" };
/** Phones end the turn at every pause. Restarting is what lets a sentence come out in pieces, and the
 *  cap is what stops a device with no working microphone from looping on silence. */
const RESTARTS = 20;

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
  const [partial, setPartial] = useState("");
  const [message, setMessage] = useState("");
  const ref = useRef<Recognition | null>(null);
  const stopped = useRef(true);
  const restarts = useRef(0);

  useEffect(
    () => () => {
      if (!ref.current) return;
      stopped.current = true;
      ref.current.onresult = ref.current.onend = ref.current.onerror = null;
      ref.current.abort();
    },
    [locale],
  );

  if (!Engine) return null;

  function start() {
    setAsking(false);
    setPartial("");
    const r = new Engine!();
    ref.current = r;
    stopped.current = false;
    restarts.current = 0;
    r.lang = SPEECH_LANG[locale] ?? locale;
    // Someone who is ill speaks in pieces -- a symptom, a pause, when it started. Keeping the
    // microphone open past that pause is the difference between one symptom and the whole sentence.
    r.continuous = true;
    // And showing the words as they land is how the student knows the microphone is hearing them.
    r.interimResults = true;
    r.onresult = (e) => {
      let final = "";
      let heard = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0]?.transcript ?? "";
        if (e.results[i].isFinal) final += text;
        else heard += text;
      }
      setPartial(heard.trim());
      if (final.trim()) {
        append(final.trim());
        setMessage(t("speech.check"));
      }
    };
    r.onerror = (e) => {
      // Silence and our own stop are not failures: the engine ends the turn and onend decides.
      if (e.error === "no-speech" || e.error === "aborted") return;
      stopped.current = true;
      setMessage(t(e.error === "not-allowed" || e.error === "service-not-allowed" ? "speech.denied" : "speech.fail"));
      setActive(false);
    };
    r.onend = () => {
      setPartial("");
      if (stopped.current || restarts.current >= RESTARTS) {
        setActive(false);
        return;
      }
      restarts.current++;
      try {
        r.start();
      } catch {
        setActive(false);
      }
    };
    try {
      r.start();
      setActive(true);
    } catch {
      setMessage(t("speech.fail"));
    }
  }

  function stop() {
    stopped.current = true;
    ref.current?.stop();
  }

  return (
    <div className="dictate">
      {active ? (
        <button type="button" onClick={stop}>
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
      {partial && (
        <p className="dictate-partial" aria-hidden dir="auto">
          {partial}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
