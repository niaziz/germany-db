"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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
  pts: number[];
  tripId?: string;
  head?: string;
  cum?: number[];
  total?: number;
};
type Cls = "long" | "reg" | "sub";
type ColorMode = "type" | "delay" | "speed" | "stars";

const FONT = ["Open Sans Regular", "Arial Unicode MS Regular"];
const FONT_BOLD = ["Open Sans Semibold", "Arial Unicode MS Bold"];
const PAL = {
  red: "#ff4d4d",
  blue: "#3db8ff",
  purple: "#b98cff",
  green: "#4dff9a",
  yellow: "#ffd84d",
  orange: "#ff9a3d",
  white: "#f4f1ff",
} as const;
type PK = keyof typeof PAL;
const CLS_PK: Record<Cls, PK> = { long: "red", reg: "blue", sub: "purple" };
const LABELS: Record<Cls, string> = {
  long: "ICE / IC",
  reg: "RE / RB",
  sub: "S-Bahn",
};
const EMPTY: any = { type: "FeatureCollection", features: [] };

const CITIES: [string, number, number][] = [
  ["Berlin", 52.52, 13.405],
  ["Hamburg", 53.551, 9.994],
  ["München", 48.137, 11.575],
  ["Köln", 50.938, 6.96],
  ["Frankfurt", 50.11, 8.682],
  ["Stuttgart", 48.775, 9.182],
  ["Düsseldorf", 51.228, 6.774],
  ["Leipzig", 51.34, 12.375],
  ["Dortmund", 51.514, 7.468],
  ["Essen", 51.455, 7.012],
  ["Bremen", 53.079, 8.802],
  ["Dresden", 51.05, 13.738],
  ["Hannover", 52.375, 9.732],
  ["Nürnberg", 49.452, 11.077],
  ["Duisburg", 51.435, 6.763],
  ["Bochum", 51.482, 7.216],
  ["Wuppertal", 51.256, 7.151],
  ["Bielefeld", 52.021, 8.533],
  ["Bonn", 50.737, 7.098],
  ["Münster", 51.961, 7.629],
  ["Karlsruhe", 49.007, 8.404],
  ["Mannheim", 49.488, 8.466],
  ["Augsburg", 48.37, 10.898],
  ["Wiesbaden", 50.083, 8.24],
  ["Gelsenkirchen", 51.517, 7.086],
  ["Mönchengladbach", 51.195, 6.44],
  ["Braunschweig", 52.269, 10.521],
  ["Kiel", 54.323, 10.123],
  ["Chemnitz", 50.833, 12.919],
  ["Aachen", 50.776, 6.084],
  ["Halle", 51.483, 11.97],
  ["Magdeburg", 52.121, 11.628],
  ["Freiburg", 47.999, 7.842],
  ["Krefeld", 51.339, 6.585],
  ["Lübeck", 53.866, 10.687],
  ["Mainz", 49.999, 8.274],
  ["Erfurt", 50.978, 11.029],
  ["Rostock", 54.092, 12.099],
  ["Kassel", 51.312, 9.48],
  ["Hagen", 51.36, 7.474],
  ["Saarbrücken", 49.234, 6.997],
  ["Potsdam", 52.399, 13.066],
  ["Ludwigshafen", 49.481, 8.446],
  ["Oldenburg", 53.143, 8.214],
  ["Osnabrück", 52.279, 8.047],
  ["Leverkusen", 51.033, 6.984],
  ["Heidelberg", 49.399, 8.672],
  ["Darmstadt", 49.873, 8.651],
  ["Würzburg", 49.794, 9.929],
  ["Regensburg", 49.013, 12.102],
  ["Ingolstadt", 48.766, 11.425],
  ["Ulm", 48.401, 9.987],
  ["Wolfsburg", 52.423, 10.787],
  ["Göttingen", 51.533, 9.935],
  ["Heilbronn", 49.14, 9.22],
  ["Pforzheim", 48.892, 8.694],
  ["Offenbach", 50.095, 8.766],
  ["Paderborn", 51.719, 8.754],
  ["Bremerhaven", 53.54, 8.58],
  ["Jena", 50.927, 11.589],
  ["Koblenz", 50.36, 7.589],
  ["Trier", 49.75, 6.637],
  ["Siegen", 50.875, 8.024],
  ["Gera", 50.88, 12.08],
  ["Cottbus", 51.76, 14.334],
  ["Schwerin", 53.635, 11.401],
  ["Flensburg", 54.783, 9.436],
  ["Fulda", 50.553, 9.675],
  ["Konstanz", 47.663, 9.175],
  ["Passau", 48.574, 13.464],
  ["Bamberg", 49.892, 10.887],
  ["Bayreuth", 49.943, 11.578],
  ["Hof", 50.313, 11.917],
  ["Plauen", 50.495, 12.138],
  ["Zwickau", 50.719, 12.492],
  ["Görlitz", 51.153, 14.987],
  ["Stralsund", 54.309, 13.082],
  ["Greifswald", 54.093, 13.381],
  ["Neubrandenburg", 53.557, 13.261],
  ["Frankfurt (Oder)", 52.347, 14.55],
  ["Dessau", 51.837, 12.246],
  ["Stendal", 52.605, 11.86],
  ["Hildesheim", 52.15, 9.951],
  ["Lüneburg", 53.249, 10.414],
  ["Emden", 53.367, 7.206],
  ["Rosenheim", 47.857, 12.123],
  ["Kempten", 47.726, 10.316],
  ["Lindau", 47.546, 9.684],
  ["Garmisch-Partenkirchen", 47.492, 11.095],
  ["Bielefeld", 52.021, 8.533],
  ["Gießen", 50.584, 8.678],
  ["Marburg", 50.81, 8.77],
  ["Hanau", 50.131, 8.917],
  ["Aschaffenburg", 49.974, 9.149],
  ["Schweinfurt", 50.049, 10.222],
  ["Landshut", 48.537, 12.152],
  ["Memmingen", 47.984, 10.186],
  ["Villingen-Schwenningen", 48.06, 8.46],
  ["Offenburg", 48.473, 7.944],
  ["Baden-Baden", 48.76, 8.24],
  ["Neuss", 51.2, 6.69],
  ["Recklinghausen", 51.614, 7.197],
  ["Bottrop", 51.52, 6.92],
  ["Witten", 51.443, 7.352],
  ["Solingen", 51.17, 7.083],
  ["Remscheid", 51.18, 7.19],
  ["Cuxhaven", 53.86, 8.69],
  ["Wilhelmshaven", 53.53, 8.11],
  ["Husum", 54.478, 9.052],
  ["Eberswalde", 52.83, 13.82],
  ["Brandenburg", 52.41, 12.56],
  ["Wittenberg", 51.87, 12.65],
  ["Nordhausen", 51.5, 10.79],
  ["Eisenach", 50.98, 10.32],
  ["Weimar", 50.98, 11.33],
  ["Suhl", 50.61, 10.69],
  ["Hameln", 52.1, 9.36],
  ["Celle", 52.62, 10.08],
  ["Goslar", 51.9, 10.43],
  ["Minden", 52.29, 8.92],
  ["Gütersloh", 51.91, 8.38],
  ["Detmold", 51.94, 8.88],
  ["Hamm", 51.68, 7.82],
  ["Koblenz", 50.36, 7.589],
  ["Kaiserslautern", 49.44, 7.77],
  ["Worms", 49.63, 8.36],
  ["Speyer", 49.32, 8.43],
  ["Bingen", 49.97, 7.9],
  ["Limburg", 50.38, 8.06],
];

