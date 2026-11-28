import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Check, ClipboardList, Globe, GraduationCap, House, MapPin, Phone, Pill, RefreshCw, X } from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";
import { LOCALES } from "../i18n/locales";
import { go, href, useRoute } from "./router";
import { Home } from "../pages/Home";
import { Intake } from "../pages/Intake";
import { CardView } from "../pages/CardView";
import { ShowMode } from "../pages/ShowMode";
import { Medicine, MedsMenu } from "../pages/Medicine";
import { FromHome } from "../pages/FromHome";
import { Places } from "../pages/Places";
import { Condition, Info } from "../pages/Info";
import { GuideColumn, GuideCompare } from "../pages/Guide";
import { Community } from "../pages/Community";
import { Campus } from "../pages/Campus";
import { Welcome } from "../pages/Welcome";
import { ClinicHome, ClinicReady, ClinicSheet } from "../pages/Clinic";
import { Sheet } from "../pages/Sheet";
import { NaruMark } from "../components/art";
import { useAudience, useSchool } from "../state/prefs";
import { useCard } from "../state/card";
import { applyUpdate, useUpdateReady } from "../lib/update";

const NAV: { to: string; key: MessageKey; Icon: typeof House }[] = [
  { to: "home", key: "nav.home", Icon: House },
  { to: "places", key: "nav.map", Icon: MapPin },
  { to: "meds", key: "tab.meds", Icon: Pill },
  { to: "card", key: "tab.card", Icon: ClipboardList },
  { to: "school", key: "nav.school", Icon: GraduationCap },
  { to: "info", key: "nav.guide", Icon: BookOpen },
];

function LanguageDialog({ onClose }: { onClose: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => ref.current?.showModal(), []);
  return (
    <dialog ref={ref} className="sheet" onClose={onClose} onCancel={onClose} aria-labelledby="lang-title">
      <div className="sheet-head">
        <h2 id="lang-title">{t("lang.title")}</h2>
        <button type="button" onClick={() => ref.current?.close()} aria-label={t("common.close")}>
          <X />
        </button>
      </div>
      <div className="langs">
        {LOCALES.map((l) => (
          <button
            key={l.code}
            type="button"
            lang={l.code}
            dir={l.rtl ? "rtl" : "ltr"}
            aria-pressed={l.code === locale}
            onClick={async () => {
              await setLocale(l.code);
              ref.current?.close();
            }}
          >
            {l.native}
            {l.code === locale && <Check size={16} aria-hidden />}
          </button>
        ))}
      </div>
      <p className="muted">{t("lang.note")}</p>
    </dialog>
  );
}

/** The screen one step up, and the name to put on the link back to it. A tab's own screen returns null:
 *  the tab bar is already its way out. So does the board, which carries its own back inside a post. */
function upFrom(route: string[]): { to: string[]; key: MessageKey } | null {
  const [head, ...rest] = route;
  if (!rest.length) return null;
  if (head === "meds") return { to: ["meds"], key: "med.title" };
  if (head === "card" && ["view", "info"].includes(rest[0])) return { to: ["card"], key: "tab.card" };
  // #/info/flags, #/info/first-visit and #/school/<section> are places on a tab's own screen.
  if (head === "info") return ["flags", "first-visit"].includes(rest[0]) ? null : { to: ["info"], key: "nav.guide" };
  return null;
}

function Page({ route }: { route: string[] }) {
  const [head, ...rest] = route;
  switch (head) {
    case "card":
      if (rest[0] === "view") return <CardView />;
      if (rest[0] === "show") return <ShowMode />;
      if (rest[0] === "info" && rest[1]) return <Condition id={rest[1]} />;
      return <Intake start={rest[0]} />;
    case "meds":
      if (rest[0] === "home") return <FromHome />;
      if (rest[0] === "korea") return <Medicine />;
      return <MedsMenu />;
    case "places":
      return <Places />;
    case "info":
      if (rest[0] === "guide" && rest[1]) return <GuideColumn id={rest[1]} />;
      if (rest[0] === "compare") return <GuideCompare />;
      return <Info id={rest[0]} />;
    case "community":
      return <Community route={rest} />;
    case "school":
    case "campus":
      return <Campus focus={rest[0]} />;
    default:
      return <Home />;
  }
}

/** The desk's own shell: Korean, no tab bar, and a way back to the patient app on the same phone. */
function ClinicShell({ route }: { route: string[] }) {
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    main.current?.focus({ preventScroll: true });
  }, [route.join("/")]);
  const page = route[1];
  return (
    <>
      <header className="topbar" lang="ko" dir="ltr">
        <a className="brand" href={href("clinic")} aria-label="NARU">
          <NaruMark />
          <span className="brand-word" aria-hidden>
            NARU
          </span>
          <span className="badge">병·의원</span>
        </a>
        <div className="top-actions">
          <a className="lang-button" href={href("welcome")}>
            환자용으로 바꾸기
          </a>
        </div>
      </header>
      <main ref={main} tabIndex={-1} lang="ko" dir="ltr">
        {page && (
          <a className="page-back" href={href("clinic")}>
            <ArrowLeft className="flip" size={18} aria-hidden /> 병·의원용 NARU
          </a>
        )}
        {page === "ready" ? <ClinicReady /> : page === "sheet" ? <ClinicSheet /> : <ClinicHome />}
        <footer className="foot">NARU는 진단하지 않으며 진료 건수에 연동된 대가를 받지 않습니다.</footer>
      </main>
    </>
  );
}

