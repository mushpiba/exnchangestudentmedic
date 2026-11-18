// Choices made on the welcome screen. Only these flags live in localStorage; nothing health-related.
import { useSyncExternalStore } from "react";

export type SchoolChoice = "inha" | "none";

const SCHOOL_KEY = "naru-school";
const listeners = new Set<() => void>();
let memory: SchoolChoice | null = null;

function read(): SchoolChoice | null {
  try {
    const v = localStorage.getItem(SCHOOL_KEY);
    return v === "inha" || v === "none" ? v : memory;
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
