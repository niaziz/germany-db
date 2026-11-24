import { NextResponse } from "next/server";

export const runtime = "nodejs";

const RAIL_MODES = new Set([
  "HIGHSPEED_RAIL",
  "LONG_DISTANCE",
  "NIGHT_RAIL",
  "REGIONAL_RAIL",
  "REGIONAL_FAST_RAIL",
  "SUBURBAN",
  "METRO",
  "TRAM",
]);

let cache: { time: number; body: unknown } | null = null;

function decodePolyline(encoded: string, precision = 5): [number, number][] {
  const factor = 10 ** precision;
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const coordinates: [number, number][] = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude += result & 1 ? -(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude += result & 1 ? -(result >> 1) : result >> 1;
    coordinates.push([longitude / factor, latitude / factor]);
  }

  return coordinates;
}

function haversine(a: [number, number], b: [number, number]) {
  const rad = Math.PI / 180;
  const lat1 = a[1] * rad;
  const lat2 = b[1] * rad;
  const dLat = (b[1] - a[1]) * rad;
  const dLon = (b[0] - a[0]) * rad;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function positionAtPolyline(points: [number, number][], fraction: number) {
  if (points.length === 0) return null;
  if (points.length === 1) return points[0];

  const distances = points
    .slice(1)
    .map((point, index) => haversine(points[index], point));
  const total = distances.reduce((sum, value) => sum + value, 0);
  if (!total) return points[0];

  let target = Math.max(0, Math.min(1, fraction)) * total;
  for (let index = 0; index < distances.length; index++) {
    if (target <= distances[index]) {
      const ratio = target / distances[index];
      const from = points[index];
      const to = points[index + 1];
      return [
        from[0] + (to[0] - from[0]) * ratio,
        from[1] + (to[1] - from[1]) * ratio,
      ] as [number, number];
    }
    target -= distances[index];
  }

  return points.at(-1) ?? null;
}

export async function GET() {
  if (cache && Date.now() - cache.time < 20_000) {
    return NextResponse.json(cache.body, {
      headers: { "Cache-Control": "public, max-age=20" },
    });
  }

  const now = new Date();
  const end = new Date(now.getTime() + 45 * 60_000);
  const params = new URLSearchParams({
    zoom: "7",
    min: "47.2,5.8",
    max: "55.1,15.2",
    startTime: now.toISOString(),
    endTime: end.toISOString(),
    precision: "4",
    language: "en",
  });

  try {
    const response = await fetch(
      `https://api.transitous.org/api/v6/map/trips?${params}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Orbit-Earth-Explorer/1.0",
        },
        next: { revalidate: 20 },
      },
    );

    if (!response.ok) throw new Error(`Transitous returned ${response.status}`);
    const segments = (await response.json()) as Array<{
      mode: string;
      departure: string;
      arrival: string;
      scheduledDeparture: string;
      polyline: string;
      trips?: Array<{ displayName?: string }>;
    }>;

    const nowMs = Date.now();
    const features = segments
      .filter((segment) => RAIL_MODES.has(segment.mode) && segment.polyline)
      .map((segment) => {
        const departure = Date.parse(segment.departure);
        const arrival = Date.parse(segment.arrival);
        const fraction =
          arrival > departure ? (nowMs - departure) / (arrival - departure) : 0;
        if (fraction < 0 || fraction > 1) return null;

        const points = decodePolyline(segment.polyline, 4);
        const position = positionAtPolyline(points, fraction);
        if (!position) return null;

        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: position },
          properties: {
            name:
              segment.trips?.[0]?.displayName ||
              segment.mode.replaceAll("_", " "),
            mode: segment.mode,
            realtime: true,
            updated: now.toISOString(),
          },
        };
      })
      .filter(
        (feature): feature is NonNullable<typeof feature> => feature !== null,
      );

    const body = { type: "FeatureCollection", features };
    cache = { time: Date.now(), body };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, max-age=20" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        type: "FeatureCollection",
        features: [],
        error:
          error instanceof Error
            ? error.message
            : "Live train feed unavailable",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
