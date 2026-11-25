import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only real trains (no trams / subways) -> much smaller, faster response
const MODES = new Set([
  "HIGHSPEED_RAIL",
  "LONG_DISTANCE",
  "NIGHT_RAIL",
  "REGIONAL_FAST_RAIL",
  "REGIONAL_RAIL",
  "SUBURBAN",
]);

const ZOOM = "7"; // lower = fewer trains (e.g. 7 = mostly long distance)
const WINDOW_MIN = 2; // short time window = small payload
const FRESH_MS = 25_000; // serve straight from cache for 25 s
const STALE_MS = 180_000; // after that: answer instantly from old cache, refresh in background
const MAX_POLYLINE_POINTS = 80;

type Seg = {
  id: string;
  name: string;
  mode: string;
  from: string;
  to: string;
  dep: number;
  arr: number;
  sdep: number;
  sarr: number;
  pts: number[]; // flat [lon, lat, lon, lat, ...]
  tripId: string;
  head: string;
  fromId: string;
  toId: string;
};

let cache: {
  time: number;
  body: { segments: Seg[]; fetchedAt: number };
} | null = null;
let inflight: Promise<void> | null = null;

function decodePolyline(encoded: string, precision = 4): number[] {
  const factor = 10 ** precision;
  let index = 0;
  let lat = 0;
  let lon = 0;
  const out: number[] = [];
  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? -(result >> 1) : result >> 1;
    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lon += result & 1 ? -(result >> 1) : result >> 1;
    out.push(lon / factor, lat / factor);
  }
  return out;
}

function simplifyPolyline(points: number[], maxPoints = MAX_POLYLINE_POINTS): number[] {
  const pointCount = points.length / 2;
  if (pointCount <= maxPoints) return points;

  const out: number[] = [];
  const step = (pointCount - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    const pointIndex = Math.min(pointCount - 1, Math.round(i * step)) * 2;
    out.push(points[pointIndex], points[pointIndex + 1]);
  }
  return out;
}

async function load() {
  const now = new Date();
  const end = new Date(now.getTime() + WINDOW_MIN * 60_000);
  const params = new URLSearchParams({
    zoom: ZOOM,
    min: "47.2,5.8",
    max: "55.1,15.2",
    startTime: now.toISOString(),
    endTime: end.toISOString(),
    precision: "4",
    language: "de",
  });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25_000);
  try {
    const res = await fetch(
      `https://api.transitous.org/api/v6/map/trips?${params}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "germany-live-trains/1.0",
        },
        signal: ctrl.signal,
        cache: "no-store",
      },
    );
    if (!res.ok) throw new Error(`Transitous returned ${res.status}`);
    const payload = await res.json();
    if (!Array.isArray(payload)) {
      throw new Error("Transitous returned an invalid response");
    }
    const raw = payload as any[];

    const segments: Seg[] = [];
    for (const s of raw) {
      if (!MODES.has(s.mode) || !s.polyline) continue;
      const dep = Date.parse(s.departure);
      const arr = Date.parse(s.arrival);
      if (!(arr > dep)) continue;
      const pts = simplifyPolyline(decodePolyline(s.polyline, 4));
      if (pts.length < 4) continue;
      const trip = s.trips?.[0];
      const name =
        trip?.displayName ||
        trip?.routeShortName ||
        String(s.mode).replaceAll("_", " ");
      segments.push({
        id: `${name}|${dep}|${pts[0]}`,
        name,
        mode: s.mode,
        from: s.from?.name || "",
        to: s.to?.name || "",
        dep,
        arr,
        sdep: Date.parse(s.scheduledDeparture) || dep,
        sarr: Date.parse(s.scheduledArrival) || arr,
        pts,
        tripId: String(trip?.tripId || name),
        head: String(trip?.headsign || s.headsign || trip?.tripTo?.name || ""),
        fromId: String(s.from?.stopId || ""),
        toId: String(s.to?.stopId || ""),
      });
    }
    cache = { time: Date.now(), body: { segments, fetchedAt: Date.now() } };
  } finally {
    clearTimeout(timer);
  }
}

function refresh() {
  if (!inflight) {
    inflight = load().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export async function GET() {
  const age = cache ? Date.now() - cache.time : Infinity;

  if (cache && age < FRESH_MS) return NextResponse.json(cache.body);

  if (cache && age < STALE_MS) {
    refresh().catch(() => undefined); // update in background, answer instantly
    return NextResponse.json(cache.body);
  }

  try {
    await refresh();
    return NextResponse.json(cache!.body);
  } catch (e) {
    if (cache) return NextResponse.json(cache.body);
    return NextResponse.json({
      segments: [],
      fetchedAt: Date.now(),
      error: e instanceof Error ? e.message : "Live train feed unavailable",
    });
  }
}
