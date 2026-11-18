import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  ClipboardList,
  Globe2,
  GraduationCap,
  Hospital,
  House,
  Languages,
  MapPin,
  MessageSquare,
  Phone,
  Pill,
  Plus,
  Stethoscope,
  UsersRound,
  X,
} from "lucide-react";
import { initialLocale, labels, languages, type Locale } from "./i18n";
import { SearchSymptoms, symptomMatch, Dictate } from "./InputTools";
import { Directory, ProductLookup } from "./Reference";
import { visit } from "./data/visit";
import "./style.css";

const Campus = React.lazy(() => import("./Campus"));
const onlineCampus = !!(
  import.meta.env.VITE_CAMPUS_URL && import.meta.env.VITE_CAMPUS_PUBLIC_KEY
);
const pages = [
  "home",
  "intake",
  "card",
  "places",
  "meds",
  "guide",
  "buddy",
  "forum",
] as const;
type Page = (typeof pages)[number];
const pageFromUrl = (): Page =>
  pages.find((p) => p === location.hash.slice(1)) ?? "home";
const symptoms = ["Sx_headache", "Sx_abdominalPain", "ESx_cough", "ESx_vomit"];
const blank = () => ({
  symptoms: [] as string[],
  onset: "",
  allergy: "",
  medTaking: "",
  notes: "",
});
const ko = labels("ko-KR");
const tools = [
  { page: "places", Icon: MapPin },
  { page: "meds", Icon: Pill },
  { page: "guide", Icon: BookOpen },
  { page: "buddy", Icon: UsersRound },
  { page: "forum", Icon: MessageSquare },
] as const;
const facilityExamples = [
  { type: "hospital", desk: "uz", consult: "ko-KR", schedule: "09:00–12:00" },
  {
    type: "pharmacy",
    desk: "ru-RU",
    consult: "ru-RU",
    schedule: "14:00–17:00",
  },
  { type: "hospital", desk: "kk", consult: "ko-KR", schedule: "13:00–16:00" },
] as const;
type Texts = Record<string, string>;

function Medicine({ t, locale }: { t: Texts; locale: Locale }) {
  const [name, setName] = useState(""),
    [file, setFile] = useState<File>(),
    [url, setUrl] = useState(""),
    [progress, setProgress] = useState<number | null>(null),
    [error, setError] = useState(false),
    [show, setShow] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    if (!file) {
      setUrl("");
      return;
    }
    const local = URL.createObjectURL(file);
    setUrl(local);
    return () => {
      generation.current++;
      URL.revokeObjectURL(local);
    };
  }, [file]);
  async function read() {
    if (!file) return;
    const version = generation.current;
    setProgress(0);
    setError(false);
    let worker:
      | Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>>
      | undefined;
    try {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker(["eng", "rus", "kor"], 1, {
        logger: (m) => {
          if (version === generation.current && m.status === "recognizing text")
            setProgress(Math.round(m.progress * 100));
        },
      });
      const result = await worker.recognize(file);
      if (version === generation.current) {
        const text = result.data.text.trim();
        setName(text);
        setError(!text);
      }
    } catch {
      if (version === generation.current) setError(true);
    } finally {
      if (worker) await worker.terminate();
      if (version === generation.current) setProgress(null);
    }
  }
  return (
    <section className="panel">
      <h2>{t.meds}</h2>
      {show ? (
        <>
          <div className="handoff">
            <Pill />
            <h2 lang="ko">{ko.askPharm}</h2>
            <p>{t.askPharm}</p>
            <strong dir="auto">{name}</strong>
            {url && <img className="package" src={url} alt={t.photo} />}
          </div>
          <button onClick={() => setShow(false)}>{t.edit}</button>
        </>
      ) : (
        <>
          <label>
            {t.photo}
            <input
              type="file"
              accept="image/*"
              disabled={progress !== null}
              onChange={(e) => {
                setFile(e.target.files?.[0]);
                setError(false);
              }}
            />
          </label>
          {url && (
            <>
              <img className="package" src={url} alt={t.photo} />
              <button disabled={progress !== null} onClick={read}>
                {t.ocr} {progress !== null && progress + "%"}
              </button>
            </>
          )}
          {error && (
            <p role="status">
              {t.ocr} ✕ · {t.notes} ↓
            </p>
          )}
          <label>
            {t.medName}
            <textarea
              dir="auto"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            className="primary"
            disabled={(!name.trim() && !file) || progress !== null}
            onClick={() => setShow(true)}
          >
            {t.meds}
            <ArrowRight />
          </button>
        </>
      )}
      <ProductLookup locale={locale} />
      <a
        className="out"
        href="https://nedrug.mfds.go.kr/"
        target="_blank"
        rel="noreferrer"
      >
        식약처 의약품안전나라 ↗
      </a>
    </section>
  );
}

