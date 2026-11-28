// In-app map of clinics, hospitals and pharmacies near campus.
// TEMPORARY: free OpenStreetMap tiles and OSM place data (src/content/osm-places.json, `npm run fetch:places`)
// until the public-data lists (data.go.kr) are added. Tapping a place opens it in Naver Map.
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Languages, LocateFixed, Navigation, Phone } from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";
import { nativeName, type Locale } from "../i18n/locales";
import data from "../content/osm-places.json";
import { PLACE_LANGUAGE_CODES, SURVEYED, languagesAt } from "../content/place-languages";
import { SCHOOL } from "../content/school";
import { askHere, askHereIfAllowed, useHere } from "../state/here";
import { useSchoolInfo } from "../state/prefs";
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

/** The languages a place can serve a patient in, as small badges. Nothing is drawn when none are known. */
function Langs({ id, all = false }: { id: string; all?: boolean }) {
  const langs = languagesAt(id);
  if (!langs.length) return null;
  const shown = all ? langs : langs.slice(0, 2);
  return (
    <span className="place-langs">
      {shown.map((l) => (
        <span className="lang-badge" key={l} lang={l} dir="auto">
          {nativeName(l)}
        </span>
      ))}
      {langs.length > shown.length && <span className="lang-badge more">+{langs.length - shown.length}</span>}
    </span>
  );
}

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** `preview`: the home screen's map. It stays still so a swipe scrolls the page, and shows dots only (no filters or list). */
export default function PlaceMap({ preview = false }: { preview?: boolean }) {
  const { t } = useI18n();
  const school = useSchoolInfo();
  // A student who picked a school is placed at its campus. Everyone else stands where they stand, and
  // until they let the phone say where that is, at the area this list was collected around.
  const { spot, state } = useHere();
  const here = school?.location ?? spot ?? SCHOOL.location;
  /** How far a place is, said from whatever we are standing at. */
  const far = (d: number) => {
    const km = d.toFixed(1);
    if (school) return t("places.fromSchool", { km });
    return spot ? t("places.fromHere", { km }) : t("places.km", { km });
  };
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const framed = useRef(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [lang, setLang] = useState<Locale | "">("");
  const [selected, setSelected] = useState<Place | null>(null);

  const places = useMemo<Place[]>(() => {
    const own = data.places as Place[];
    const campus: Place[] = school
      ? [{ id: "school", name: t(school.name), nameEn: t("school.health"), kind: "school", ...school.location, phone: school.contacts[0].phone }]
      : [];
    return [...campus, ...own];
  }, [school, t]);

  const shown = useMemo(() => {
    const list = places
      .filter((p) => (filter === "all" ? true : filter === "er" ? p.emergency : p.kind === filter))
      .filter((p) => !lang || languagesAt(p.id).includes(lang));
    return list.map((p) => ({ ...p, distance: km(here, p) })).sort((a, b) => a.distance - b.distance);
  }, [places, filter, lang, here]);

  // No school means no campus to stand at, so ask the phone. Only those who already said yes are asked
  // without being asked: for everyone else nothing happens until they press the button.
  useEffect(() => {
    if (!school) askHereIfAllowed();
  }, [school]);

  // Create the map once.
  useEffect(() => {
    if (!box.current || map.current) return;
    const still = { dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false };
    const m = L.map(box.current, { zoomControl: !preview, attributionControl: true, ...(preview ? still : {}) }).setView(
      [here.lat, here.lng],
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

  // The position arrives a moment after the map is drawn. When it does, the map moves there and frames
  // the places around it again.
  useEffect(() => {
    if (!map.current) return;
    framed.current = false;
    map.current.setView([here.lat, here.lng], 15, { animate: false });
  }, [here.lat, here.lng]);

  // Draw the markers for the current filter.
  useEffect(() => {
    const group = layer.current;
    if (!group) return;
    group.clearLayers();
    // Where the distances are measured from, when that is the phone rather than a campus.
    if (!school && spot)
      L.circleMarker([spot.lat, spot.lng], {
        radius: 7,
        color: "#ffffff",
        weight: 3,
        fillColor: COLOR.public,
        fillOpacity: 1,
        interactive: false,
      }).addTo(group);
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
      // Not animated: leaving the tab mid-zoom tears the map down and the transition's callback then
      // runs against a map that is gone.
      map.current?.fitBounds(L.latLngBounds(shown.slice(0, 12).map((p) => [p.lat, p.lng])), { padding: [24, 24], maxZoom: 16, animate: false });
    }
  }, [shown, school, spot]);

  const select = (p: Place) => {
    setSelected(p);
    map.current?.setView([p.lat, p.lng], 17);
    box.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  return (
    <div className="place-map-wrap">
      {!preview && !school && !spot && (
        <div className="map-here">
          <button type="button" className="button" onClick={askHere} disabled={state === "asking"}>
            <LocateFixed size={18} aria-hidden /> {state === "asking" ? t("common.loading") : t("places.useLocation")}
          </button>
          {state === "off" && <p className="muted small">{t("places.locationOff")}</p>}
        </div>
      )}
      {!preview && (
        <>
          <div className="map-cats" role="group" aria-label={t("places.mapTitle")}>
            {FILTERS.filter((f) => f !== "school" || !!school).map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                <span className="dot" style={{ background: f === "all" ? "transparent" : f === "er" ? COLOR.er : COLOR[f] }} aria-hidden />
                {t(filterKey(f))}
              </button>
            ))}
          </div>
          {/* The second way to narrow the list: not what a place is, but whether it can talk to you. */}
          <div className="map-cats map-langs" role="group" aria-label={t("places.speaks")}>
            <span className="cats-label">
              <Languages size={16} aria-hidden /> {t("places.speaks")}
            </span>
            <button type="button" aria-pressed={lang === ""} onClick={() => setLang("")}>
              {t("places.kind.all")}
            </button>
            {PLACE_LANGUAGE_CODES.map((l) => (
              <button key={l} type="button" lang={l} dir="auto" aria-pressed={lang === l} onClick={() => setLang(lang === l ? "" : l)}>
                {nativeName(l)}
              </button>
            ))}
          </div>
        </>
      )}
      <div className={preview ? "place-map preview" : "place-map"} ref={box} role="application" aria-label={t("places.mapTitle")} />

      {selected && (
        <article className="place-card" aria-live="polite">
          <div className="place-card-head">
            <strong lang="ko">{selected.name}</strong>
            {selected.nameEn && <span>{selected.nameEn}</span>}
            <span className="place-kind">
              {selected.emergency ? t("places.kind.er") + " · " : ""}
              {t(filterKey(selected.kind))} · {far(km(here, selected))}
            </span>
            <Langs id={selected.id} all />
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
                  {t(filterKey(p.kind))} · {far(p.distance)}
                </span>
              </span>
              <Langs id={p.id} />
            </button>
          </li>
        ))}
      </ul>}
      {!preview && shown.length === 0 && <p className="muted">{t("places.langEmpty")}</p>}
      {!preview && !SURVEYED && <p className="map-note">{t("places.langSample")}</p>}
      {!preview && <p className="map-note">{t("places.mapNote", { date: data.fetchedAt })}</p>}
    </div>
  );
}
