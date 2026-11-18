import { useI18n } from "../i18n";
import { href } from "../app/router";
import { SCHOOL } from "../content/school";
import { useSchool } from "../state/prefs";

/** Top of the school tab: the school's name and a switch between school support and the school board. */
export function SchoolHead({ current }: { current: "support" | "board" }) {
  const { t } = useI18n();
  const school = useSchool();
  return (
    <header className="school-head">
      <h1>{school === "inha" ? t(SCHOOL.name) : t("school.none")}</h1>
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
