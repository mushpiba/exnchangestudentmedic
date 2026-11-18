import { useEffect, useRef, useState } from "react";
import { Check, ClipboardList, Globe2, House, MapPin, MessagesSquare, Phone, Pill, X } from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";
import { LOCALES } from "../i18n/locales";
import { href, useRoute } from "./router";
import { Home } from "../pages/Home";
import { Intake } from "../pages/Intake";
import { CardView } from "../pages/CardView";
import { ShowMode } from "../pages/ShowMode";
import { Medicine } from "../pages/Medicine";
import { Places } from "../pages/Places";
import { Info } from "../pages/Info";
import { Community } from "../pages/Community";
import { Campus } from "../pages/Campus";

const NAV: { to: string; key: MessageKey; Icon: typeof House }[] = [
  { to: "home", key: "nav.home", Icon: House },
  { to: "card", key: "nav.card", Icon: ClipboardList },
  { to: "meds", key: "nav.meds", Icon: Pill },
  { to: "places", key: "nav.places", Icon: MapPin },
  { to: "community", key: "nav.community", Icon: MessagesSquare },
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

function Page({ route }: { route: string[] }) {
  const [head, ...rest] = route;
  switch (head) {
    case "card":
      if (rest[0] === "view") return <CardView />;
      if (rest[0] === "show") return <ShowMode />;
      return <Intake start={rest[0]} />;
    case "meds":
      return <Medicine />;
    case "places":
      return <Places />;
    case "info":
      return <Info id={rest[0]} />;
    case "community":
      return <Community route={rest} />;
    case "campus":
      return <Campus />;
    default:
      return <Home />;
  }
}

export function App() {
  const { t, locale } = useI18n();
  const route = useRoute();
  const [languageOpen, setLanguageOpen] = useState(false);
  const main = useRef<HTMLElement>(null);
  const tabbar = useRef<HTMLElement>(null);
  const showMode = route[0] === "card" && route[1] === "show";

  useEffect(() => {
    window.scrollTo(0, 0);
    main.current?.focus({ preventScroll: true });
  }, [route.join("/")]);

  // Sticky step buttons sit right above the tab bar, whose height depends on the language.
  useEffect(() => {
    const bar = tabbar.current;
    if (!bar) return;
    const sync = () => {
      bar.classList.remove("tight");
      if (bar.scrollWidth > bar.clientWidth + 1) bar.classList.add("tight");
      document.documentElement.style.setProperty("--tab-h", bar.offsetHeight + "px");
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [showMode, locale]);

  if (showMode)
    return (
      <main ref={main} tabIndex={-1} className="show-main">
        <ShowMode />
      </main>
    );

  const section = route[0] === "card" ? "card" : route[0];
  return (
    <>
      <header className="topbar">
        <a className="brand" href={href("home")} aria-label="NARU">
          <span className="logo" aria-hidden>
            N
          </span>
          <span className="brand-word" aria-hidden>
            NARU
          </span>
        </a>
        <div className="top-actions">
          <button type="button" className="lang-button" onClick={() => setLanguageOpen(true)}>
            <Globe2 size={18} aria-hidden />
            <span lang={locale}>{LOCALES.find((l) => l.code === locale)?.native}</span>
          </button>
          <a className="sos" href="tel:119" aria-label={"119 " + t("place.er")}>
            <Phone size={16} aria-hidden />
            119
          </a>
        </div>
      </header>
      {languageOpen && <LanguageDialog onClose={() => setLanguageOpen(false)} />}
      <main ref={main} tabIndex={-1}>
        <Page route={route} />
        <footer className="foot">{t("app.notice")}</footer>
      </main>
      <nav className="tabbar" aria-label="NARU" ref={tabbar}>
        {NAV.map(({ to, key, Icon }) => (
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