const cityData: any = {
  type: "FeatureCollection",
  features: CITIES.map(([name, lat, lon]) => ({
    type: "Feature",
    properties: { name },
    geometry: { type: "Point", coordinates: [lon, lat] },
  })),
};

// decorative background stars (only visible in night-sky mode)
const starData: any = (() => {
  let seed = 12345;
  const rnd = () =>
    (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const features = [];
  for (let i = 0; i < 700; i++) {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-2 + rnd() * 24, 42 + rnd() * 17],
      },
      properties: { r: 0.4 + rnd() * 0.9, o: 0.15 + rnd() * 0.4 },
    });
  }
  return { type: "FeatureCollection", features };
})();

function tailLayer(pk: PK): any {
  return {
    id: `tail-${pk}`,
    type: "line",
    source: "tails",
    filter: ["==", ["get", "pk"], pk],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1, 10, 2.5],
      "line-gradient": [
        "interpolate",
        ["linear"],
        ["line-progress"],
        0,
        "rgba(0,0,0,0)",
        1,
        PAL[pk],
      ],
    },
  };
}

const style: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    germany: { type: "geojson", data: "/data/germany.json" },
    cities: { type: "geojson", data: cityData },
    network: { type: "geojson", data: EMPTY },
    stations: { type: "geojson", data: EMPTY },
    starfield: { type: "geojson", data: starData },
    tails: { type: "geojson", data: EMPTY, lineMetrics: true },
    trains: { type: "geojson", data: EMPTY },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#020409" } },
    {
      id: "germany-fill",
      type: "fill",
      source: "germany",
      paint: { "fill-color": "#0c121a" },
    },
    {
      id: "germany-border",
      type: "line",
      source: "germany",
      paint: { "line-color": "#2b3a4b", "line-width": 1.2 },
    },
    {
      id: "network",
      type: "line",
      source: "network",
      paint: {
        "line-color": "#5d7a99",
        "line-opacity": 0.22,
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 10, 1.5],
      },
    },
    {
      id: "starfield",
      type: "circle",
      source: "starfield",
      layout: { visibility: "none" },
      paint: {
        "circle-color": "#cfd8ff",
        "circle-radius": ["get", "r"],
        "circle-opacity": ["get", "o"],
      },
    },
    {
      id: "city-dots",
      type: "circle",
      source: "cities",
      paint: {
        "circle-color": "#ffffff",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 2, 10, 4],
        "circle-opacity": 0.95,
      },
    },
    {
      id: "city-labels",
      type: "symbol",
      source: "cities",
      minzoom: 6,
      layout: {
        "text-field": ["get", "name"],
        "text-font": FONT,
        "text-size": ["interpolate", ["linear"], ["zoom"], 6, 9, 10, 12],
        "text-offset": [0, 0.7],
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#cfd6df",
        "text-halo-color": "#020409",
        "text-halo-width": 1.2,
      },
    },
    {
      id: "station-dots",
      type: "circle",
      source: "stations",
      minzoom: 7,
      paint: {
        "circle-color": "#02070d",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 1.8, 12, 4.5],
        "circle-stroke-color": "#9fe8ff",
        "circle-stroke-width": 1.1,
      },
    },
    {
      id: "station-labels",
      type: "symbol",
      source: "stations",
      minzoom: 10,
      layout: {
        "text-field": ["get", "name"],
        "text-font": FONT,
        "text-size": 10,
        "text-offset": [0, 0.8],
        "text-anchor": "top",
        "text-optional": true,
      },
      paint: {
        "text-color": "#9fe8ff",
        "text-halo-color": "#020409",
        "text-halo-width": 1.2,
      },
    },
    {
      id: "station-hit",
      type: "circle",
      source: "stations",
      minzoom: 7,
      paint: { "circle-radius": 9, "circle-opacity": 0.01 },
    },
    ...(Object.keys(PAL) as PK[]).map(tailLayer),
    {
      id: "train-glow",
      type: "circle",
      source: "trains",
      paint: {
        "circle-color": ["get", "hex"],
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          ["*", ["get", "rs"], 4],
          10,
          ["*", ["get", "rs"], 9],
        ],
        "circle-opacity": ["*", 0.3, ["get", "op"]],
        "circle-blur": 1,
      },
    },
    {
      id: "train-dots",
      type: "circle",
      source: "trains",
      paint: {
        "circle-color": ["get", "hex"],
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          ["*", ["get", "rs"], 1.6],
          10,
          ["*", ["get", "rs"], 3.2],
        ],
        "circle-opacity": ["get", "op"],
      },
    },
    {
      id: "train-selected",
      type: "circle",
      source: "trains",
      filter: ["==", ["get", "key"], ""],
      paint: {
        "circle-radius": 9,
        "circle-color": "rgba(0,0,0,0)",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
    },
    {
      id: "train-hit",
      type: "circle",
      source: "trains",
      paint: { "circle-radius": 11, "circle-opacity": 0.01 },
    },
    {
      id: "train-labels",
      type: "symbol",
      source: "trains",
      minzoom: 7,
      layout: {
        "text-field": [
          "step",
          ["zoom"],
          ["get", "name"],
          9.5,
          ["get", "label"],
        ],
        "text-font": FONT,
        "text-size": ["interpolate", ["linear"], ["zoom"], 7, 9, 12, 12],
        "text-offset": [0.8, 0],
        "text-anchor": "left",
        "text-optional": true,
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": ["get", "hex"],
        "text-halo-color": "#020409",
        "text-halo-width": 1.5,
      },
    },
  ],
} as any;

