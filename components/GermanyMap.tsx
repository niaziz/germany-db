"use client";

import dynamic from "next/dynamic";

// MapLibre needs the browser, so load it client-side only.
const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function GermanyMap() {
  return <MapView />;
}
