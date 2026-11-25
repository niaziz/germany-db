import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RAIL = new Set([
  "HIGHSPEED_RAIL",
  "LONG_DISTANCE",
  "NIGHT_RAIL",
  "REGIONAL_FAST_RAIL",
  "REGIONAL_RAIL",
  "SUBURBAN",
  "RAIL",
]);

const cache = new Map<string, { t: number; body: unknown }>();

export async function GET(req: Request) {
  const u = new URL(req.url);
  const stopId = u.searchParams.get("stopId") || "";
  const arrive = u.searchParams.get("arrive") === "1";
  if (!stopId) return NextResponse.json({ rows: [], error: "missing stopId" });

  const key = stopId + (arrive ? "|A" : "|D");
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < 20_000) return NextResponse.json(hit.body);

  const params = new URLSearchParams({
    stopId,
    n: "40",
    arriveBy: arrive ? "true" : "false",
    language: "de",
  });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(
      `https://api.transitous.org/api/v6/stoptimes?${params}`,
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
    const data: any = await res.json();
    const all = (data.stopTimes || []).map((st: any) => {
      const pl = st.place || {};
      return {
        line: st.displayName || st.routeShortName || st.tripShortName || "",
        to: st.headsign || st.tripTo?.name || "",
        from: st.tripFrom?.name || "",
        time: Date.parse(arrive ? pl.arrival : pl.departure) || 0,
        sched:
          Date.parse(arrive ? pl.scheduledArrival : pl.scheduledDeparture) || 0,
        track: pl.track || pl.scheduledTrack || "",
        mode: st.mode || "",
        cancelled: !!(st.cancelled || pl.cancelled),
        realTime: !!st.realTime,
        tripId: st.tripId || "",
      };
    });
    const rail = all.filter((r: any) => RAIL.has(r.mode));
    const rows = (rail.length ? rail : all).slice(0, 14);
    const body = { rows, name: data.place?.name || "" };
    cache.set(key, { t: Date.now(), body });
    return NextResponse.json(body);
  } catch (e) {
    if (hit) return NextResponse.json(hit.body);
    return NextResponse.json({
      rows: [],
      error: e instanceof Error ? e.message : "departures unavailable",
    });
  } finally {
    clearTimeout(timer);
  }
}