// ---------- helpers ----------
const clsOf = (mode: string): Cls =>
  mode === "SUBURBAN"
    ? "sub"
    : mode === "REGIONAL_RAIL" || mode === "REGIONAL_FAST_RAIL"
      ? "reg"
      : "long";

const fmtTime = (ms: number) =>
  new Date(ms).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });

function colorKey(mode: ColorMode, cls: Cls, delay: number, kmh: number): PK {
  if (mode === "stars") return "white";
  if (mode === "delay")
    return delay < 1
      ? "green"
      : delay < 5
        ? "yellow"
        : delay < 15
          ? "orange"
          : "red";
  if (mode === "speed")
    return kmh < 50
      ? "blue"
      : kmh < 100
        ? "green"
        : kmh < 160
          ? "yellow"
          : "red";
  return CLS_PK[cls];
}

const LEGENDS: Record<ColorMode, [PK, string][]> = {
  type: [],
  stars: [],
  delay: [
    ["green", "on time"],
    ["yellow", "1–5 min"],
    ["orange", "5–15 min"],
    ["red", "15+ min"],
  ],
  speed: [
    ["blue", "< 50 km/h"],
    ["green", "50–100"],
    ["yellow", "100–160"],
    ["red", "160+ km/h"],
  ],
};

function prep(s: Seg) {
  if (s.cum) return;
  const cum = [0];
  for (let i = 2; i < s.pts.length; i += 2) {
    const dx =
      (s.pts[i] - s.pts[i - 2]) *
      Math.cos((s.pts[i + 1] * Math.PI) / 180) *
      111320;
    const dy = (s.pts[i + 1] - s.pts[i - 1]) * 110540;
    cum.push(cum[cum.length - 1] + Math.hypot(dx, dy));
  }
  s.cum = cum;
  s.total = cum[cum.length - 1];
}

function pointAt(s: Seg, d: number): [number, number] {
  const cum = s.cum!;
  let lo = 0,
    hi = cum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= d) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo] || 1;
  const r = Math.max(0, Math.min(1, (d - cum[lo]) / seg));
  const a = lo * 2,
    b = hi * 2;
  return [
    s.pts[a] + (s.pts[b] - s.pts[a]) * r,
    s.pts[a + 1] + (s.pts[b + 1] - s.pts[a + 1]) * r,
  ];
}

function tailCoords(s: Seg, d: number, tailM: number): [number, number][] {
  const start = Math.max(0, d - tailM);
  const out: [number, number][] = [pointAt(s, start)];
  const cum = s.cum!;
  for (let i = 0; i < cum.length; i++) {
    if (cum[i] > start && cum[i] < d)
      out.push([s.pts[i * 2], s.pts[i * 2 + 1]]);
  }
  out.push(pointAt(s, d));
  return out;
}

type Poly = {
  ring: number[][];
  x0: number;
  x1: number;
  y0: number;
  y1: number;
};
function buildPolys(geo: any): Poly[] {
  const out: Poly[] = [];
  for (const f of geo.features || []) {
    const g = f.geometry;
    const parts = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
    for (const part of parts) {
      const ring = part[0];
      let x0 = 1e9,
        x1 = -1e9,
        y0 = 1e9,
        y1 = -1e9;
      for (const [x, y] of ring) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      out.push({ ring, x0, x1, y0, y1 });
    }
  }
  return out;
}
function inPolys(polys: Poly[], x: number, y: number) {
  for (const p of polys) {
    if (x < p.x0 || x > p.x1 || y < p.y0 || y > p.y1) continue;
    let c = false;
    const r = p.ring;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const xi = r[i][0],
        yi = r[i][1],
        xj = r[j][0],
        yj = r[j][1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
        c = !c;
    }
    if (c) return true;
  }
  return false;
}
const phaseOf = (k: string) => {
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) % 6283;
  return h / 1000;
};

