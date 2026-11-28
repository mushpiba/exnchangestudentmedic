// 학교를 고르지 않은 사람에게 기준점은 캠퍼스가 아니라 지금 서 있는 곳이다.
// 좌표는 어디에도 저장하지 않는다. 탭을 닫으면 사라지고, 다음에 다시 묻는다(이미 허락했다면 묻지 않고 가져온다).
import { useSyncExternalStore } from "react";

export type Spot = { lat: number; lng: number };
/** idle: 아직 묻지 않음 · asking: 묻는 중 · on: 받았음 · off: 거절했거나 받지 못했음 */
export type HereState = "idle" | "asking" | "on" | "off";

let spot: Spot | null = null;
let state: HereState = "idle";
// useSyncExternalStore는 같은 값이면 같은 객체가 돌아와야 한다. 그래서 바뀔 때만 새로 만든다.
let snap: { spot: Spot | null; state: HereState } = { spot, state };
const listeners = new Set<() => void>();

function changed() {
  snap = { spot, state };
  listeners.forEach((l) => l());
}

/** 환자가 버튼을 눌렀을 때. 브라우저가 권한을 묻는 창을 띄운다. */
export function askHere() {
  if (state === "asking") return;
  if (!navigator.geolocation) {
    state = "off";
    return changed();
  }
  state = "asking";
  changed();
  navigator.geolocation.getCurrentPosition(
    (p) => {
      spot = { lat: p.coords.latitude, lng: p.coords.longitude };
      state = "on";
      changed();
    },
    () => {
      state = "off";
      changed();
    },
    { timeout: 8000, maximumAge: 300000 },
  );
}

/** 이미 허락한 사람에게는 창을 띄우지 않고 바로 가져온다. 처음인 사람은 버튼을 누를 때까지 그대로 둔다. */
export async function askHereIfAllowed() {
  if (state !== "idle") return;
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
    if (status?.state === "granted") askHere();
  } catch {
    /* 권한을 미리 조회할 수 없는 브라우저: 버튼을 눌렀을 때만 묻는다 */
  }
}

const SERVER = { spot: null, state: "idle" as HereState };

export function useHere() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snap,
    () => SERVER,
  );
}
