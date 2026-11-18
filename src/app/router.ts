import { useEffect, useState } from "react";

// Hash routes keep GitHub Pages and the offline service worker simple: #/card/show, #/community/post/<id>
export function parse(hash: string): string[] {
  const path = hash.replace(/^#\/?/, "").split("?")[0];
  return path ? path.split("/").map(decodeURIComponent) : ["home"];
}

export function go(...parts: string[]) {
  location.hash = "/" + parts.map(encodeURIComponent).join("/");
}

export function href(...parts: string[]) {
  return "#/" + parts.map(encodeURIComponent).join("/");
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const update = () => setRoute(parse(location.hash));
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route;
}