const COMPASS = [
  "north ↑",
  "north-east ↗",
  "east →",
  "south-east ↘",
  "south ↓",
  "south-west ↙",
  "west ←",
  "north-west ↖",
];
function bearingText(a: [number, number], b: [number, number]) {
  const dx = (b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180);
  const dy = b[1] - a[1];
  const deg = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
  return COMPASS[Math.round(deg / 45) % 8];
}
function nearestCity(p: [number, number]) {
  let best = "",
    bd = Infinity;
  for (const [n, la, lo] of CITIES) {
    const dx = (lo - p[0]) * Math.cos((la * Math.PI) / 180) * 111.32;
    const dy = (la - p[1]) * 110.54;
    const d = Math.hypot(dx, dy);
    if (d < bd) {
      bd = d;
      best = n;
    }
  }
  return `${Math.round(bd)} km from ${best}`;
}
const mmss = (ms: number) => {
  const t = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(t / 60)} min ${String(t % 60).padStart(2, "0")} s`;
};

type Hit =
  | { kind: "train"; key: string; name: string; to: string; arr: string }
  | {
      kind: "station";
      name: string;
      id: string;
      lon: number;
      lat: number;
      n: number;
    };
type Stn = { name: string; id: string; lon: number; lat: number };

export default function GermanyDark() {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const segs = useRef<Seg[]>([]);
  const fetchedAt = useRef(0);
  const posByKey = useRef<Map<string, [number, number]>>(new Map());
  const netKeys = useRef<Set<string>>(new Set());
  const netFeatures = useRef<any[]>([]);
  const animRef = useRef<() => void>(() => undefined);
  const pendingHash = useRef("");
  const tickN = useRef(0);
  const polys = useRef<Poly[]>([]);
  const stnAll = useRef<Map<string, Stn>>(new Map());
  const gOnly = useRef(false);
  const refreshStnRef = useRef<() => void>(() => undefined);

  // mirrors of state (the map loop runs once and reads these)
  const selKey = useRef("");
  const show = useRef<Record<Cls, boolean>>({
    long: true,
    reg: true,
    sub: true,
  });
  const colorMode = useRef<ColorMode>("type");
  const minDelay = useRef(0);
  const station = useRef("");
  const follow = useRef(false);

  const [sel, setSel] = useState<any>(null);
  const [status, setStatus] = useState("loading…");
  const [names, setNames] = useState(true);
  const [filters, setFilters] = useState<Record<Cls, boolean>>({
    long: true,
    reg: true,
    sub: true,
  });
  const [cmode, setCmode] = useState<ColorMode>("type");
  const [minD, setMinD] = useState(0);
  const [stationName, setStationName] = useState("");
  const [followOn, setFollowOn] = useState(false);
  const [showNet, setShowNet] = useState(true);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [stats, setStats] = useState<any>({
    long: 0,
    reg: 0,
    sub: 0,
    total: 0,
    late: [],
    age: 0,
  });
  const [wall, setWall] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cityNames, setCityNames] = useState(true);
  const [stationsOn, setStationsOn] = useState(true);
  const [germanyOnly, setGermanyOnly] = useState(false);
  const [stn, setStn] = useState<any>(null);
  const [stnArrive, setStnArrive] = useState(false);

  useEffect(() => {
    show.current = filters;
  }, [filters]);
  useEffect(() => {
    colorMode.current = cmode;
  }, [cmode]);
  useEffect(() => {
    minDelay.current = minD;
  }, [minD]);
  useEffect(() => {
    station.current = stationName;
  }, [stationName]);
  useEffect(() => {
    follow.current = followOn;
  }, [followOn]);
  useEffect(() => {
    gOnly.current = germanyOnly;
    refreshStnRef.current();
  }, [germanyOnly]);

  // ---------- selection helpers ----------
  function selectTrain(key: string, fly: boolean) {
    const m = map.current;
    if (!m) return;
    selKey.current = key;
    setStn(null);
    m.setFilter("train-selected", ["==", ["get", "key"], key]);
    try {
      history.replaceState(null, "", `#train=${encodeURIComponent(key)}`);
    } catch {}
    animRef.current();
    const pos = posByKey.current.get(key);
    if (fly && pos)
      m.flyTo({ center: pos, zoom: Math.max(m.getZoom(), 9), duration: 1200 });
    setQuery("");
    setHits([]);
  }
  function clearSel() {
    selKey.current = "";
    map.current?.setFilter("train-selected", ["==", ["get", "key"], ""]);
    try {
      history.replaceState(null, "", location.pathname);
    } catch {}
    setFollowOn(false);
    setSel(null);
  }
  async function loadDepartures(id: string, arrive: boolean) {
    try {
      const r = await fetch(
        `/api/departures?stopId=${encodeURIComponent(id)}${arrive ? "&arrive=1" : ""}`,
        { cache: "no-store" },
      );
      const d = await r.json();
      setStn((prev: any) =>
        prev && prev.id === id
          ? {
              ...prev,
              loading: false,
              rows: d.rows || [],
              error: d.error || "",
            }
          : prev,
      );
    } catch {
      setStn((prev: any) =>
        prev && prev.id === id
          ? { ...prev, loading: false, error: "schedule unavailable" }
          : prev,
      );
    }
  }
  function openStation(st: Stn, fly: boolean) {
    const m = map.current;
    if (!m) return;
    clearSelOnly();
    setStn({ ...st, loading: true, rows: [], error: "" });
    setQuery("");
    setHits([]);
    if (fly)
      m.flyTo({
        center: [st.lon, st.lat],
        zoom: Math.max(m.getZoom(), 10),
        duration: 1200,
      });
    if (st.id) loadDepartures(st.id, stnArrive);
    else
      setStn((p: any) =>
        p
          ? { ...p, loading: false, error: "no schedule id for this station" }
          : p,
      );
  }
  function clearSelOnly() {
    selKey.current = "";
    map.current?.setFilter("train-selected", ["==", ["get", "key"], ""]);
    setFollowOn(false);
    setSel(null);
  }
  function selectStation(name: string) {
    const m = map.current;
    station.current = name;
    setStationName(name);
    setQuery("");
    setHits([]);
    animRef.current();
    const ps = Array.from(posByKey.current.values());
    if (m && ps.length) {
      const b = new maplibregl.LngLatBounds(ps[0], ps[0]);
      ps.forEach((p) => b.extend(p));
      m.fitBounds(b, { padding: 80, maxZoom: 9, duration: 1200 });
    }
  }

  // ---------- search ----------
  function onSearch(q: string) {
    setQuery(q);
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) {
      setHits([]);
      return;
    }
    const now = Date.now();
    const trains: Hit[] = [];
    const seen = new Set<string>();
    const heading = new Map<string, number>();
    for (const s of segs.current) {
      if (now < s.dep || now > s.arr) continue;
      const key = s.tripId || s.name;
      for (const nm of [s.to, s.head])
        if (nm) heading.set(nm, (heading.get(nm) || 0) + 1);
      if (s.name.toLowerCase().includes(needle) && !seen.has(key)) {
        seen.add(key);
        trains.push({
          kind: "train",
          key,
          name: s.name,
          to: s.to,
          arr: fmtTime(s.arr),
        });
      }
    }
    const stations: Hit[] = Array.from(stnAll.current.values())
      .filter((x) => x.name.toLowerCase().includes(needle))
      .sort(
        (a, b) =>
          (heading.get(b.name) || 0) - (heading.get(a.name) || 0) ||
          a.name.length - b.name.length,
      )
      .slice(0, 5)
      .map((x) => ({
        kind: "station" as const,
        name: x.name,
        id: x.id,
        lon: x.lon,
        lat: x.lat,
        n: heading.get(x.name) || 0,
      }));
    setHits([...stations, ...trains.slice(0, 8)]);
  }

  // ---------- map ----------
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = new maplibregl.Map({
      container: el.current,
      style,
      bounds: [
        [5.6, 47.1],
        [15.3, 55.2],
      ],
      fitBoundsOptions: { padding: 20 },
      minZoom: 4,
      maxZoom: 14,
      attributionControl: { compact: true },
    });
    m.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    map.current = m;
    let disposed = false;

    const h = decodeURIComponent(location.hash.replace(/^#train=/, ""));
    if (location.hash.startsWith("#train=") && h) pendingHash.current = h;

    function addNetwork() {
      let added = false;
      for (const s of segs.current) {
        const p = s.pts;
        const k = `${p[0]},${p[1]},${p[p.length - 2]},${p[p.length - 1]}`;
        if (netKeys.current.has(k) || netFeatures.current.length > 9000)
          continue;
        netKeys.current.add(k);
        const coords: [number, number][] = [];
        for (let i = 0; i < p.length; i += 2) coords.push([p[i], p[i + 1]]);
        netFeatures.current.push({
          type: "Feature",
          geometry: { type: "LineString", coordinates: coords },
          properties: {},
        });
        added = true;
      }
      if (added)
        (
          m.getSource("network") as maplibregl.GeoJSONSource | undefined
        )?.setData({
          type: "FeatureCollection",
          features: netFeatures.current,
        } as any);
    }

    function refreshStations() {
      if (disposed || map.current !== m || !m.isStyleLoaded()) return;
      const feats: any[] = [];
      stnAll.current.forEach((st) => {
        if (
          gOnly.current &&
          polys.current.length &&
          !inPolys(polys.current, st.lon, st.lat)
        )
          return;
        feats.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [st.lon, st.lat] },
          properties: { name: st.name, id: st.id },
        });
      });
      (
        m.getSource("stations") as maplibregl.GeoJSONSource | undefined
      )?.setData({ type: "FeatureCollection", features: feats } as any);
    }
    refreshStnRef.current = refreshStations;

    function addStations() {
      let added = false;
      for (const s of segs.current) {
        const p = s.pts;
        const ends: [string, string, number, number][] = [
          [s.from, (s as any).fromId, p[0], p[1]],
          [s.to, (s as any).toId, p[p.length - 2], p[p.length - 1]],
        ];
        for (const [name, id, lon, lat] of ends) {
          if (!name) continue;
          const k = id || name;
          if (!stnAll.current.has(k)) {
            stnAll.current.set(k, { name, id, lon, lat });
            added = true;
          }
        }
      }
      if (added) refreshStations();
    }

    async function fetchTrains() {
      try {
        const res = await fetch("/api/trains", { cache: "no-store" });
        const data = await res.json();
        if (disposed) return;
        segs.current = data.segments || [];
        fetchedAt.current = data.fetchedAt || Date.now();
        setStatus(data.error ? `feed error: ${data.error}` : "live");
        addNetwork();
        addStations();
        if (pendingHash.current) {
          animate();
          if (posByKey.current.has(pendingHash.current))
            selectTrain(pendingHash.current, true);
          pendingHash.current = "";
        }
      } catch {
        if (!disposed) setStatus("feed unavailable");
      }
    }

    // Runs every 0.4 s: moves every train along its route using the clock
    function animate() {
      const now = Date.now();
      const cm = colorMode.current,
        md = minDelay.current,
        st = station.current;
      const pts: any[] = [];
      const tails: any[] = [];
      const posMap = new Map<string, [number, number]>();
      const counts = { long: 0, reg: 0, sub: 0 };
      const late: any[] = [];
      let info: any = null;
      for (const s of segs.current) {
        const cls = clsOf(s.mode);
        if (!show.current[cls]) continue;
        if (now < s.dep || now > s.arr) continue;
        prep(s);
        if (!s.total) continue;
        const delay = Math.round((s.dep - s.sdep) / 60000);
        if (md > 0 && delay < md) continue;
        if (st && s.to !== st && s.head !== st) continue;
        const f = (now - s.dep) / (s.arr - s.dep);
        const d = f * s.total;
        const speed = s.total / ((s.arr - s.dep) / 1000); // m/s
        const kmh = Math.round(speed * 3.6);
        const tailM = Math.min(s.total, Math.max(250, speed * 400)); // longer tail = faster train
        const pos = pointAt(s, d);
        if (
          gOnly.current &&
          polys.current.length &&
          !inPolys(polys.current, pos[0], pos[1])
        )
          continue;
        const key = s.tripId || s.name;
        const pk = colorKey(cm, cls, delay, kmh);
        posMap.set(key, pos);
        counts[cls]++;
        if (delay >= 1) late.push({ key, name: s.name, to: s.to, delay });
        pts.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: pos },
          properties: {
            key,
            name: s.name,
            cls,
            pk,
            hex: PAL[pk],
            rs: cm === "stars" ? 0.7 + (Math.min(kmh, 200) / 200) * 0.9 : 1,
            op:
              cm === "stars"
                ? 0.55 + 0.45 * Math.sin(now / 650 + phaseOf(key))
                : 1,
            label: `${s.name} → ${s.to || "?"} ${fmtTime(s.arr)}`,
          },
        });
        if (d > 30) {
          tails.push({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: tailCoords(s, d, tailM),
            },
            properties: { pk },
          });
        }
        if (key === selKey.current) {
          info = {
            key,
            name: s.name,
            cls,
            pk,
            head: s.head,
            from: s.from,
            to: s.to,
            dep: fmtTime(s.dep),
            arr: fmtTime(s.arr),
            sarr: fmtTime(s.sarr),
            delay,
            pct: Math.round(f * 100),
            kmh,
            dir: bearingText(pos, pointAt(s, Math.min(s.total, d + 150))),
            lat: pos[1].toFixed(4),
            lon: pos[0].toFixed(4),
            near: nearestCity(pos),
            left: mmss(s.arr - now),
            atStop: false,
          };
        }
      }
      posByKey.current = posMap;
      (m.getSource("trains") as maplibregl.GeoJSONSource | undefined)?.setData({
        type: "FeatureCollection",
        features: pts,
      } as any);
      (m.getSource("tails") as maplibregl.GeoJSONSource | undefined)?.setData({
        type: "FeatureCollection",
        features: tails,
      } as any);

      if (tickN.current++ % 5 === 0) {
        late.sort((a, b) => b.delay - a.delay);
        setStats({
          ...counts,
          total: pts.length,
          late: late.slice(0, 6),
          age: fetchedAt.current
            ? Math.round((now - fetchedAt.current) / 1000)
            : 0,
        });
      }
      if (selKey.current)
        setSel((prev: any) =>
          info ? info : prev ? { ...prev, atStop: true } : prev,
        );
      if (follow.current && selKey.current) {
        const p = posMap.get(selKey.current);
        if (p) m.easeTo({ center: p, duration: 400, easing: (t) => t });
      }
    }
    animRef.current = animate;

    m.on("load", () => {
      fetch("/data/germany.json")
        .then((r) => r.json())
        .then((g) => {
          polys.current = buildPolys(g);
          refreshStations();
        })
        .catch(() => undefined);
      fetchTrains();
      m.on("click", (e) => {
        const hit = m.queryRenderedFeatures(e.point, {
          layers: ["train-hit"],
        })[0];
        const key = (hit?.properties as any)?.key || "";
        if (key) {
          selectTrain(key, false);
          return;
        }
        const sh = m.queryRenderedFeatures(e.point, {
          layers: ["station-hit"],
        })[0];
        if (sh) {
          const pr: any = sh.properties;
          const c: any = (sh.geometry as any).coordinates;
          openStation(
            { name: pr.name, id: pr.id, lon: c[0], lat: c[1] },
            false,
          );
          return;
        }
        setStn(null);
        clearSel();
      });
      m.on(
        "mouseenter",
        "station-hit",
        () => (m.getCanvas().style.cursor = "pointer"),
      );
      m.on(
        "mouseleave",
        "station-hit",
        () => (m.getCanvas().style.cursor = ""),
      );
      m.on("dragstart", () => setFollowOn(false));
      m.on(
        "mouseenter",
        "train-hit",
        () => (m.getCanvas().style.cursor = "pointer"),
      );
      m.on("mouseleave", "train-hit", () => (m.getCanvas().style.cursor = ""));
    });

    const poll = window.setInterval(fetchTrains, 30_000);
    const tick = window.setInterval(() => m.isStyleLoaded() && animate(), 400);
    const onFs = () => {
      if (!document.fullscreenElement) setWall(false);
    };
    document.addEventListener("fullscreenchange", onFs);

    return () => {
      disposed = true;
      window.clearInterval(poll);
      window.clearInterval(tick);
      document.removeEventListener("fullscreenchange", onFs);
      refreshStnRef.current = () => undefined;
      m.remove();
      if (map.current === m) map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!stn?.id) return;
    loadDepartures(stn.id, stnArrive);
    const t = window.setInterval(
      () => loadDepartures(stn.id, stnArrive),
      30_000,
    );
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stn?.id, stnArrive]);

  useEffect(() => {
    const m = map.current;
    if (!m || !m.getLayer("city-labels")) return;
    m.setLayoutProperty(
      "city-labels",
      "visibility",
      cityNames ? "visible" : "none",
    );
  }, [cityNames]);

  useEffect(() => {
    const m = map.current;
    if (!m || !m.getLayer("station-dots")) return;
    const v = stationsOn ? "visible" : "none";
    ["station-dots", "station-labels", "station-hit"].forEach((l) =>
      m.setLayoutProperty(l, "visibility", v),
    );
  }, [stationsOn]);

  useEffect(() => {
    const m = map.current;
    if (!m || !m.getLayer("starfield")) return;
    m.setLayoutProperty(
      "starfield",
      "visibility",
      cmode === "stars" ? "visible" : "none",
    );
  }, [cmode]);

  useEffect(() => {
    const m = map.current;
    if (!m || !m.getLayer("train-labels")) return;
    m.setLayoutProperty(
      "train-labels",
      "visibility",
      names ? "visible" : "none",
    );
  }, [names]);

  useEffect(() => {
    const m = map.current;
    if (!m || !m.getLayer("network")) return;
    m.setLayoutProperty("network", "visibility", showNet ? "visible" : "none");
  }, [showNet]);

  function screenshot() {
    const m = map.current;
    if (!m) return;
    m.once("render", () => {
      const a = document.createElement("a");
      a.href = m.getCanvas().toDataURL("image/png");
      a.download = `germany-trains-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.png`;
      a.click();
    });
    m.triggerRepaint();
  }

  function toggleWall() {
    const next = !wall;
    setWall(next);
    try {
      if (next) document.documentElement.requestFullscreen?.();
      else if (document.fullscreenElement) document.exitFullscreen();
    } catch {}
  }

  async function copyLink() {
    if (!sel) return;
    const url = `${location.origin}${location.pathname}#train=${encodeURIComponent(sel.key)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  // ---------- UI ----------
  const card: React.CSSProperties = {
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 10,
    background: "rgba(7,14,24,0.9)",
    color: "#f4f7fb",
    fontSize: 13,
    lineHeight: 1.6,
  };
  const btn: React.CSSProperties = {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "#fff",
    borderRadius: 7,
    padding: "4px 9px",
    fontSize: 12,
    cursor: "pointer",
  };
  const btnOn: React.CSSProperties = {
    ...btn,
    background: "#fff",
    color: "#111",
  };
  const dot = (c: string): React.CSSProperties => ({
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: c,
    display: "inline-block",
  });
  const stale = stats.age > 180;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div ref={el} style={{ position: "absolute", inset: 0 }} />

      {wall && (
        <button
          style={{
            ...btn,
            position: "absolute",
            zIndex: 9,
            left: 12,
            bottom: 12,
            opacity: 0.5,
          }}
          onClick={toggleWall}
        >
          Show UI
        </button>
      )}

      {!wall && (
        <>
          {/* ---- left: legend, filters, tools ---- */}
          <div
            style={{
              ...card,
              position: "absolute",
              zIndex: 5,
              top: 16,
              left: 16,
              padding: "10px 14px",
              width: 250,
              maxHeight: "calc(100vh - 250px)",
              overflowY: "auto",
            }}
          >
            <strong>Germany · live trains</strong>
            <div>
              <b>{stats.total}</b> running · {status}
            </div>
            {stale && (
              <div style={{ color: "#ffb36b", fontSize: 12 }}>
                ⚠ data is {Math.round(stats.age / 60)} min old, feed may be down
              </div>
            )}

            <div style={{ marginTop: 6 }}>
              {(Object.keys(LABELS) as Cls[]).map((c) => (
                <label
                  key={c}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={filters[c]}
                    onChange={(e) =>
                      setFilters({ ...filters, [c]: e.target.checked })
                    }
                  />
                  {cmode === "type" && <span style={dot(PAL[CLS_PK[c]])} />}
                  {LABELS[c]}{" "}
                  <span style={{ opacity: 0.55 }}>({stats[c]})</span>
                </label>
              ))}
            </div>

            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 5,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span style={{ opacity: 0.7 }}>Color by</span>
              {(["type", "delay", "speed", "stars"] as ColorMode[]).map((c) => (
                <button
                  key={c}
                  style={cmode === c ? btnOn : btn}
                  onClick={() => setCmode(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            {LEGENDS[cmode].length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "2px 10px",
                  marginTop: 4,
                  fontSize: 12,
                }}
              >
                {LEGENDS[cmode].map(([k, t]) => (
                  <span
                    key={t}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span style={dot(PAL[k])} />
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div style={{ marginTop: 8 }}>
              Only trains late by ≥ <b>{minD}</b> min
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={minD}
                onChange={(e) => setMinD(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <label style={{ display: "block", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={names}
                onChange={(e) => setNames(e.target.checked)}
              />{" "}
              train names (zoom in)
            </label>
            <label style={{ display: "block", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showNet}
                onChange={(e) => setShowNet(e.target.checked)}
              />{" "}
              rail network lines
            </label>
            <label style={{ display: "block", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={cityNames}
                onChange={(e) => setCityNames(e.target.checked)}
              />{" "}
              city names
            </label>
            <label style={{ display: "block", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={stationsOn}
                onChange={(e) => setStationsOn(e.target.checked)}
              />{" "}
              stations (Bahnhöfe, zoom in)
            </label>
            <label style={{ display: "block", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={germanyOnly}
                onChange={(e) => setGermanyOnly(e.target.checked)}
              />{" "}
              Germany only (hide foreign trains)
            </label>

            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button
                style={btn}
                onClick={() => {
                  setCmode("stars");
                  setCityNames(false);
                  setShowNet(false);
                  setStationsOn(false);
                  setNames(false);
                }}
              >
                ✨ Night sky
              </button>
              <button style={btn} onClick={screenshot}>
                📷 PNG
              </button>
              <button style={btn} onClick={toggleWall}>
                ⛶ Wall mode
              </button>
            </div>
            <div style={{ opacity: 0.55, fontSize: 11, marginTop: 6 }}>
              Tail = where it came from, longer = faster · click a train for
              details
            </div>
          </div>

          {/* ---- top center: search ---- */}
          <div
            style={{
              position: "absolute",
              zIndex: 6,
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(380px, 40vw)",
            }}
          >
            <input
              value={query}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search train (ICE 599, RE5) or station (Hannover)"
              style={{
                ...card,
                width: "100%",
                padding: "10px 14px",
                outline: "none",
                fontSize: 14,
              }}
            />
            {hits.length > 0 && (
              <div style={{ ...card, marginTop: 4, overflow: "hidden" }}>
                {hits.map((h, i) => (
                  <div
                    key={i}
                    onClick={() =>
                      h.kind === "train"
                        ? selectTrain(h.key, true)
                        : openStation(
                            { name: h.name, id: h.id, lon: h.lon, lat: h.lat },
                            true,
                          )
                    }
                    style={{
                      padding: "7px 14px",
                      cursor: "pointer",
                      borderTop: i
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "none",
                    }}
                  >
                    {h.kind === "train" ? (
                      <>
                        🚆 <b>{h.name}</b> → {h.to || "?"}{" "}
                        <span style={{ opacity: 0.6 }}>{h.arr}</span>
                      </>
                    ) : (
                      <>
                        📍 <b>{h.name}</b>{" "}
                        <span style={{ opacity: 0.6 }}>
                          · station{h.n ? `, ${h.n} trains heading there` : ""}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            {stationName && (
              <div
                style={{
                  ...card,
                  marginTop: 6,
                  padding: "6px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  Trains heading to <b>{stationName}</b>
                </span>
                <button
                  style={btn}
                  onClick={() => {
                    station.current = "";
                    setStationName("");
                  }}
                >
                  clear
                </button>
              </div>
            )}
          </div>

          {/* ---- bottom left: most delayed ---- */}
          {stats.late.length > 0 && (
            <div
              style={{
                ...card,
                position: "absolute",
                zIndex: 5,
                left: 16,
                bottom: 28,
                padding: "8px 12px",
                width: 250,
              }}
            >
              <b>Most delayed right now</b>
              {stats.late.map((l: any) => (
                <div
                  key={l.key}
                  onClick={() => selectTrain(l.key, true)}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {l.name} → {l.to || "?"}
                  </span>
                  <b style={{ color: "#ff8a8a" }}>+{l.delay}</b>
                </div>
              ))}
            </div>
          )}

          {/* ---- top right: selected station (schedule) ---- */}
          {stn && (
            <div
              style={{
                ...card,
                position: "absolute",
                zIndex: 6,
                top: 16,
                right: 16,
                width: 330,
                padding: "14px 16px",
                background: "rgba(7,14,24,0.95)",
                maxHeight: "calc(100vh - 60px)",
                overflowY: "auto",
              }}
            >
              <button
                onClick={() => setStn(null)}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 10,
                  background: "none",
                  border: 0,
                  color: "#fff",
                  fontSize: 20,
                  cursor: "pointer",
                }}
                aria-label="Close"
              >
                ×
              </button>
              <div
                style={{
                  fontSize: 11,
                  color: "#9fe8ff",
                  letterSpacing: "0.12em",
                }}
              >
                BAHNHOF
              </div>
              <b style={{ fontSize: 18 }}>{stn.name}</b>
              <div style={{ display: "flex", gap: 6, margin: "8px 0" }}>
                <button
                  style={!stnArrive ? btnOn : btn}
                  onClick={() => setStnArrive(false)}
                >
                  Departures
                </button>
                <button
                  style={stnArrive ? btnOn : btn}
                  onClick={() => setStnArrive(true)}
                >
                  Arrivals
                </button>
                <button
                  style={btn}
                  onClick={() => {
                    station.current = stn.name;
                    setStationName(stn.name);
                    animRef.current();
                  }}
                >
                  Trains heading here
                </button>
              </div>
              {stn.loading && (
                <div style={{ opacity: 0.6 }}>loading schedule…</div>
              )}
              {!stn.loading && stn.error && (
                <div style={{ color: "#ffb36b" }}>{stn.error}</div>
              )}
              {!stn.loading && !stn.error && stn.rows.length === 0 && (
                <div style={{ opacity: 0.6 }}>no upcoming trains found</div>
              )}
              {stn.rows.map((r: any, i: number) => {
                const late =
                  r.time && r.sched
                    ? Math.round((r.time - r.sched) / 60000)
                    : 0;
                const live = posByKey.current.has(r.tripId);
                return (
                  <div
                    key={i}
                    onClick={() => live && selectTrain(r.tripId, true)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "52px 1fr auto",
                      gap: 8,
                      padding: "5px 0",
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      cursor: live ? "pointer" : "default",
                      opacity: r.cancelled ? 0.5 : 1,
                    }}
                  >
                    <span>
                      <b
                        style={{
                          textDecoration: r.cancelled ? "line-through" : "none",
                        }}
                      >
                        {r.time ? fmtTime(r.time) : "--:--"}
                      </b>
                      {late >= 1 && (
                        <div style={{ color: "#ff8a8a", fontSize: 11 }}>
                          +{late}
                        </div>
                      )}
                    </span>
                    <span style={{ overflow: "hidden" }}>
                      <b>{r.line}</b> {stnArrive ? "from" : "→"}{" "}
                      {stnArrive ? r.from : r.to}
                      {r.cancelled && (
                        <span style={{ color: "#ff8a8a" }}> · cancelled</span>
                      )}
                      {live && (
                        <span style={{ color: "#7dff9a" }}> · on map</span>
                      )}
                    </span>
                    <span style={{ opacity: 0.7 }}>
                      {r.track ? `Gl. ${r.track}` : ""}
                    </span>
                  </div>
                );
              })}
              <div style={{ opacity: 0.5, fontSize: 11, marginTop: 8 }}>
                Click a row marked “on map” to jump to that train
              </div>
            </div>
          )}

          {/* ---- top right: selected train ---- */}
          {sel && !stn && (
            <div
              style={{
                ...card,
                position: "absolute",
                zIndex: 6,
                top: 16,
                right: 16,
                width: 300,
                padding: "14px 16px",
                background: "rgba(7,14,24,0.95)",
              }}
            >
              <button
                onClick={clearSel}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 10,
                  background: "none",
                  border: 0,
                  color: "#fff",
                  fontSize: 20,
                  cursor: "pointer",
                }}
                aria-label="Close"
              >
                ×
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{ ...dot(PAL[sel.pk as PK]), width: 11, height: 11 }}
                />
                <b style={{ fontSize: 20 }}>{sel.name}</b>
              </div>
              <div style={{ opacity: 0.65, marginBottom: 8 }}>
                {LABELS[sel.cls as Cls]}
              </div>

              <div
                style={{
                  marginBottom: 8,
                  color: sel.delay >= 1 ? "#ff8a8a" : "#7dff9a",
                  fontWeight: 600,
                }}
              >
                {sel.delay >= 1 ? `+${sel.delay} min late` : "on time"}
              </div>

              {sel.head && (
                <div>
                  Final destination: <b>{sel.head}</b>
                </div>
              )}
              <div>
                Next stop: <b>{sel.to || "?"}</b>
              </div>
              <div>
                Arrives: <b>{sel.arr}</b>{" "}
                <span style={{ opacity: 0.6 }}>(scheduled {sel.sarr})</span>
              </div>
              <div>
                In:{" "}
                <b>
                  {sel.atStop ? "at a stop / waiting for next leg" : sel.left}
                </b>
              </div>
              <div style={{ marginTop: 6 }}>
                Last stop: <b>{sel.from || "?"}</b>{" "}
                <span style={{ opacity: 0.6 }}>(left {sel.dep})</span>
              </div>

              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.12)",
                  margin: "10px 0 4px",
                }}
              >
                <div
                  style={{
                    width: `${sel.pct}%`,
                    height: "100%",
                    borderRadius: 3,
                    background: PAL[sel.pk as PK],
                  }}
                />
              </div>
              <div style={{ opacity: 0.65, fontSize: 12 }}>
                {sel.pct}% of the way to the next stop
              </div>

              <div style={{ marginTop: 8 }}>
                Speed: <b>{sel.kmh} km/h</b>
              </div>
              <div>
                Heading: <b>{sel.dir}</b>
              </div>
              <div>
                Position: <b>{sel.near}</b>
              </div>
              <div style={{ opacity: 0.6, fontSize: 12 }}>
                {sel.lat}, {sel.lon}
              </div>

              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button
                  style={followOn ? btnOn : btn}
                  onClick={() => setFollowOn(!followOn)}
                >
                  {followOn ? "● Following" : "Follow"}
                </button>
                <button style={btn} onClick={copyLink}>
                  {copied ? "Copied ✓" : "Copy link"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
