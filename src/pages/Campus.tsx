import { useEffect, useState } from "react";
import { CalendarClock, GraduationCap, MessageCircleMore, ShieldPlus, UsersRound } from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";
import { LINKS } from "../content/facilities";
import { buddy as loadBuddy, HELP, type BuddyAction, type BuddyApi, type BuddyRequest, type Help, type Member } from "../campus/api";
import { Gate } from "../campus/Gate";
import { CallButton, Chip, Notice, Out, PageHead, Section } from "../components/ui";
import { PhraseOverlay } from "../components/PhraseOverlay";

const STEPS = ["book", "bring", "reception", "consult", "pay", "pharmacy"];

function FirstVisit() {
  const { t } = useI18n();
  const [say, setSay] = useState<MessageKey | null>(null);
  return (
    <Section title={t("campus.firstVisit")}>
      <ol className="visit-steps">
        {STEPS.map((s, i) => (
          <li key={s}>
            <span className="num" aria-hidden>
              {i + 1}
            </span>
            <div>
              <strong>{t(("campus.step." + s) as MessageKey)}</strong>
              <p>{t(("campus.step." + s + ".body") as MessageKey)}</p>
              <button type="button" className="say" onClick={() => setSay(("campus.step." + s + ".say") as MessageKey)}>
                <MessageCircleMore size={16} aria-hidden /> {t("campus.sayThis")}
              </button>
            </div>
          </li>
        ))}
      </ol>
      {say && <PhraseOverlay phrase={say} kind="say" onClose={() => setSay(null)} />}
    </Section>
  );
}

function BuddyRequests({ member }: { member: Member | null }) {
  const { t, locale } = useI18n();
  const [api, setApi] = useState<BuddyApi | null>(null);
  const [list, setList] = useState<BuddyRequest[]>([]);
  const [buddies, setBuddies] = useState<{ id: string; name: string }[]>([]);
  const [assignee, setAssignee] = useState("");
  const [when, setWhen] = useState("");
  const [place, setPlace] = useState("");
  const [help, setHelp] = useState<Help[]>(["move", "reception"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const operator = member?.role === "operator";

  const refresh = async (a = api) => {
    if (!a) return;
    setList(await a.list());
    if (operator) setBuddies(await a.buddies());
  };
  useEffect(() => {
    loadBuddy().then((a) => {
      setApi(a);
      refresh(a);
    });
  }, [member?.id]);

  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh();
    } catch {
      setError(t("auth.error"));
    } finally {
      setBusy(false);
    }
  }

  const actions = (r: BuddyRequest): BuddyAction[] => [
    ...(operator && r.status === "requested" ? (["assign"] as const) : []),
    ...(r.assignedToMe && r.status === "assigned" ? (["accept", "decline"] as const) : []),
    ...((r.mine || operator) && ["requested", "assigned", "accepted"].includes(r.status) ? (["cancel"] as const) : []),
    ...((r.mine || r.assignedToMe) && r.status === "accepted" ? (["finish"] as const) : []),
  ];

  return (
    <>
      <form
        className="card-box"
        onSubmit={(e) => {
          e.preventDefault();
          act(() => api!.request({ startsAt: new Date(when).toISOString(), place: place.trim(), help, locale }));
          setPlace("");
        }}
      >
        <label>
          {t("buddy.when")}
          <input type="datetime-local" required value={when} onChange={(e) => setWhen(e.target.value)} />
        </label>
        <label>
          {t("buddy.place")}
          <input dir="auto" maxLength={120} value={place} placeholder={t("buddy.placePh")} onChange={(e) => setPlace(e.target.value)} />
        </label>
        <fieldset>
          <legend>{t("buddy.help")}</legend>
          <div className="choices">
            {HELP.map((h) => (
              <Chip key={h} on={help.includes(h)} onClick={() => setHelp(help.includes(h) ? help.filter((x) => x !== h) : [...help, h])}>
                {t(("buddy.help." + h) as MessageKey)}
              </Chip>
            ))}
          </div>
        </fieldset>
        <button className="primary" disabled={busy || !api}>
          {t("buddy.submit")}
        </button>
        {api?.mode === "preview" && <p className="muted small">{t("buddy.previewNote")}</p>}
        {error && <p role="alert">{error}</p>}
      </form>

      {operator && (
        <label>
          {t("buddy.pickBuddy")}
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">—</option>
            {buddies.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name || "—"}
              </option>
            ))}
          </select>
        </label>
      )}

      {list.length === 0 ? (
        <p className="muted">{t("buddy.none")}</p>
      ) : (
        <ul className="requests">
          {list.map((r) => (
            <li key={r.id}>
              <div>
                <strong>
                  <CalendarClock size={16} aria-hidden /> {new Date(r.startsAt).toLocaleString(locale)}
                </strong>
                {r.place && <span dir="auto">{r.place}</span>}
                <span>{r.help.map((h) => t(("buddy.help." + h) as MessageKey)).join(" · ")}</span>
                <span className={"status " + r.status}>
                  {t(("buddy.status." + r.status) as MessageKey)}
                  {r.buddyName && " · " + r.buddyName}
                </span>
              </div>
              <div className="row">
                {actions(r).map((a) => (
                  <button
                    key={a}
                    type="button"
                    disabled={busy || (a === "assign" && !assignee)}
                    onClick={() => act(() => api!.act(r.id, a, a === "assign" ? assignee : undefined))}
                  >
                    {t(("buddy." + a) as MessageKey)}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function Campus() {
  const { t } = useI18n();
  return (
    <section className="campus">
      <PageHead title={t("campus.title")} intro={t("home.campusSub")} icon={<GraduationCap />} />
      <FirstVisit />

      <Section title={t("insurance.title")}>
        <article className="info-card">
          <h3>
            <ShieldPlus size={18} aria-hidden /> {t("insurance.nhis")}
          </h3>
          <p>{t("insurance.nhisBody")}</p>
          <Out href={LINKS.nhis}>{t("insurance.nhisLink")}</Out>
        </article>
        <article className="info-card">
          <h3>
            <GraduationCap size={18} aria-hidden /> {t("insurance.school")}
          </h3>
          <p>{t("insurance.schoolBody")}</p>
          <Out href={LINKS.inha}>{t("insurance.inha")}</Out>
        </article>
        <CallButton number="1345" label={t("emergency.call1345")} />
      </Section>

      <Section title={t("buddy.title")} id="buddy">
        <p>
          <UsersRound size={18} aria-hidden /> {t("buddy.intro")}
        </p>
        <Gate>{(member) => <BuddyRequests member={member} />}</Gate>
      </Section>
      <Notice>{t("app.notice")}</Notice>
    </section>
  );
}
