"use client";

import React, { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { a, useSpring } from "@react-spring/three";

export type HeartProps = {
  color?: string;
  emissive?: string;
  bpm?: number; // beats per minute
  amplitude?: number; // scale amplitude
  onBeat?: () => void;
};

function createHeartGeometry(): THREE.ExtrudeGeometry {
  // Heart 2D shape from param eqn, then extruded
  const x = (t: number) => 16 * Math.pow(Math.sin(t), 3);
  const y = (t: number) =>
    13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

  const shape = new THREE.Shape();
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const px = x(t) / 18; // scale down
    const py = y(t) / 18;
    if (i === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.5,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.05,
    bevelSegments: 2,
    steps: 1,
  });
  geo.center();
  return geo;
}

export default function Heart({
  color = "#ff4d6d",
  emissive = "#ff85a1",
  bpm = 72,
  amplitude = 0.1,
  onBeat,
}: HeartProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => createHeartGeometry(), []);
  const [pulse, setPulse] = useState(0);

  const { pulseScale } = useSpring({
    pulseScale: pulse,
    config: { tension: 180, friction: 12 },
    onRest: () => setPulse(0),
  });

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const beat = 1 + Math.sin((t * bpm * Math.PI) / 30) * amplitude; // bpm to rad/s
    const extra = 1 + pulseScale.get() * 0.25; // click pulse boost
    const scale = beat * extra;
    if (meshRef.current) {
      meshRef.current.scale.setScalar(scale);
      meshRef.current.rotation.y += delta * 0.2;
    }
    if (onBeat && Math.sin((t * bpm * Math.PI) / 30) > 0.99) onBeat();
  });

  return (
    <a.mesh
      ref={meshRef}
      onClick={() => setPulse(1)}
      castShadow
      receiveShadow
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={1.2}
        roughness={0.4}
        metalness={0.1}
        toneMapped={false}
      />
    </a.mesh>
  );
}


