"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import React from "react";
import CanvasWrapper from "@/components/CanvasWrapper";

const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen">
      <noscript>
        <div style={{ textAlign: "center", padding: 24 }}>
          <Image src="/assets/fallback.png" width={480} height={480} alt="Heart Galaxy — Mid-Autumn Gift" style={{ maxWidth: 480, width: "90%" }} />
          <p>JavaScript is disabled. Enable it to see the interactive galaxy.</p>
        </div>
      </noscript>
      <CanvasWrapper>
        {/* 3D Scene */}
        <Scene />
      </CanvasWrapper>
    </main>
  );
}
