// Clinics, hospitals, dentists and pharmacies around Inha University from OpenStreetMap (Overpass API).
// usage: npm run fetch:places   → writes src/content/osm-places.json (commit the result)
// Data © OpenStreetMap contributors, ODbL. TEMPORARY source until the public-data (data.go.kr) lists are added.
import { writeFileSync } from "node:fs";

// About 2 km around the main campus (100 Inha-ro, Michuhol-gu, Incheon).
const BBOX = [37.43, 126.625, 37.472, 126.682]; // south, west, north, east
const query = `[out:json][timeout:90];
(
  nwr["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy)$"](${BBOX});
  nwr["healthcare"~"^(hospital|clinic|doctor|dentist|pharmacy)$"](${BBOX});
);
out center tags;`;

const res = await fetch("https://overpass-api.de/api/interpreter", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "NARU-places-fetch/1.0" },
  body: "data=" + encodeURIComponent(query),
});
if (!res.ok) throw new Error("Overpass " + res.status + " " + (await res.text()).slice(0, 200));
const { elements } = await res.json();

// OSM tags around here are unreliable (clinics tagged as hospitals, a print shop as a hospital), so the
// Korean name decides: it has to look like a medical place, and its ending says what kind it is.
const MEDICAL = /(병원|의원|약국|치과|한의원|한방|보건소|보건지소|의료|클리닉|소아과|내과|외과|안과|산부인과|가정의학과|이비인후과|피부과|비뇨|정신건강|메디)/;
const SKIP = /요양병원/; // long-term care, not where students go
function kind(name, tags) {
  if (/약국/.test(name)) return "pharmacy";
  if (/치과/.test(name)) return "dentist";
  if (/한의원|한방/.test(name)) return "kmed";
  if (/보건소|보건지소/.test(name)) return "public";
  if (/병원/.test(name) && !/의원$/.test(name)) return "hospital";
  if ((tags.amenity ?? tags.healthcare) === "pharmacy") return "pharmacy";
  return "clinic";
}
// Verified by hand: regional emergency centers in the box.
const EMERGENCY = ["인하대학교부속병원"];

const seen = new Set();
const places = [];
for (const e of elements) {
  const t = e.tags ?? {};
  const name = (t["name:ko"] ?? t.name ?? "").replace(/\s*\([A-Za-z ]+\)$/, "").trim();
  const lat = e.lat ?? e.center?.lat;
  const lng = e.lon ?? e.center?.lon;
  if (!name || lat == null || lng == null || !MEDICAL.test(name) || SKIP.test(name)) continue;
  const key = name + "@" + lat.toFixed(4) + "," + lng.toFixed(4);
  if (seen.has(key)) continue;
  seen.add(key);
  const address = [t["addr:city"], t["addr:district"], t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ");
  places.push({
    id: e.type[0] + e.id,
    name,
    ...(t["name:en"] ? { nameEn: t["name:en"] } : {}),
    kind: kind(name, t),
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    ...(t.emergency === "yes" || EMERGENCY.includes(name) ? { emergency: true } : {}),
    ...(t.phone || t["contact:phone"] ? { phone: t.phone ?? t["contact:phone"] } : {}),
    ...(t.opening_hours ? { hours: t.opening_hours } : {}),
    ...(t["healthcare:speciality"] ? { speciality: t["healthcare:speciality"] } : {}),
    ...(address ? { address } : {}),
  });
}
// The same place mapped twice (e.g. an old and a new name of one health center): keep the better entry.
const near = (a, b) => Math.abs(a.lat - b.lat) < 0.0003 && Math.abs(a.lng - b.lng) < 0.0003 && a.kind === b.kind;
for (let i = places.length - 1; i >= 0; i--) {
  const j = places.findIndex((p, k) => k !== i && near(p, places[i]));
  if (j >= 0 && (places[j].phone || !places[i].phone)) places.splice(i, 1);
}
places.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name, "ko"));

const out = {
  source: "OpenStreetMap (Overpass API)",
  attribution: "© OpenStreetMap contributors",
  license: "ODbL 1.0",
  fetchedAt: new Date().toISOString().slice(0, 10),
  bbox: BBOX,
  places,
};
writeFileSync(new URL("../src/content/osm-places.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
const count = places.reduce((m, p) => ((m[p.kind] = (m[p.kind] ?? 0) + 1), m), {});
console.log("places", places.length, count);
