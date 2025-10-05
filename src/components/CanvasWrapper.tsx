"use client";

import React, { Suspense, useMemo } from "react";
import dynamic from "next/dynamic";
import { Html, OrbitControls } from "@react-three/drei";

const Canvas = dynamic(() => import("@react-three/fiber").then(m => m.Canvas), {
  ssr: false,
});

type CanvasWrapperProps = {
  children: React.ReactNode;
};

function Loader() {
  return (
    <Html center>
      <div
        style={{
          padding: "8px 12px",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          borderRadius: 8,
          fontSize: 14,
        }}
        role="status"
        aria-live="polite"
      >
        Loading the galaxy…
      </div>
    </Html>
  );
}

export default function CanvasWrapper({ children }: CanvasWrapperProps) {
  const dpr = useMemo(() => [1, Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio : 1)], []);

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      dpr={dpr as unknown as number | [number, number]}
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100dvh" }}
    >
      <color attach="background" args={["#030311"]} />
      <Suspense fallback={<Loader />}>{children}</Suspense>
      <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.2} />
    </Canvas>
  );
}


