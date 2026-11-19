// Open a place, or a search, in the Naver Map app; without the app, go to its store page (phones) or
// Naver Map on the web. URL scheme: nmap://place?lat=…&lng=…&name=…&appname=… and
// nmap://search?query=…&appname=…  (Naver Map URL scheme guide).
// The scheme's search takes no coordinates, so "near campus" can only be said in the query text there.
// The web map does take a camera, so on the web the same search is also framed on the campus: `c=` is
// lng,lat,zoom — and what the camera is looking at is what Naver's place search ranks first.
const PLAY_PACKAGE = "com.nhn.android.nmap";
const APP_STORE = "https://apps.apple.com/kr/app/id311867728";

export type MapPlace = { name: string; lat: number; lng: number };
type Point = { lat: number; lng: number };

export function naverWebUrl(p: MapPlace) {
  return `https://map.naver.com/p/search/${encodeURIComponent(p.name)}?c=${p.lng},${p.lat},17,0,0,0,dh`;
}

export function naverSearchUrl(query: string, at: Point, zoom = 15) {
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}?c=${at.lng},${at.lat},${zoom},0,0,0,dh`;
}

/** The app if it is there, its store page if it is not, the web map on a desktop. */
function open(path: string, params: Record<string, string>, web: string) {
  const query = new URLSearchParams({ ...params, appname: location.origin }).toString();
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) {
    // Chrome opens the Play Store page for the package when the app is not installed.
    location.href = `intent://${path}?${query}#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=${PLAY_PACKAGE};end`;
    return;
  }
  if (/iPhone|iPad|iPod/i.test(ua)) {
    // If the app opens, the page goes to the background and the store fallback is cancelled.
    const fallback = setTimeout(() => {
      if (!document.hidden) location.href = APP_STORE;
    }, 1600);
    document.addEventListener("visibilitychange", () => clearTimeout(fallback), { once: true });
    location.href = `nmap://${path}?${query}`;
    return;
  }
  window.open(web, "_blank", "noopener");
}

export function openInNaverMap(p: MapPlace) {
  open("place", { lat: String(p.lat), lng: String(p.lng), name: p.name }, naverWebUrl(p));
}

/** `query` carries the place name for the app, which has no way to be told where to look. */
export function openNaverSearch(query: string, at: Point) {
  open("search", { query }, naverSearchUrl(query, at));
}
