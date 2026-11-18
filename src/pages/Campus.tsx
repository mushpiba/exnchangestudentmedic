import { useEffect, useState } from "react";
import { CalendarClock, ExternalLink, GraduationCap, HeartHandshake, Building2, MessageCircleMore, Phone, ShieldPlus, Stethoscope, UsersRound } from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";
import { LINKS } from "../content/facilities";
import { SCHOOL, type SchoolContact } from "../content/school";
import { SchoolHead } from "../components/SchoolHead";
import { useSchool } from "../state/prefs";
import { href } from "../app/router";
import { buddy as loadBuddy, HELP, type BuddyAction, type BuddyApi, type BuddyRequest, type Help, type Member } from "../campus/api";
import { Gate } from "../campus/Gate";
import { CallButton, Chip, Out, Section } from "../components/ui";
import { PhraseOverlay } from "../components/PhraseOverlay";

const STEPS = ["book", "bring", "reception", "consult", "pay", "pharmacy"];

function FirstVisit() {
  const { t } = useI18n();
  const [say, setSay] = useState<MessageKey | null>(null);
  return (
    <Section title={t("campus.firstVisit")} id="first-visit">
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

export const CONTACT_ICON: Record<SchoolContact["id"], typeof Phone> = { health: Stethoscope, oia: Building2, counsel: HeartHandshake };

/** The school tab: buddy first, then who to call at school, insurance and the first-visit steps. */
export function Campus({ focus }: { focus?: string }) {
  const { t } = useI18n();
  const school = useSchool();

  // #/school/<section> opens the tab at that section (home icons link here).
  useEffect(() => {
    if (!focus) return;
    const timer = setTimeout(() => document.getElementById(focus === "buddy" ? "buddy-form" : focus)?.scrollIntoView({ block: "start" }), 60);
    return () => clearTimeout(timer);
  }, [focus]);

  return (
    <section className="campus">
      <SchoolHead current="support" />

      {school !== "inha" ? (
        <div className="buddy-card">
          <h2>
            <GraduationCap size={22} aria-hidden /> {t("school.none")}
          </h2>
          <p>{t("school.noneBody")}</p>
          <a className="button primary wide" href={href("welcome")}>
            {t("school.choose")}
          </a>
        </div>
      ) : (
      <>
      <div className="buddy-card">
        <h2>
          <UsersRound size={22} aria-hidden /> {t("buddy.title")}
        </h2>
        <p>{t("buddy.intro")}</p>
        <a className="button primary wide" href="#buddy-form" onClick={(e) => { e.preventDefault(); document.getElementById("buddy-form")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
          {t("school.buddyStart")}
        </a>
      </div>

      <Section title={t("school.contacts")} id="contacts">
        <ul className="rows">
          {SCHOOL.contacts.map((c) => {
            const Icon = CONTACT_ICON[c.id];
            return (
              <li key={c.id}>
                <a className="item" href={"tel:" + c.phone}>
                  <span className="icon-box">
                    <Icon size={20} aria-hidden />
                  </span>
                  <span className="item-text">
                    <span className="item-title">{t(c.title)}</span>
                    <span className="item-sub">{t(c.sub)}</span>
                    <span className="item-sub" dir="ltr">{c.phone}</span>
                  </span>
                  <Phone className="chev" size={20} aria-hidden />
                </a>
              </li>
            );
          })}
        </ul>
        <div className="link-chips">
          <Out className="button" href={SCHOOL.homepage}>
            {t("school.homepage")}
          </Out>
          <Out className="button" href={SCHOOL.international}>
            {t("school.international")}
          </Out>
        </div>
        <p className="source">
          <ExternalLink size={16} aria-hidden /> {t("school.source", { date: SCHOOL.checked })}
        </p>
      </Section>
      </>
      )}

      <Section title={t("insurance.title")} id="insurance">
        <article className="info-card">
          <h3>
            <GraduationCap size={18} aria-hidden /> {t("insurance.school")}
          </h3>
          <p>{t("insurance.schoolBody")}</p>
          <Out href={LINKS.inha}>{t("insurance.inha")}</Out>
        </article>
        <article className="info-card">
          <h3>
            <ShieldPlus size={18} aria-hidden /> {t("insurance.nhis")}
          </h3>
          <p>{t("insurance.nhisBody")}</p>
          <Out href={LINKS.nhis}>{t("insurance.nhisLink")}</Out>
        </article>
        <CallButton number="1345" label={t("emergency.call1345")} />
      </Section>

      <FirstVisit />

      {school === "inha" && (
        <Section title={t("buddy.title")} id="buddy-form">
          <Gate>{(member) => <BuddyRequests member={member} />}</Gate>
        </Section>
      )}
    </section>
  );
}
