"use client";

import React, { useMemo } from "react";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import ParticleHeart from "@/components/ParticleHeart";
import ShootingStars from "@/components/ShootingStars";
import Lantern from "@/components/Lantern";
import Bunny from "@/components/Bunny";
import StarsField from "@/components/StarsField";

export default function Scene() {
  const lanterns = useMemo(
    () => [
      { radius: 2.2, speed: 0.6, color: "#ffd6e8", phase: 0 },
      { radius: 2.8, speed: 0.45, color: "#d6f0ff", phase: 1.2 },
      { radius: 3.4, speed: 0.38, color: "#e6ffd6", phase: 2.1 },
      { radius: 4.0, speed: 0.33, color: "#ffe3b3", phase: 0.7 },
    ],
    []
  );

  return (
    <>
      <ambientLight intensity={0.15} />
      <StarsField density={5000} />
      <ShootingStars count={32} area={{ width: 14, height: 8, depth: 6 }} speed={[7, 12]} color="#fff" spawnInterval={0.5} />
      <group>
        <ParticleHeart count={1200} />
        {/* {lanterns.map((l, i) => (
          i % 2 === 0 ? (
            <Lantern key={`lantern-${i}`} radius={l.radius} speed={l.speed} color={l.color} phase={l.phase} />
          ) : (
            <Bunny key={`bunny-${i}`} radius={l.radius} speed={l.speed} phase={l.phase} />
          )
        ))} */}
      </group>
      <EffectComposer>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.35}
          luminanceSmoothing={0.15}
          blendFunction={BlendFunction.SCREEN}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}


