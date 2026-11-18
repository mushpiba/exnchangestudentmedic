// New versions of the app. The service worker keeps the app usable offline, so a deploy only reaches a phone
// once the new worker takes over. We check for one on start, every 30 minutes and when the app comes back to
// the screen; App applies it right away when no card is in progress, otherwise it offers a button
// (reloading mid-card would lose the card, which lives only in memory).
import { useSyncExternalStore } from "react";
import { registerSW } from "virtual:pwa-register";

let ready = false;
const listeners = new Set<() => void>();
let apply: (reload?: boolean) => Promise<void> = async () => {};

export function startUpdates() {
  if (!("serviceWorker" in navigator)) return;
  apply = registerSW({
    immediate: true,
    onNeedRefresh() {
      ready = true;
      listeners.forEach((l) => l());
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => registration.update().catch(() => {});
      setInterval(check, 30 * 60 * 1000);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
    },
  });
}

/** True once a new version is downloaded and waiting. */
export function useUpdateReady() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => ready,
    () => false,
  );
}

/** Switch to the new version and reload the page. */
export function applyUpdate() {
  return apply(true);
}