export function App() {
  const { t, locale } = useI18n();
  const route = useRoute();
  const [languageOpen, setLanguageOpen] = useState(false);
  const main = useRef<HTMLElement>(null);
  const tabbar = useRef<HTMLElement>(null);
  const showMode = route[0] === "card" && route[1] === "show";
  const school = useSchool();
  const audience = useAudience();
  const { lines } = useCard();
  const updateReady = useUpdateReady();
  // A new version applies by itself when nothing would be lost; mid-card it waits for the student's tap.
  const cardInProgress = lines.length > 0;
  useEffect(() => {
    if (updateReady && !cardInProgress) applyUpdate();
  }, [updateReady, cardInProgress]);

  useEffect(() => {
    window.scrollTo(0, 0);
    main.current?.focus({ preventScroll: true });
  }, [route.join("/")]);

  // Sticky step buttons sit right above the tab bar, whose height depends on the language.
  useEffect(() => {
    const bar = tabbar.current;
    if (!bar) return;
    // The bar lets each tab take the width its longest word needs. Two things can still go wrong in a long
    // language: the six labels overrun the bar, or one long label squeezes its neighbours under a thumb's
    // width. Either one steps the label size down once -- never a break inside a word, never below 12px.
    const fits = () => {
      if (bar.scrollWidth > bar.clientWidth + 1) return false;
      return [...bar.children].every((tab) => tab.getBoundingClientRect().width >= 47.5);
    };
    const sync = () => {
      for (const size of [14, 13, 12]) {
        bar.style.setProperty("--tab-fs", size + "px");
        if (fits()) break;
      }
      document.documentElement.style.setProperty("--tab-h", bar.offsetHeight + "px");
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [showMode, locale, school, route[0] === "welcome"]);

  // A desk's QR opens straight into the question sheet. Whoever scanned it may never have opened NARU
  // before, so it must not wait behind the welcome screen.
  if (route[0] === "q")
    return (
      <main ref={main} tabIndex={-1} className="welcome-main">
        <Sheet code={route[1]} own={route[2]} />
      </main>
    );

  // First run (nothing chosen yet) or #/welcome: the welcome screen, without the app shell.
  // The desk never picks a school, so only a patient is held back by that choice.
  if (audience === null || (audience !== "clinic" && school === null) || route[0] === "welcome")
    return (
      <main ref={main} tabIndex={-1} className="welcome-main">
        <Welcome
          start={route[1] === "school" ? 3 : 1}
          onDone={(who) => go(who === "clinic" ? "clinic" : route[1] === "school" ? "school" : "home")}
        />
      </main>
    );

  if (audience === "clinic") return <ClinicShell route={route} />;

  if (showMode)
    return (
      <main ref={main} tabIndex={-1} className="show-main">
        <ShowMode />
      </main>
    );

  // The board lives in the school tab; #/campus is the old address of the school page.
  const section = ["community", "campus"].includes(route[0]) ? "school" : route[0];
  const up = upFrom(route);
  return (
    <>
      <header className="topbar">
        <a className="brand" href={href("home")} aria-label="NARU">
          <NaruMark />
          <span className="brand-word" aria-hidden>
            NARU
          </span>
        </a>
        <div className="top-actions">
          <button type="button" className="lang-button" onClick={() => setLanguageOpen(true)}>
            <Globe size={18} aria-hidden />
            <span lang={locale}>{LOCALES.find((l) => l.code === locale)?.native}</span>
          </button>
          <a className="sos" href="tel:119" aria-label={"119 " + t("place.er")}>
            <Phone size={16} aria-hidden />
            119
          </a>
        </div>
      </header>
      {languageOpen && <LanguageDialog onClose={() => setLanguageOpen(false)} />}
      {updateReady && cardInProgress && (
        <div className="update-bar" role="status">
          <span>{t("app.updateReady")}</span>
          <button type="button" onClick={() => applyUpdate()}>
            <RefreshCw size={18} aria-hidden /> {t("app.updateNow")}
          </button>
        </div>
      )}
      <main ref={main} tabIndex={-1}>
        {up && (
          <a className="page-back" href={href(...up.to)}>
            <ArrowLeft className="flip" size={18} aria-hidden /> {t(up.key)}
          </a>
        )}
        <Page route={route} />
        <footer className="foot">{t("app.notice")}</footer>
      </main>
      <nav className="tabbar" aria-label="NARU" ref={tabbar}>
        {/* A resident has no campus, so the school tab and everything under it stays out of their way. */}
        {NAV.filter(({ to }) => to !== "school" || audience === "student").map(({ to, key, Icon }) => (
          <a key={to} href={href(to)} aria-current={section === to ? "page" : undefined}>
            <span className="tab-ic">
              <Icon size={22} strokeWidth={section === to ? 2.25 : 1.75} aria-hidden />
            </span>
            {/* A zero-width space after "·" lets "Clinic·Pharmacy" style labels wrap at the dot. */}
            <span className="tab-label">{t(key).replace(/·/g, "·​")}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
