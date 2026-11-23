import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ExternalLink, GraduationCap, HandHeart, HeartHandshake, Building2, MessagesSquare, Phone, ShieldPlus, Stethoscope, UsersRound } from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";
import { LINKS } from "../content/facilities";
import { type SchoolContact } from "../content/school";
import { SchoolHead } from "../components/SchoolHead";
import { useSchoolInfo } from "../state/prefs";
import { href } from "../app/router";
import { buddy as loadBuddy, HELP, type BuddyAction, type BuddyApi, type BuddyRequest, type Help, type Member, type OpenRequest } from "../campus/api";
import { LOCALES, nativeName, type Locale } from "../i18n/locales";
import { HOME_COUNTRIES } from "../content/guide/figures";
import { Gate } from "../campus/Gate";
import { CallButton, Chip, Out, Section } from "../components/ui";
import { BuddyWalk } from "../components/art";

function BuddyRequests({ member }: { member: Member | null }) {
  const { t, locale } = useI18n();
  const [api, setApi] = useState<BuddyApi | null>(null);
  const [list, setList] = useState<BuddyRequest[]>([]);
  const [board, setBoard] = useState<OpenRequest[]>([]);
  // Raising a hand takes a word with it, so the request is answered by a person and not a button.
  const [offering, setOffering] = useState("");
  const [note, setNote] = useState("");
  const [buddies, setBuddies] = useState<{ id: string; name: string }[]>([]);
  const [assignee, setAssignee] = useState("");
  const [when, setWhen] = useState("");
  const [place, setPlace] = useState("");
  const [help, setHelp] = useState<Help[]>(["move", "reception"]);
  // A buddy is picked for the student, so the two things that decide who fits come from the form itself.
  const [speak, setSpeak] = useState(locale);
  const [country, setCountry] = useState("");
  const countryName = useMemo(() => {
    try {
      const names = new Intl.DisplayNames([locale], { type: "region" });
      return (c: string) => names.of(c) ?? c;
    } catch {
      return (c: string) => c;
    }
  }, [locale]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const operator = member?.role === "operator";
  const others = board.filter((r) => !r.mine);
  // How the student finds out that someone answered: the count is on the screen they already open.
  const waiting = list.reduce((n, r) => n + (r.status === "requested" ? r.offers.length : 0), 0);

  const refresh = async (a = api) => {
    if (!a) return;
    setList(await a.list());
    setBoard(await a.open());
    setOffering("");
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
          act(() => api!.request({ startsAt: new Date(when).toISOString(), place: place.trim(), help, locale: speak, country }));
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
        <label>
          {t("buddy.lang")}
          <select value={speak} onChange={(e) => setSpeak(e.target.value as Locale)}>
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("buddy.country")}
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">{t("common.none")}</option>
            {HOME_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {countryName(c)}
              </option>
            ))}
          </select>
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

      {waiting > 0 && (
        <p className="buddy-waiting">
          <HandHeart size={18} aria-hidden /> {t("buddy.newOffers", { n: waiting })}
        </p>
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
                <span className="muted">
                  {nativeName(r.locale)}
                  {r.country && " · " + countryName(r.country)}
                </span>
                <span className={"status " + r.status}>
                  {t(("buddy.status." + r.status) as MessageKey)}
                  {r.buddyName && " · " + r.buddyName}
                </span>
                {r.offers.length > 0 && (
                  <ul className="offers">
                    {r.offers.map((o) => (
                      <li key={o.member}>
                        <span dir="auto">
                          {o.name || "—"}
                          {o.note && " · " + o.note}
                        </span>
                        {r.status === "requested" && (
                          <button type="button" disabled={busy} onClick={() => act(() => api!.pick(r.id, o.member))}>
                            {t("buddy.pick")}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
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

      <h3 className="buddy-board-h">{t("buddy.board")}</h3>
      <p className="muted small">{t("buddy.boardNote")}</p>
      {others.length === 0 ? (
        <p className="muted">{t("buddy.boardNone")}</p>
      ) : (
        <ul className="requests">
          {others.map((r) => (
            <li key={r.id}>
              <div>
                <strong>
                  <CalendarClock size={16} aria-hidden /> {new Date(r.day + "T00:00:00").toLocaleDateString(locale)}
                </strong>
                <span>{r.help.map((h) => t(("buddy.help." + h) as MessageKey)).join(" · ")}</span>
                <span className="muted">
                  {nativeName(r.locale)}
                  {r.country && " · " + countryName(r.country)}
                </span>
                {r.offers > 0 && <span className="muted">{t("buddy.offers", { n: r.offers })}</span>}
              </div>
              {offering === r.id ? (
                <div className="row offer-note">
                  <input
                    dir="auto"
                    maxLength={300}
                    value={note}
                    placeholder={t("buddy.offerNote")}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <button type="button" className="primary" disabled={busy} onClick={() => act(() => api!.offer(r.id, note.trim()))}>
                    {t("buddy.offer")}
                  </button>
                </div>
              ) : (
                <div className="row">
                  {r.offered ? (
                    <button type="button" disabled={busy} onClick={() => act(() => api!.withdrawOffer(r.id))}>
                      {t("buddy.withdraw")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setOffering(r.id);
                        setNote("");
                      }}
                    >
                      <HandHeart size={16} aria-hidden /> {t("buddy.offer")}
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export const CONTACT_ICON: Record<SchoolContact["id"], typeof Phone> = { health: Stethoscope, oia: Building2, counsel: HeartHandshake };

/** The school tab: buddy first, then who to call at school and insurance. The first-visit steps are
 *  in the guide tab -- they are about Korean clinics, not about the school. */
export function Campus({ focus }: { focus?: string }) {
  const { t } = useI18n();
  const school = useSchoolInfo();

  // #/school/<section> opens the tab at that section (home icons link here).
  useEffect(() => {
    if (!focus) return;
    const timer = setTimeout(() => document.getElementById(focus === "buddy" ? "buddy-form" : focus)?.scrollIntoView({ block: "start" }), 60);
    return () => clearTimeout(timer);
  }, [focus]);

  return (
    <section className="campus">
      <SchoolHead current="support" />

      {!school ? (
        <div className="buddy-card">
          <h2>
            <GraduationCap size={22} aria-hidden /> {t("school.none")}
          </h2>
          <p>{t("school.noneBody")}</p>
          <a className="button primary wide" href={href("welcome", "school")}>
            {t("school.choose")}
          </a>
        </div>
      ) : (
      <>
      <div className="buddy-card">
        <h2>
          <UsersRound size={22} aria-hidden /> {t("buddy.title")}
        </h2>
        <BuddyWalk say={t("buddy.bubble")} />
        <p>{t("buddy.intro")}</p>
        <a className="button primary wide" href="#buddy-form" onClick={(e) => { e.preventDefault(); document.getElementById("buddy-form")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
          {t("school.buddyStart")}
        </a>
        <a className="button wide" href={href("community", "buddy")}>
          <MessagesSquare size={18} aria-hidden /> {t("buddy.reviews")}
        </a>
      </div>

      <Section title={t("school.contacts")} id="contacts">
        <ul className="rows">
          {school.contacts.map((c) => {
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
          <Out className="button" href={school.homepage}>
            {t("school.homepage")}
          </Out>
          <Out className="button" href={school.international}>
            {t("school.international")}
          </Out>
        </div>
        <p className="source">
          <ExternalLink size={16} aria-hidden /> {t("school.source", { date: school.checked })}
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

      {school && (
        <Section title={t("buddy.title")} id="buddy-form">
          <Gate>{(member) => <BuddyRequests member={member} />}</Gate>
        </Section>
      )}
    </section>
  );
}
