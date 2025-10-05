"use client";

import React, { useMemo } from "react";
import { Stars } from "@react-three/drei";

export type StarsFieldProps = {
  density?: number;
};

export default function StarsField({ density = 2000 }: StarsFieldProps) {
  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia && window.matchMedia("(max-width: 640px)").matches;
  }, []);

  const count = isMobile ? Math.max(500, Math.floor(density * 0.3)) : density;

  return <Stars radius={100} depth={50} count={count} factor={3} saturation={0} fade speed={0.8} />;
}


