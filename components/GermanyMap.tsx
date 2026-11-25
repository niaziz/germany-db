"use client";

import dynamic from "next/dynamic";

// MapLibre needs the browser, so load it client-side only.
const GermanyDark = dynamic(() => import("./GermanyDark"), { ssr: false });

export default function GermanyMap() {
  return <GermanyDark />;
}
