import type { ReactNode } from "react";
import { Camera, ExternalLink, ImageUp, Phone } from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";

/** Printed tick box. Fills with marker yellow when its button is pressed (or `on`). */
export function Tick({ on, className = "" }: { on?: boolean; className?: string }) {
  return (
    <svg className={"tick" + (on ? " on" : "") + (className ? " " + className : "")} viewBox="0 0 24 24" aria-hidden focusable="false">
      <rect x="2" y="2" width="20" height="20" rx="3" />
      <path className="tick-mark" d="M6.5 12.4l3.7 3.7 7.4-7.6" pathLength={1} />
    </svg>
  );
}

/** A choice: tick box, and a highlighter swipe behind the label once chosen. */
export function Chip({
  on,
  onClick,
  children,
  lang,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  lang?: string;
}) {
  return (
    <button type="button" className="chip" aria-pressed={on} onClick={onClick} lang={lang}>
      <Tick />
      <span className="chip-label">
        <span className="hl">{children}</span>
      </span>
    </button>
  );
}

export function PageHead({ title, intro, icon }: { title: string; intro?: string; icon?: ReactNode }) {
  return (
    <header className="pagehead">
      {icon && <span className="pagehead-icon">{icon}</span>}
      <h1>{title}</h1>
      {intro && <p>{intro}</p>}
    </header>
  );
}

/** Korean for the person behind the counter, the student's language right below it. */
export function Bilingual({ k, params, big }: { k: MessageKey; params?: Record<string, string | number>; big?: boolean }) {
  const { t, tk, locale } = useI18n();
  const ko = tk(k, params);
  const mine = t(k, params);
  return (
    <span className={big ? "bilingual big" : "bilingual"}>
      <strong lang="ko">{ko}</strong>
      {locale !== "ko-KR" && mine !== ko && (
        <span dir="auto" lang={locale}>
          {mine}
        </span>
      )}
    </span>
  );
}

export function Out({ href, children, className = "out" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
      <ExternalLink size={15} aria-hidden />
    </a>
  );
}

export function CallButton({ number, label, tone }: { number: string; label: string; tone?: "danger" }) {
  return (
    <a className={"call " + (tone ?? "")} href={"tel:" + number}>
      <Phone size={18} aria-hidden />
      <span>{label}</span>
    </a>
  );
}

export function Section({ title, children, id }: { title?: string; children: ReactNode; id?: string }) {
  return (
    <section className="section" id={id}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="notice" role="note">
      {children}
    </p>
  );
}

/** Take a photo or pick one. Both medicine screens start here; what is done with the photo differs. */
export function PhotoRow({ onPick, busy }: { onPick: (file: File) => void; busy?: boolean }) {
  const { t } = useI18n();
  const one = (capture: boolean) => (
    <label className={"upload" + (capture ? " primary" : "")} key={String(capture)}>
      {capture ? <Camera size={22} aria-hidden /> : <ImageUp size={22} aria-hidden />}
      <span>{t(capture ? "med.camera" : "med.album")}</span>
      <input
        type="file"
        accept="image/*"
        {...(capture ? { capture: "environment" as const } : {})}
        disabled={busy}
        onChange={(e) => {
          const picked = e.target.files?.[0];
          e.target.value = "";
          if (picked) onPick(picked);
        }}
      />
    </label>
  );
  return <div className="upload-row">{[one(true), one(false)]}</div>;
}