function Places({ t, locale }: { t: Texts; locale: Locale }) {
  const [type, setType] = useState("all"),
    [lang, setLang] = useState("all");
  const found = facilityExamples.filter(
    (f) =>
      (type === "all" || type === f.type) &&
      (lang === "all" || lang === f.desk || lang === f.consult),
  );
  const search = encodeURIComponent(
    "인하대학교 " +
      (type === "pharmacy"
        ? "약국"
        : type === "hospital"
          ? "의원"
          : "병원 약국"),
  );
  return (
    <section className="panel">
      <h2>{t.places}</h2>
      <a
        className="primary"
        target="_blank"
        rel="noreferrer"
        href={"https://map.naver.com/p/search/" + search}
      >
        <MapPin />
        {t.map} ↗
      </a>
      <Directory locale={locale} />
      <p className="muted">{t.sample}</p>
      <div className="chips">
        {["all", "hospital", "pharmacy"].map((x) => (
          <button key={x} aria-pressed={type === x} onClick={() => setType(x)}>
            {t[x]}
          </button>
        ))}
      </div>
      <label>
        {t.language}
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="all">{t.all}</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {labels(l).native}
            </option>
          ))}
        </select>
      </label>
      {found.map((f) => (
        <article className="result" key={f.schedule}>
          <Hospital />
          <div>
            <strong>
              {t[f.type]} · {t.sample}
            </strong>
            <p>
              {t.desk} · {labels(f.desk).native}
              <br />
              {t.consult} · {labels(f.consult).native}
              <br />
              {t.hours} · <bdi>{f.schedule}</bdi>
            </p>
          </div>
        </article>
      ))}
      {!found.length && (
        <p>
          {t.places} · 0{" "}
          <button
            onClick={() => {
              setLang("all");
              setType("all");
            }}
          >
            {t.all}
          </button>
        </p>
      )}
    </section>
  );
}

