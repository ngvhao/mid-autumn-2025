"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export type ShootingStarsProps = {
  count?: number;
  area?: { width: number; height: number; depth: number };
  speed?: [number, number]; // min/max units/sec
  color?: string; // fallback tint
  spawnInterval?: number; // seconds between spawns
};

type Star = {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
  color: THREE.Color;
};

export default function ShootingStars({
  count = 12,
  area = { width: 12, height: 6, depth: 6 },
  speed = [2.0, 5.0],
  color = "#ffdcea",
  spawnInterval = 0.8,
}: ShootingStarsProps) {
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const headsGeomRef = useRef<THREE.BufferGeometry>(null);
  const headsMatRef = useRef<THREE.PointsMaterial>(null);

  const stars = useMemo<Star[]>(() => {
    const arr: Star[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0,
        active: false,
        color: new THREE.Color(color),
      });
    }
    return arr;
  }, [count, color]);

  const trailSegments = 5; // number of line segments per star for tapered trail
  const positions = useMemo(() => new Float32Array(count * trailSegments * 2 * 3), [count]); // multi segments
  const headPositions = useMemo(() => new Float32Array(count * 3), [count]);
  const colors = useMemo(() => new Float32Array(count * trailSegments * 2 * 3), [count]);
  const headColors = useMemo(() => new Float32Array(count * 3), [count]);

  const palette = useMemo(
    () => ["#ffffff", "#ffd6e8", "#d6f0ff", "#e6ffd6", "#ffe3b3", "#c6b6ff"].map((c) => new THREE.Color(c)),
    []
  );

  const spawnTimeRef = useRef(0);
  const didInitialSpawnRef = useRef(false);

  function respawnStar(s: Star) {
    // spawn near the top-right, move diagonally down-left
    const { width, height, depth } = area;
    const x = (Math.random() * 0.4 + 0.6) * width - width / 2; // right area
    const y = (Math.random() * 0.4 + 0.3) * height - height / 2; // upper area
    const z = (Math.random() * depth) - depth / 2;
    s.position.set(x, y, z);
    const sp = THREE.MathUtils.lerp(speed[0], speed[1], Math.random());
    s.velocity.set(-sp, -sp * 0.4, 0);
    s.maxLife = THREE.MathUtils.lerp(0.6, 1.3, Math.random());
    s.life = s.maxLife;
    s.active = true;
    s.color = palette[Math.floor(Math.random() * palette.length)].clone();
  }

  useFrame((_, delta) => {
    spawnTimeRef.current += delta;
    const activeCount = stars.reduce((n, s) => n + (s.active ? 1 : 0), 0);
    // Initial burst to ensure visibility right away
    if (!didInitialSpawnRef.current) {
      let initial = Math.min(6, stars.filter(s => !s.active).length);
      while (initial-- > 0) {
        const s = stars.find(st => !st.active);
        if (!s) break;
        respawnStar(s);
      }
      didInitialSpawnRef.current = true;
    }
    let toSpawn = Math.floor(spawnTimeRef.current / spawnInterval);
    if (activeCount === 0 && spawnTimeRef.current > 0.1) toSpawn = Math.max(1, toSpawn);
    while (toSpawn > 0) {
      const s = stars.find(st => !st.active);
      if (!s) break;
      respawnStar(s);
      spawnTimeRef.current -= spawnInterval;
      toSpawn--;
    }

    // update active stars
    const FAR = 1e6;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      if (!s.active) {
        // clear all segments
        for (let seg = 0; seg < trailSegments; seg++) {
          const base = (i * trailSegments + seg) * 2 * 3;
          positions[base] = FAR; positions[base + 1] = FAR; positions[base + 2] = FAR;
          positions[base + 3] = FAR; positions[base + 4] = FAR; positions[base + 5] = FAR;
        }
        headPositions[i * 3] = FAR; headPositions[i * 3 + 1] = FAR; headPositions[i * 3 + 2] = FAR;
        continue;
      }
      s.life -= delta;
      if (s.life <= 0) {
        s.active = false;
        for (let seg = 0; seg < trailSegments; seg++) {
          const base = (i * trailSegments + seg) * 2 * 3;
          positions[base] = FAR; positions[base + 1] = FAR; positions[base + 2] = FAR;
          positions[base + 3] = FAR; positions[base + 4] = FAR; positions[base + 5] = FAR;
        }
        headPositions[i * 3] = FAR; headPositions[i * 3 + 1] = FAR; headPositions[i * 3 + 2] = FAR;
        continue;
      }
      s.position.addScaledVector(s.velocity, delta);
      const dir = s.velocity.clone().normalize();
      const totalTrail = 1.6; // overall length (longer, more visible)
      // head
      headPositions[i * 3] = s.position.x;
      headPositions[i * 3 + 1] = s.position.y;
      headPositions[i * 3 + 2] = s.position.z;
      // head color
      headColors[i * 3] = s.color.r;
      headColors[i * 3 + 1] = s.color.g;
      headColors[i * 3 + 2] = s.color.b;
      // tapered segments
      for (let seg = 0; seg < trailSegments; seg++) {
        const t0 = seg / trailSegments;
        const t1 = (seg + 1) / trailSegments;
        const len0 = totalTrail * (1.0 - t0);
        const len1 = totalTrail * (1.0 - t1);
        const p0 = s.position.clone().addScaledVector(dir, -len0);
        const p1 = s.position.clone().addScaledVector(dir, -len1);
        const base = (i * trailSegments + seg) * 2 * 3;
        positions[base] = p0.x; positions[base + 1] = p0.y; positions[base + 2] = p0.z;
        positions[base + 3] = p1.x; positions[base + 4] = p1.y; positions[base + 5] = p1.z;
        // color fades along trail
        const fade = Math.pow(1.0 - t0, 1.5);
        const r = s.color.r * fade;
        const g = s.color.g * fade;
        const b = s.color.b * fade;
        colors[base] = r; colors[base + 1] = g; colors[base + 2] = b;
        colors[base + 3] = r * 0.7; colors[base + 4] = g * 0.7; colors[base + 5] = b * 0.7;
      }
    }
    (geomRef.current?.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (headsGeomRef.current?.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geomRef.current?.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (headsGeomRef.current?.attributes.color as THREE.BufferAttribute).needsUpdate = true;

    if (materialRef.current) {
      // flicker based on average remaining life
      const active = stars.filter(s => s.active);
      const avgLife = active.length ? active.reduce((a, s) => a + s.life / s.maxLife, 0) / active.length : 0;
      materialRef.current.opacity = 0.55 + 0.35 * avgLife;
      materialRef.current.transparent = true;
      materialRef.current.needsUpdate = true;
    }
  });

  // Head glow texture
  const headCanvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    if (ctx) {
      const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, "rgba(255,255,255,1)");
      grd.addColorStop(0.4, "rgba(255,220,234,0.8)");
      grd.addColorStop(1, "rgba(255,220,234,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 128, 128);
    }
    return c;
  }, []);
  const headTex = useMemo(() => new THREE.CanvasTexture(headCanvas), [headCanvas]);

  return (
    <group>
      <lineSegments>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} count={colors.length / 3} array={colors} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial ref={materialRef} vertexColors transparent opacity={0.8} blending={THREE.AdditiveBlending} toneMapped={false} />
      </lineSegments>
      <points>
        <bufferGeometry ref={headsGeomRef}>
          <bufferAttribute attach="attributes-position" args={[headPositions, 3]} count={headPositions.length / 3} array={headPositions} itemSize={3} />
          <bufferAttribute attach="attributes-color" args={[headColors, 3]} count={headColors.length / 3} array={headColors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial ref={headsMatRef} size={0.28} sizeAttenuation map={headTex} vertexColors transparent opacity={0.98} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
    </group>
  );
}


