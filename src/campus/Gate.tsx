import { useEffect, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { useI18n } from "../i18n";
import { campusAuth, type AuthState, type CampusAuth, type Member } from "./api";
import { Notice } from "../components/ui";

export function useCampusAuth() {
  const [auth, setAuth] = useState<CampusAuth | null>(null);
  const [state, setState] = useState<AuthState | null>(null);
  useEffect(() => {
    let off = () => {};
    campusAuth().then((a) => {
      setAuth(a);
      setState(a.current());
      off = a.subscribe(setState);
    });
    return () => off();
  }, []);
  return { auth, state };
}

/** Preview: shows a sample banner. Live: school e-mail OTP for members registered by the operator. */
export function Gate({ children }: { children: (member: Member | null) => ReactNode }) {
  const { t } = useI18n();
  const { auth, state } = useCampusAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!auth || !state) return <p className="muted">{t("common.loading")}</p>;
  if (state.status === "preview")
    return (
      <>
        <Notice>{t("community.sampleBanner")}</Notice>
        {children(null)}
      </>
    );
  if (state.status === "member")
    return (
      <>
        <div className="signed-in">
          <span>{state.member.name || state.member.campus}</span>
          <button type="button" onClick={() => auth.signOut()}>
            <LogOut size={16} aria-hidden /> {t("auth.signOut")}
          </button>
        </div>
        {children(state.member)}
      </>
    );
  if (state.status === "noMember")
    return (
      <div className="card-box">
        <p>{t("auth.notMember")}</p>
        <button type="button" onClick={() => auth.signOut()}>
          {t("auth.signOut")}
        </button>
      </div>
    );

  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (!sent) {
        await auth!.sendCode(email);
        setSent(true);
      } else await auth!.verify(email, code);
    } catch {
      setError(t("auth.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="card-box"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <h2>{t("auth.title")}</h2>
      <p className="muted">{t("auth.notMember")}</p>
      <label>
        {t("auth.email")}
        <input type="email" required autoComplete="email" readOnly={sent} value={email} onChange={(e) => setEmail(e.target.value.trim())} />
      </label>
      {sent && (
        <label>
          {t("auth.code")}
          <input required inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
        </label>
      )}
      <div className="row">
        {sent && (
          <button type="button" onClick={() => setSent(false)}>
            {t("common.back")}
          </button>
        )}
        <button className="primary" disabled={busy}>
          {t(sent ? "auth.signIn" : "auth.sendCode")}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