function App() {
  const [page, setPage] = useState<Page>(pageFromUrl),
    [locale, setLocale] = useState<Locale>(initialLocale),
    [languageOpen, setLanguageOpen] = useState(false);
  const [form, setForm] = useState(blank),
    [step, setStep] = useState(0),
    [staff, setStaff] = useState(false),
    [checks, setChecks] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [slot, setSlot] = useState(""),
    [buddy, setBuddy] = useState(""),
    [draft, setDraft] = useState(""),
    [posts, setPosts] = useState<string[]>([]);
  const langDialog = useRef<HTMLDialogElement>(null),
    main = useRef<HTMLElement>(null);
  const t = labels(locale),
    rtl = ["ur-PK", "ar-SA"].includes(locale);
  useEffect(() => {
    const update = () => {
      setPage(pageFromUrl());
      setStaff(false);
      window.scrollTo(0, 0);
      main.current?.focus({ preventScroll: true });
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    try {
      localStorage.setItem("inha-language", locale);
    } catch {}
  }, [locale, rtl]);
  useEffect(() => {
    if (languageOpen) langDialog.current?.showModal();
    else langDialog.current?.close();
  }, [languageOpen]);
  function go(next: Page) {
    location.hash = next;
  }
  const hasInput =
    form.symptoms.length > 0 ||
    !!(form.onset || form.allergy || form.medTaking || form.notes.trim());
  function choose(
    field: "symptoms" | "onset" | "allergy" | "medTaking",
    value: string,
  ) {
    setForm((prev) =>
      field === "symptoms"
        ? {
            ...prev,
            symptoms: prev.symptoms.includes(value)
              ? prev.symptoms.filter((x) => x !== value)
              : [...prev.symptoms, value],
          }
        : { ...prev, [field]: prev[field] === value ? "" : value },
    );
  }
  const steps = ["symptom", "when", "allergy", "medTaking", "notes"];
  const selections = [
    form.symptoms,
    [form.onset],
    [form.allergy],
    [form.medTaking],
    [],
  ];
  const options = [
    symptoms,
    ["today", "yesterday", "earlier", "unknown"],
    ["none", "yes", "unknown"],
    ["none", "yes", "unknown"],
    [],
  ];
  const fields = ["symptoms", "onset", "allergy", "medTaking"] as const;
  const listed = [
    ...form.symptoms.map((v) => ["symptom", v]),
    ...[
      ["when", form.onset],
      ["allergy", form.allergy],
      ["medTaking", form.medTaking],
    ].filter((x) => x[1]),
  ];
  const title =
    page === "home"
      ? t.home
      : page === "intake" || page === "card"
        ? t.start
        : t[page];
  return (
    <>
      <header>
        <div className="bar">
          <a className="brand" href="#home">
            <span className="logo">
              <Plus strokeWidth={3.5} />
            </span>
            Inha Care
          </a>
          <div className="controls">
            <button onClick={() => setLanguageOpen(true)}>
              <Globe2 size={17} />
              {t.native}
            </button>
            <a className="sos" href="tel:119" aria-label={t.emergency + " 119"}>
              <Phone size={16} />
              119
            </a>
          </div>
        </div>
      </header>
      <dialog
        ref={langDialog}
        onCancel={() => setLanguageOpen(false)}
        onClose={() => setLanguageOpen(false)}
      >
        <div className="dialoghead">
          <h2>{t.language}</h2>
          <button aria-label={t.back} onClick={() => setLanguageOpen(false)}>
            <X />
          </button>
        </div>
        <div className="langs">
          {languages.map((l) => (
            <button
              key={l}
              lang={l}
              aria-pressed={l === locale}
              onClick={() => {
                setLocale(l);
                setQuery("");
                setLanguageOpen(false);
              }}
            >
              {labels(l).native}
              {l === locale && <Check size={16} />}
            </button>
          ))}
        </div>
      </dialog>
      <main ref={main} tabIndex={-1}>
        <div className="crumb">
          {page === "home" ? (
            <>
              <GraduationCap size={18} /> Inha University
            </>
          ) : (
            <button onClick={() => go("home")}>
              <ArrowLeft size={16} />
              {t.home}
            </button>
          )}
          <span>/</span>
          {page === "home" ? t.home : title}
        </div>
        {page === "home" && (
          <>
            <section className="hero">
              <div>
                <div className="hero-icon">
                  <Stethoscope />
                </div>
                <h1>{t.title}</h1>
                <p>{t.intro}</p>
                <button className="hero-cta" onClick={() => go("intake")}>
                  {t.start}
                  <ArrowRight size={19} />
                </button>
              </div>
              <div className="cardart" aria-hidden="true">
                <div className="ticket behind"></div>
                <div className="ticket">
                  <div className="ticketTop">
                    <ClipboardList /> Inha Care <span>KR</span>
                  </div>
                  <div className="ticketBody">
                    <Languages size={29} />
                    <b>증상 카드</b>
                    <i />
                    <i />
                  </div>
                  <div className="ticketFoot">
                    <Activity /> <span>인하대학교</span>
                  </div>
                </div>
              </div>
            </section>
            <h2 className="sectionTitle">{t.more}</h2>
            <div className="toolgrid">
              {tools.map(({ page: p, Icon }) => (
                <a href={"#" + p} key={p}>
                  <span className={"toolIcon " + p}>
                    <Icon />
                  </span>
                  <strong>{t[p]}</strong>
                  <ChevronRight size={18} />
                </a>
              ))}
            </div>
          </>
        )}
        {page === "intake" && (
          <section className="panel">
            <div className="stephead">
              <ClipboardList />
              <span>
                {step + 1} / {steps.length}
              </span>
            </div>
            <progress max={steps.length} value={step + 1} />
            <h1>{t[steps[step]]}</h1>
            {step === 0 && (
              <SearchSymptoms
                locale={locale}
                value={query}
                onChange={setQuery}
              />
            )}
            {step < 4 ? (
              <div className="choices">
                {options[step]
                  .filter(
                    (o) => step !== 0 || symptomMatch(t[o], query, locale),
                  )
                  .map((o) => (
                    <button
                      aria-pressed={selections[step].includes(o)}
                      key={o}
                      onClick={() => choose(fields[step], o)}
                    >
                      {t[o]}
                      {selections[step].includes(o) && <Check size={18} />}
                    </button>
                  ))}
              </div>
            ) : (
              <label>
                {t.notes}
                <textarea
                  value={form.notes}
                  dir="auto"
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </label>
            )}
            {step === 0 &&
              query &&
              !symptoms.some((k) => symptomMatch(t[k], query, locale)) && (
                <button
                  onClick={() => {
                    setForm((p) => ({
                      ...p,
                      notes: [p.notes, query].filter(Boolean).join(" "),
                    }));
                    setQuery("");
                    setStep(4);
                  }}
                >
                  {t.notes} · {query}
                </button>
              )}
            {step === 4 && (
              <Dictate
                key={locale}
                locale={locale}
                t={t}
                append={(text) =>
                  setForm((p) => ({
                    ...p,
                    notes: [p.notes, text].filter(Boolean).join(" "),
                  }))
                }
              />
            )}
            <div className="actions">
              <button onClick={() => (step ? setStep(step - 1) : go("home"))}>
                {t.back}
              </button>
              <button
                className="primary"
                disabled={step === 4 && !hasInput}
                onClick={() => (step === 4 ? go("card") : setStep(step + 1))}
              >
                {step === 4 ? t.show : t.next}
                <ArrowRight size={17} />
              </button>
            </div>
          </section>
        )}
        {page === "card" && !hasInput && (
          <section className="panel">
            <h1>{t.start}</h1>
            <button
              className="primary"
              onClick={() => {
                setStep(0);
                go("intake");
              }}
            >
              {t.start}
              <ArrowRight />
            </button>
          </section>
        )}
        {page === "card" && hasInput && (
          <section className="panel">
            <div className="handoff">
              <Languages />
              <h1 lang="ko">진료 접수 카드</h1>
              <p>{t.notice}</p>
              {listed.map(([k, v]) => (
                <div className="line" key={k + v}>
                  <small lang="ko">{ko[k]}</small>
                  <strong lang="ko">{ko[v]}</strong>
                  <span>
                    {t[k]} · {t[v]}
                  </span>
                </div>
              ))}
              {form.notes && (
                <div className="line">
                  <small>{t.notes}</small>
                  <strong dir="auto">{form.notes}</strong>
                  <span>{t.original}</span>
                </div>
              )}
            </div>
            {hasInput && (
              <button onClick={() => setStaff(!staff)}>{t.staff}</button>
            )}
            {staff && (
              <div className="line">
                <strong lang="ko">언제부터인가요?</strong>
                {t.when}
              </div>
            )}
            <div className="actions">
              <button
                onClick={() => {
                  setStep(0);
                  go("intake");
                }}
              >
                {t.edit}
              </button>
              <button
                onClick={() => {
                  setForm(blank());
                  setStep(0);
                  go("home");
                }}
              >
                {t.clear}
              </button>
              <button className="primary" onClick={() => go("places")}>
                {t.places}
              </button>
            </div>
          </section>
        )}
        {page === "places" && <Places t={t} locale={locale} />}
        {page === "meds" && <Medicine t={t} locale={locale} />}
        {page === "guide" && (
          <section className="panel">
            <BookOpen />
            <h1>{t.guide}</h1>
            {["prepare", "reception", "pay", "receipt"].map((k, i) => (
              <label className="guideRow" key={k}>
                <input
                  type="checkbox"
                  checked={checks.includes(i)}
                  onChange={() =>
                    setChecks(
                      checks.includes(i)
                        ? checks.filter((n) => n !== i)
                        : [...checks, i],
                    )
                  }
                />
                <span>
                  <strong>{t[k]}</strong>
                  {visit[locale][i]}
                </span>
              </label>
            ))}
            <a
              className="out"
              href="https://internationalcenter.inha.ac.kr/"
              target="_blank"
              rel="noreferrer"
            >
              {t.insurance} · Inha ↗
            </a>
          </section>
        )}
        {onlineCampus && (page === "buddy" || page === "forum") && (
          <React.Suspense fallback={<progress />}>
            <Campus page={page} t={t} locale={locale} />
          </React.Suspense>
        )}
        {page === "buddy" && !onlineCampus && (
          <section className="panel">
            <UsersRound />
            <h1>{t.buddy}</h1>
            <p>{t.preview}</p>
            {buddy ? (
              <div className="result">
                <Check />
                <strong>{buddy.replace("T", " ")}</strong>
                <button onClick={() => setBuddy("")}>{t.cancel}</button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setBuddy(slot);
                }}
              >
                <label>
                  {t.time}
                  <input
                    required
                    type="datetime-local"
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                  />
                </label>
                <button className="primary">{t.save}</button>
              </form>
            )}
          </section>
        )}
        {page === "forum" && !onlineCampus && (
          <section className="panel">
            <MessageSquare />
            <h1>{t.forum}</h1>
            <p>{t.preview}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) {
                  setPosts([draft.trim(), ...posts]);
                  setDraft("");
                }
              }}
            >
              <label>
                {t.post}
                <textarea
                  maxLength={1500}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              </label>
              <button className="primary" disabled={!draft.trim()}>
                {t.post}
              </button>
            </form>
            {posts.map((p, i) => (
              <article className="result" key={i}>
                <span dir="auto">{p}</span>
                <button
                  onClick={() => setPosts(posts.filter((_, j) => j !== i))}
                >
                  {t.clear}
                </button>
              </article>
            ))}
          </section>
        )}
        <footer>
          <span className="dot" />
          {t.notice}
        </footer>
      </main>
      <nav>
        {[
          { p: "home", I: House, k: "home" },
          { p: "places", I: MapPin, k: "places" },
          { p: "guide", I: GraduationCap, k: "guide" },
        ].map(({ p, I, k }) => (
          <a
            key={p}
            aria-current={p === page ? "page" : undefined}
            href={"#" + p}
          >
            <I size={19} />
            {t[k]}
          </a>
        ))}
      </nav>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
