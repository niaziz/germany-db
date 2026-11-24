"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import maplibregl, { type Map, type StyleSpecification } from "maplibre-gl";

const style: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    day: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 12,
      attribution: "Imagery: Esri, Maxar, Earthstar Geographics",
    },
    night: {
      type: "raster",
      tiles: [
        "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png",
      ],
      tileSize: 256,
      maxzoom: 8,
      attribution: "Night lights: NASA GIBS / VIIRS Black Marble",
    },
    dem: {
      type: "raster-dem",
      tiles: [
        "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
      ],
      encoding: "terrarium",
      tileSize: 256,
      maxzoom: 10,
      attribution: "Terrain: Mapzen / AWS",
    },
    countries: {
      type: "geojson",
      data: "/data/countries.geojson",
    },
    places: {
      type: "geojson",
      data: "/data/places.geojson",
    },
    liveTrains: {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#06101d" },
    },
    {
      id: "day",
      type: "raster",
      source: "day",
      paint: {
        "raster-saturation": -0.12,
        "raster-contrast": 0.08,
        "raster-opacity": 1,
        "raster-resampling": "linear",
        "raster-fade-duration": 0,
      },
    },
    {
      id: "night",
      type: "raster",
      source: "night",
      paint: {
        "raster-saturation": 0.15,
        "raster-brightness-min": 0.08,
        "raster-brightness-max": 0.88,
        "raster-opacity": 0,
        "raster-resampling": "linear",
        "raster-fade-duration": 0,
      },
    },
    {
      id: "country-borders",
      type: "line",
      source: "countries",
      layout: {
        "line-cap": "round",
        "line-join": "round",
        visibility: "none",
      },
      paint: {
        "line-color": "#ffffff",
        "line-width": 1.2,
        "line-opacity": 0.8,
      },
    },
    {
      id: "country-labels",
      type: "symbol",
      source: "countries",
      layout: {
        "text-field": ["get", "NAME_EN"],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 2, 8, 5, 11, 8, 14],
        "text-transform": "uppercase",
        "text-letter-spacing": 0.08,
        "text-max-width": 8,
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#f2f5f7",
        "text-halo-color": "rgba(5, 12, 20, 0.85)",
        "text-halo-width": 1,
      },
    },
    {
      id: "place-dots",
      type: "circle",
      source: "places",
      minzoom: 3,
      filter: [">=", ["get", "POP_MAX"], 100000],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 1.2, 8, 3],
        "circle-color": "#ffffff",
        "circle-opacity": 0.9,
        "circle-stroke-color": "rgba(5, 12, 20, 0.8)",
        "circle-stroke-width": 0.5,
      },
    },
    {
      id: "place-labels",
      type: "symbol",
      source: "places",
      minzoom: 3,
      filter: [">=", ["get", "POP_MAX"], 100000],
      layout: {
        "text-field": ["get", "NAME_EN"],
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 3, 8, 8, 12],
        "text-offset": [0, 0.8],
        "text-anchor": "top",
        "text-max-width": 10,
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(5, 12, 20, 0.9)",
        "text-halo-width": 1,
      },
    },
    {
      id: "town-place-dots",
      type: "circle",
      source: "places",
      minzoom: 7,
      filter: [">=", ["get", "POP_MAX"], 5000],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 1.2, 11, 2.5],
        "circle-color": "#ffffff",
        "circle-opacity": 0.85,
        "circle-stroke-color": "rgba(5, 12, 20, 0.9)",
        "circle-stroke-width": 0.6,
      },
    },
    {
      id: "town-place-labels",
      type: "symbol",
      source: "places",
      minzoom: 7,
      filter: [">=", ["get", "POP_MAX"], 5000],
      layout: {
        "text-field": ["get", "NAME_EN"],
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          7,
          8,
          11,
          11,
          14,
          13,
        ],
        "text-offset": [0, 0.75],
        "text-anchor": "top",
        "text-max-width": 12,
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(5, 12, 20, 0.95)",
        "text-halo-width": 1.2,
      },
    },
    {
      id: "small-place-dots",
      type: "circle",
      source: "places",
      minzoom: 9,
      filter: [">=", ["get", "POP_MAX"], 500],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 1.1, 14, 2.2],
        "circle-color": "#ffffff",
        "circle-opacity": 0.8,
        "circle-stroke-color": "rgba(5, 12, 20, 0.9)",
        "circle-stroke-width": 0.5,
      },
    },
    {
      id: "small-place-labels",
      type: "symbol",
      source: "places",
      minzoom: 9,
      filter: [">=", ["get", "POP_MAX"], 500],
      layout: {
        "text-field": ["get", "NAME_EN"],
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          9,
          8,
          12,
          11,
          14,
          12,
        ],
        "text-offset": [0, 0.7],
        "text-anchor": "top",
        "text-max-width": 12,
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(5, 12, 20, 0.95)",
        "text-halo-width": 1.2,
      },
    },
    {
      id: "train-dots",
      type: "circle",
      source: "liveTrains",
      layout: {},
      paint: {
        "circle-radius": 6,
        "circle-color": "#ffcc00",
        "circle-opacity": 0.8,
      },
    },
    {
      id: "train-dots-glow",
      type: "circle",
      source: "liveTrains",
      layout: {},
      paint: {
        "circle-radius": 8,
        "circle-color": "rgba(255, 204, 0, 0.6)",
        "circle-opacity": 1,
      },
    },
    {
      id: "live-train-glow",
      type: "circle",
      source: "liveTrains",
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          7,
          10,
          12,
          14,
          18,
        ],
        "circle-color": "#71b7ff",
        "circle-opacity": 0.18,
        "circle-blur": 0.85,
      },
    },
    {
      id: "live-train-dots",
      type: "circle",
      source: "liveTrains",
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          2.5,
          10,
          4.5,
          14,
          7,
        ],
        "circle-color": "#a8d4ff",
        "circle-opacity": 1,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1,
      },
    },
  ],
};

