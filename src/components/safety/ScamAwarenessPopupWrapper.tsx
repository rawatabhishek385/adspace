"use client";

import dynamic from "next/dynamic";

const ScamAwarenessPopup = dynamic(() => import("./ScamAwarenessPopup"), { ssr: false });

export default function ScamAwarenessPopupWrapper() {
  return <ScamAwarenessPopup />;
}
