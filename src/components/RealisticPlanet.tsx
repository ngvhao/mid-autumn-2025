"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useLoader } from "@react-three/fiber";

export type RealisticPlanetProps = {
  position?: [number, number, number];
  radius?: number;
  rotationSpeed?: number; // radians per second
  textureUrl?: string; // albedo/color map
  lightDirection?: [number, number, number]; // world-space approximate sun dir
};

export default function RealisticPlanet({
  position = [4, 2, -2],
  radius = 0.9,
  rotationSpeed = 0.05,
  textureUrl = "/assets/moon.jpg",
  lightDirection = [-1, 0.4, 0.2],
}: RealisticPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const colorMap = useLoader(THREE.TextureLoader, textureUrl);
  colorMap.anisotropy = 4;
  colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;

  // Simple physically-inspired shading using MeshStandardMaterial + subtle rim light via env/light
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    map: colorMap,
    roughness: 0.8,
    metalness: 0.0,
  }), [colorMap]);

  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const lightDir = useMemo(() => new THREE.Vector3(...lightDirection).normalize(), [lightDirection]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed * delta;
    }
    // Keep the directional light pointed from the desired direction
    if (dirLightRef.current) {
      const targetPos = new THREE.Vector3().fromArray(position);
      dirLightRef.current.position.copy(targetPos.clone().add(lightDir.clone().multiplyScalar(10)));
      dirLightRef.current.target.position.copy(targetPos);
      dirLightRef.current.target.updateMatrixWorld();
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <primitive object={material} attach="material" />
      </mesh>
      {/* Key light approximating the sun direction */}
      <directionalLight ref={dirLightRef} intensity={1.2} color={0xffffff} />
      {/* Fill + rim sensation via faint back light */}
      <directionalLight intensity={0.15} color={0x88aaff} position={[0, 0, 3]} />
      <ambientLight intensity={0.06} />
    </group>
  );
}