export default function MapView() {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const [mode, setMode] = useState<"day" | "night">("day");
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [bordersEnabled, setBordersEnabled] = useState(false);
  const [germanyView, setGermanyView] = useState(false);
  const [trainCount, setTrainCount] = useState(0);

  useEffect(() => {
    if (!el.current || map.current) return;

    const m = new maplibregl.Map({
      container: el.current,
      style,
      center: [10, 22],
      zoom: 1.55,
      pitch: 18,
      bearing: 0,
      minZoom: 1,
      maxZoom: 14,
      maxPitch: 65,
      renderWorldCopies: false,
      attributionControl: { compact: true },
    });

    m.on("load", () => {
      m.setProjection({ type: "globe" });

      const updateTerrain = () => {
        if (m.getZoom() >= 5) {
          m.setTerrain({ source: "dem", exaggeration: 1.15 });
        }
      };

      updateTerrain();
      m.on("zoomend", updateTerrain);
    });

    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !m.isStyleLoaded()) return;
    m.setPaintProperty("day", "raster-opacity", mode === "day" ? 1 : 0.18);
    m.setPaintProperty("night", "raster-opacity", mode === "night" ? 1 : 0);
    m.setPaintProperty(
      "background",
      "background-color",
      mode === "night" ? "#020713" : "#06101d",
    );
  }, [mode]);

  useEffect(() => {
    const m = map.current;
    if (!m || !m.isStyleLoaded() || !m.getLayer("country-borders")) return;

    m.setLayoutProperty(
      "country-borders",
      "visibility",
      bordersEnabled ? "visible" : "none",
    );
    m.setPaintProperty(
      "country-borders",
      "line-color",
      mode === "night" ? "#9fc8ff" : "#dce4e9",
    );
    m.setPaintProperty(
      "country-borders",
      "line-opacity",
      mode === "night" ? 0.62 : 0.48,
    );
  }, [bordersEnabled, mode]);

  useEffect(() => {
    if (!germanyView) return;

    let disposed = false;

    async function refreshTrains() {
      const m = map.current;
      if (!m || !m.isStyleLoaded()) return;

      try {
        const response = await fetch("/api/trains", { cache: "no-store" });
        if (!response.ok) throw new Error("Live train feed unavailable");
        const data = await response.json();
        if (disposed) return;

        const source = m.getSource("liveTrains") as
          | maplibregl.GeoJSONSource
          | undefined;
        source?.setData(data);
        setTrainCount(Array.isArray(data.features) ? data.features.length : 0);
      } catch {
        if (!disposed) setTrainCount(0);
      }
    }

    refreshTrains();
    const timer = window.setInterval(refreshTrains, 20_000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [germanyView]);

  function changeMode(next: "day" | "night") {
    setMode(next);
    const m = map.current;
    if (!m) return;
    m.easeTo({ pitch: next === "night" ? 24 : 18, duration: 600 });
  }

  function changeView(next: "world" | "germany") {
    const germany = next === "germany";
    setGermanyView(germany);
    setMode("night");

    const m = map.current;
    if (!m) return;

    if (germany) {
      m.setProjection({ type: "mercator" });
      m.flyTo({
        center: [10.45, 51.16],
        zoom: 5.8,
        pitch: 28,
        bearing: 0,
        duration: 1800,
      });
      m.setPaintProperty("background", "background-color", "#020713");
      m.setPaintProperty("night", "raster-opacity", 1);
    } else {
      m.setProjection({ type: "globe" });
      m.flyTo({
        center: [10, 22],
        zoom: 1.55,
        pitch: 18,
        bearing: 0,
        duration: 1800,
      });
    }
  }

  async function submitSearch(event: FormEvent) {
    event.preventDefault();
    const query = search.trim();
    if (!query) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } },
      );
      const results = await response.json();
      if (!results?.[0] || !map.current) return;

      const longitude = Number(results[0].lon);
      const latitude = Number(results[0].lat);
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 7,
        pitch: 42,
        bearing: 0,
        duration: 1600,
      });

      marker.current?.remove();
      marker.current = new maplibregl.Marker({
        color: mode === "night" ? "#70aef8" : "#f5c66a",
      })
        .setLngLat([longitude, latitude])
        .addTo(map.current);
    } finally {
      setSearching(false);
    }
  }

  function zoom(delta: number) {
    map.current?.easeTo({
      zoom: (map.current.getZoom() || 1) + delta,
      duration: 450,
    });
  }

  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 10,
          pitch: 55,
          duration: 1800,
        });
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className={germanyView ? "earth-shell germany-view" : "earth-shell"}>
      <div ref={el} className="map-canvas" />

      <header className="brand-bar">
        <div className="brand-mark" aria-hidden="true">
          <span />
        </div>
        <div>
          <strong>ORBIT</strong>
          <small>EARTH EXPLORER</small>
        </div>
      </header>

      <form className="search-box" onSubmit={submitSearch}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle
            cx="11"
            cy="11"
            r="6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="m16 16 4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search places"
          aria-label="Search places"
        />
        {searching && <span className="search-spinner" />}
      </form>

      <aside className="tool-rail" aria-label="Map tools">
        <button type="button" onClick={() => zoom(1)} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => zoom(-1)} aria-label="Zoom out">
          −
        </button>
        <span />
        <button type="button" onClick={locate} aria-label="Find my location">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="3.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            />
            <circle
              cx="12"
              cy="12"
              r="7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeDasharray="2 3"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() =>
            map.current?.easeTo({
              center: [10, 22],
              zoom: 1.55,
              pitch: 18,
              bearing: 0,
              duration: 1200,
            })
          }
          aria-label="Reset view"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2.8 20 7v10l-8 4.2L4 17V7l8-4.2Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="m4 7 8 4.3L20 7M12 11.3v10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
        <button
          type="button"
          className={bordersEnabled ? "active" : ""}
          onClick={() => setBordersEnabled((enabled) => !enabled)}
          aria-label={bordersEnabled ? "Hide borders" : "Show borders"}
          aria-pressed={bordersEnabled}
          title={bordersEnabled ? "Hide borders" : "Show borders"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M4.5 9.2c2.2 1.2 4.7 1.8 7.5 1.8 2.9 0 5.4-.6 7.5-1.8M4.5 14.8c2.1-1.2 4.6-1.8 7.5-1.8 2.8 0 5.3.6 7.5 1.8M12 4v16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
            />
          </svg>
        </button>
      </aside>

      <div className="mode-switch" role="group" aria-label="Map lighting">
        <button
          type="button"
          className={mode === "day" ? "active" : ""}
          onClick={() => changeMode("day")}
        >
          Day
        </button>
        <button
          type="button"
          className={mode === "night" ? "active" : ""}
          onClick={() => changeMode("night")}
        >
          Night
        </button>
      </div>

      <div className="view-switch" role="group" aria-label="Map view">
        <button
          type="button"
          className={!germanyView ? "active" : ""}
          onClick={() => changeView("world")}
        >
          World
        </button>
        <button
          type="button"
          className={germanyView ? "active" : ""}
          onClick={() => changeView("germany")}
        >
          Germany
        </button>
      </div>

      <div className="map-status">
        <span className="status-dot" />
        <span>
          {germanyView
            ? `${trainCount} LIVE TRAINS`
            : mode === "night"
              ? "NIGHT EARTH"
              : "SATELLITE"}
        </span>
      </div>
    </div>
  );
}
