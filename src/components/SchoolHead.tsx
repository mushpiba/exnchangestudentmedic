import { Pencil } from "lucide-react";
import { useI18n } from "../i18n";
import { href } from "../app/router";
import { useSchoolInfo } from "../state/prefs";

/** Top of the school tab: the school's name, a way to change it, and a switch between support and board. */
export function SchoolHead({ current }: { current: "support" | "board" }) {
  const { t } = useI18n();
  const school = useSchoolInfo();
  return (
    <header className="school-head">
      <div className="school-name">
        <h1>{school ? t(school.name) : t("school.none")}</h1>
        <a className="school-change" href={href("welcome", "school")}>
          <Pencil size={16} aria-hidden /> {t("school.change")}
        </a>
      </div>
      <nav className="seg" aria-label={t("nav.school")}>
        <a href={href("school")} aria-current={current === "support" ? "page" : undefined}>
          {t("school.support")}
        </a>
        <a href={href("community")} aria-current={current === "board" ? "page" : undefined}>
          {t("school.board")}
        </a>
      </nav>
    </header>
  );
}
