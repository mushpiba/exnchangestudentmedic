// Choices made on the welcome screen. Only these flags live in localStorage; nothing health-related.
import { useSyncExternalStore } from "react";
import { SCHOOLS, schoolById, type SchoolInfo } from "../content/school";

/** A school id from SCHOOLS, or "none" for a student who has none in the list. */
export type SchoolChoice = string;

/** Who is holding the phone. A patient sees the student app; a desk sees the clinic screens. */
export type Audience = "student" | "resident" | "clinic";

const CHOICES = new Set<string>([...SCHOOLS.map((s) => s.id), "none"]);
const AUDIENCES = new Set<string>(["student", "resident", "clinic"]);

const SCHOOL_KEY = "naru-school";
const AUDIENCE_KEY = "naru-audience";
const listeners = new Set<() => void>();
let memory: SchoolChoice | null = null;
let audienceMemory: Audience | null = null;

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

function readAudience(): Audience | null {
  try {
    const v = localStorage.getItem(AUDIENCE_KEY);
    return v && AUDIENCES.has(v) ? (v as Audience) : audienceMemory;
  } catch {
    return audienceMemory;
  }
}

export function setAudience(choice: Audience) {
  audienceMemory = choice;
  try {
    localStorage.setItem(AUDIENCE_KEY, choice);
  } catch {
    /* private mode: remembered for this tab only */
  }
  listeners.forEach((l) => l());
}

/** null until the welcome screen's first question is answered. */
export function useAudience(): Audience | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    readAudience,
    () => null,
  );
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
