// In-app map of clinics, hospitals and pharmacies near campus.
// TEMPORARY: free OpenStreetMap tiles and OSM place data (src/content/osm-places.json, `npm run fetch:places`)
// until the public-data lists (data.go.kr) are added. Tapping a place opens it in Naver Map.
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, Phone } from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";
import data from "../content/osm-places.json";
import { SCHOOL } from "../content/school";
import { useSchool } from "../state/prefs";
import { openInNaverMap } from "../lib/naver";

type Kind = "hospital" | "clinic" | "pharmacy" | "dentist" | "kmed" | "public" | "school";
type Place = { id: string; name: string; nameEn?: string; kind: Kind; lat: number; lng: number; emergency?: boolean; phone?: string; hours?: string };
type Filter = "all" | "er" | Kind;

const FILTERS: Filter[] = ["all", "hospital", "clinic", "pharmacy", "dentist", "kmed", "public", "er", "school"];
const filterKey = (f: Filter) => ("places.kind." + f) as MessageKey;

/** Fill colours by kind; red only for emergency rooms. */
const COLOR: Record<Kind | "er", string> = {
  hospital: "#161b1a",
  clinic: "#5b6461",
  dentist: "#8b9491",
  kmed: "#7a6411",
  public: "#0a5247",
  pharmacy: "#0f6b5c",
  school: "#ffffff",
  er: "#b42318",
};

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** `preview`: the home screen's map. It stays still so a swipe scrolls the page, and shows dots only (no filters or list). */
export default function PlaceMap({ preview = false }: { preview?: boolean }) {
  const { t } = useI18n();
  const school = useSchool();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const framed = useRef(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Place | null>(null);

  const places = useMemo<Place[]>(() => {
    const own = data.places as Place[];
    const campus: Place[] =
      school === "inha"
        ? [{ id: "school", name: t(SCHOOL.name), nameEn: t("school.health"), kind: "school", ...SCHOOL.location, phone: SCHOOL.contacts[0].phone }]
        : [];
    return [...campus, ...own];
  }, [school, t]);

  const shown = useMemo(() => {
    const list = places.filter((p) => (filter === "all" ? true : filter === "er" ? p.emergency : p.kind === filter));
    return list.map((p) => ({ ...p, distance: km(SCHOOL.location, p) })).sort((a, b) => a.distance - b.distance);
  }, [places, filter]);

  // Create the map once.
  useEffect(() => {
    if (!box.current || map.current) return;
    const still = { dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false };
    const m = L.map(box.current, { zoomControl: !preview, attributionControl: true, ...(preview ? still : {}) }).setView(
      [SCHOOL.location.lat, SCHOOL.location.lng],
      15,
    );
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    framed.current = false;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Draw the markers for the current filter.
  useEffect(() => {
    const group = layer.current;
    if (!group) return;
    group.clearLayers();
    for (const p of shown) {
      const er = !!p.emergency;
      L.circleMarker([p.lat, p.lng], {
        radius: p.kind === "school" ? 10 : 8,
        color: p.kind === "school" ? "#0f6b5c" : "#ffffff",
        weight: p.kind === "school" ? 4 : 2,
        fillColor: er ? COLOR.er : COLOR[p.kind],
        fillOpacity: 1,
      })
        .on("click", () => setSelected(p))
        .addTo(group);
    }
    // First draw: frame the nearest places instead of the campus alone, so the dots are on screen.
    if (!framed.current && shown.length > 1) {
      framed.current = true;
      map.current?.fitBounds(L.latLngBounds(shown.slice(0, 12).map((p) => [p.lat, p.lng])), { padding: [24, 24], maxZoom: 16 });
    }
  }, [shown]);

  const select = (p: Place) => {
    setSelected(p);
    map.current?.setView([p.lat, p.lng], 17);
    box.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  return (
    <div className="place-map-wrap">
      {!preview && (
        <div className="map-cats" role="group" aria-label={t("places.mapTitle")}>
          {FILTERS.filter((f) => f !== "school" || school === "inha").map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              <span className="dot" style={{ background: f === "all" ? "transparent" : f === "er" ? COLOR.er : COLOR[f] }} aria-hidden />
              {t(filterKey(f))}
            </button>
          ))}
        </div>
      )}
      <div className={preview ? "place-map preview" : "place-map"} ref={box} role="application" aria-label={t("places.mapTitle")} />

      {selected && (
        <article className="place-card" aria-live="polite">
          <div className="place-card-head">
            <strong lang="ko">{selected.name}</strong>
            {selected.nameEn && <span>{selected.nameEn}</span>}
            <span className="place-kind">
              {selected.emergency ? t("places.kind.er") + " · " : ""}
              {t(filterKey(selected.kind))} · {t("places.fromSchool", { km: km(SCHOOL.location, selected).toFixed(1) })}
            </span>
          </div>
          <div className="row">
            <button type="button" className="primary" onClick={() => openInNaverMap(selected)}>
              <Navigation size={18} aria-hidden /> {t("places.openNaver")}
            </button>
            {selected.phone && (
              <a className="button" href={"tel:" + selected.phone.replace(/[^\d+]/g, "")}>
                <Phone size={18} aria-hidden /> {t("places.call")}
              </a>
            )}
          </div>
          <p className="muted">{t("places.naverNote")}</p>
        </article>
      )}

      {!preview && <ul className="rows place-list">
        {shown.slice(0, 15).map((p) => (
          <li key={p.id}>
            <button type="button" className="item" onClick={() => select(p)} aria-pressed={selected?.id === p.id}>
              <span className="dot big" style={{ background: p.emergency ? COLOR.er : COLOR[p.kind] }} aria-hidden />
              <span className="item-text">
                <span className="item-title" lang="ko">
                  {p.name}
                </span>
                <span className="item-sub">
                  {p.emergency ? t("places.kind.er") + " · " : ""}
                  {t(filterKey(p.kind))} · {t("places.fromSchool", { km: p.distance.toFixed(1) })}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>}
      {!preview && <p className="map-note">{t("places.mapNote", { date: data.fetchedAt })}</p>}
    </div>
  );
}
