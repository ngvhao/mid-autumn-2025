"use client";

import React, { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type BunnyProps = {
  radius: number;
  speed: number;
  scale?: number;
  phase?: number;
  color?: string;
};

export default function Bunny({ radius, speed, scale = 0.6, phase = 0, color = "#ffffff" }: BunnyProps) {
  const ref = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.load(
      "/assets/bunny.glb",
      (gltf) => {
        if (cancelled) return;
        const group = gltf.scene || gltf.scenes?.[0] || null;
        if (group) {
          group.traverse((obj) => {
            const m = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
            if (m && "emissive" in m) {
              m.emissive = new THREE.Color(color);
              m.emissiveIntensity = 0.3;
            }
          });
          setModel(group);
          setFailed(false);
        } else {
          setFailed(true);
        }
      },
      undefined,
      () => {
        if (cancelled) return;
        setFailed(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [color]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed + phase;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    const y = Math.sin(t * 2) * 0.25;
    if (ref.current) {
      ref.current.position.set(x, y, z);
      ref.current.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={ref}>
      {model && <primitive object={model} scale={scale} />}
      {!model && (
        <mesh>
          <planeGeometry args={[0.6, 0.8]} />
          <meshStandardMaterial color={"#ffffff"} emissive={new THREE.Color(color)} emissiveIntensity={0.5} transparent opacity={0.85} />
        </mesh>
      )}
      <pointLight color={color} intensity={0.25} distance={1.8} decay={2} />
    </group>
  );
}



