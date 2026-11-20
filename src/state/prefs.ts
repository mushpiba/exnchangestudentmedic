// Choices made on the welcome screen. Only these flags live in localStorage; nothing health-related.
import { useSyncExternalStore } from "react";
import { SCHOOLS, schoolById, type SchoolInfo } from "../content/school";

/** A school id from SCHOOLS, or "none" for a student who has none in the list. */
export type SchoolChoice = string;

const CHOICES = new Set<string>([...SCHOOLS.map((s) => s.id), "none"]);

const SCHOOL_KEY = "naru-school";
const listeners = new Set<() => void>();
let memory: SchoolChoice | null = null;

function read(): SchoolChoice | null {
  try {
    const v = localStorage.getItem(SCHOOL_KEY);
    return v && CHOICES.has(v) ? v : memory;
  } catch {
    return memory;
  }
}

/** Saving a school also marks the welcome screen as done. */
export function setSchool(choice: SchoolChoice) {
  memory = choice;
  try {
    localStorage.setItem(SCHOOL_KEY, choice);
  } catch {
    /* private mode: remembered for this tab only */
  }
  listeners.forEach((l) => l());
}

/** The chosen school's own data, or null when the student has no school in the list. */
export function useSchoolInfo(): SchoolInfo | null {
  return schoolById(useSchool());
}

/** null until the student finishes the welcome screen. */
export function useSchool(): SchoolChoice | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => null,
  );
}
