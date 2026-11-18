// Open a place in the Naver Map app; without the app, go to its store page (phones) or Naver Map on the web.
// URL scheme: nmap://place?lat=…&lng=…&name=…&appname=…  (Naver Map URL scheme guide)
const PLAY_PACKAGE = "com.nhn.android.nmap";
const APP_STORE = "https://apps.apple.com/kr/app/id311867728";

export type MapPlace = { name: string; lat: number; lng: number };

export function naverWebUrl(p: MapPlace) {
  return `https://map.naver.com/p/search/${encodeURIComponent(p.name)}?c=${p.lng},${p.lat},17,0,0,0,dh`;
}

export function openInNaverMap(p: MapPlace) {
  const query = new URLSearchParams({ lat: String(p.lat), lng: String(p.lng), name: p.name, appname: location.origin }).toString();
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) {
    // Chrome opens the Play Store page for the package when the app is not installed.
    location.href = `intent://place?${query}#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=${PLAY_PACKAGE};end`;
    return;
  }
  if (/iPhone|iPad|iPod/i.test(ua)) {
    // If the app opens, the page goes to the background and the store fallback is cancelled.
    const fallback = setTimeout(() => {
      if (!document.hidden) location.href = APP_STORE;
    }, 1600);
    document.addEventListener("visibilitychange", () => clearTimeout(fallback), { once: true });
    location.href = `nmap://place?${query}`;
    return;
  }
  window.open(naverWebUrl(p), "_blank", "noopener");
}
