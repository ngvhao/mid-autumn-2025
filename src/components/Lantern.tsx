"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type LanternProps = {
  radius: number;
  speed: number; // angular speed multiplier
  color?: string;
  textureUrl?: string;
  phase?: number; // starting angle
};

export default function Lantern({ radius, speed, color = "#ffd6e8", textureUrl = "/assets/lantern.png", phase = 0 }: LanternProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const ref = useRef<THREE.Mesh>(null);
  const emissiveColor = useMemo(() => new THREE.Color(color), [color]);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (tex) => {
        if (!cancelled) {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          setTexture(tex);
        }
      },
      undefined,
      () => {
        if (!cancelled) setTexture(null);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [textureUrl]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed + phase;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    const y = Math.sin(t * 2) * 0.25; // subtle bobbing
    if (ref.current) {
      ref.current.position.set(x, y, z);
      // Billboard to camera so the plane always faces viewer
      ref.current.lookAt(state.camera.position);
    }
  });

  return (
    <group>
      <mesh ref={ref} castShadow>
        <planeGeometry args={[0.5, 0.7]} />
        <meshStandardMaterial
          color={"#ffffff"}
          emissive={emissiveColor}
          emissiveIntensity={0.7}
          map={texture ?? undefined}
          transparent
          alphaTest={0.05}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <pointLight color={color} intensity={0.35} distance={2.5} decay={2} />
    </group>
  );
}


