"use client";

import React from "react";

export default function FallbackImage() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "#030311" }}>
      <img src="/assets/fallback.png" alt="Heart Galaxy — static" style={{ maxWidth: 480, width: "90%" }} />
    </div>
  );
}


