"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export type ParticleHeartProps = {
  count?: number; // number of particles
  showLines?: boolean; // show connection lines
};

// Generates points distributed within and along a classic heart curve, then lifts to 3D with mild z jitter
function generateHeartPoints(num: number): Float32Array {
  const positions = new Float32Array(num * 3);

  // Classic parametric heart (unscaled):
  // x(t) = 16 sin^3 t, y(t) = 13 cos t - 5 cos 2t - 2 cos 3t - cos 4t, t ∈ [0, 2π]
  // Scale to roughly fit in [-1.6, 1.6]
  const scale = 0.1;
  const bulgeMax = 1.0; // maximum half-thickness at the core (center) for puffed volume

  for (let i = 0; i < num; i++) {
    const t = Math.random() * Math.PI * 2;

    // Point on the curve (rim)
    const rimX = (16 * Math.pow(Math.sin(t), 3)) * scale;
    const rimY = (
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)
    ) * scale;

    // Radial factor r in [0,1]: 0=center, 1=rim. Bias outward to avoid too dense center.
    const r = Math.max(0, Math.min(1, Math.pow(Math.random(), 0.45))); // skew toward rim

    // Small jitter to avoid bands
    const jitterX = (Math.random() * 2 - 1) * 0.02;
    const jitterY = (Math.random() * 2 - 1) * 0.02;

    const x = rimX * r + jitterX;
    const y = rimY * r + jitterY;

    // Volumetric puff: thicker near the center, thinner near the rim on both front/back
    // Dome profile: bulge(r) = bulgeMax * (1 - r^alpha)
    const alpha = 0.9;
    const bulge = bulgeMax * (1 - Math.pow(r, alpha));
    // Bias Z away from mid-plane to two faces (±bulge); keep small fraction in interior
    let z: number;
    if (Math.random() < 0.8) {
      const sign = Math.random() < 0.5 ? -1 : 1;
      const faceMag = 0.7 + Math.pow(Math.random(), 0.6) * 0.3; // [0.7,1]
      z = sign * bulge * faceMag + (Math.random() * 2 - 1) * 0.02; // tiny jitter
    } else {
      z = (Math.random() * 2 - 1) * bulge * 0.4; // sparse interior
    }

    const idx = i * 3;
    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;
  }
  return positions;
}

function createTextTexture(text: string): THREE.Texture {
  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  // Square canvas to ensure square point sprites
  const size = 512;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const fallback = new THREE.Texture();
    return fallback;
  }
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  // Square tile background
  const pad = 24;
  ctx.fillStyle = "rgba(255, 111, 165, 0.9)"; // pink tile
  ctx.strokeStyle = "rgba(220, 70, 135, 0.9)"; // deeper pink border
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.rect(pad, pad, size - pad * 2, size - pad * 2);
  ctx.fill();
  ctx.stroke();

  // Text auto-fit into up to 2 lines with dynamic font sizing
  const words = text.split(/\s+/).filter(Boolean);
  let line1 = text;
  let line2 = "";
  if (words.length > 1) {
    // Find split minimizing max line width at initial font size
    let bestSplit = 1;
    let bestScore = Infinity;
    const testFont = `bold 160px sans-serif`;
    ctx.font = testFont;
    for (let k = 1; k < words.length; k++) {
      const l1 = words.slice(0, k).join(" ");
      const l2 = words.slice(k).join(" ");
      const w1 = ctx.measureText(l1).width;
      const w2 = ctx.measureText(l2).width;
      const score = Math.max(w1, w2);
      if (score < bestScore) {
        bestScore = score;
        bestSplit = k;
      }
    }
    line1 = words.slice(0, bestSplit).join(" ");
    line2 = words.slice(bestSplit).join(" ");
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  const cx = size / 2;
  const cy = size / 2;

  // Dynamically size font so both lines fit within padded square
  const maxTextWidth = size - pad * 2 - 16;
  let fontSize = line2 ? 140 : 180;
  const minFontSize = 36;
  while (fontSize > minFontSize) {
    ctx.font = `bold ${fontSize}px sans-serif`;
    const w1 = ctx.measureText(line1).width;
    const w2 = line2 ? ctx.measureText(line2).width : 0;
    const fitsWidth = Math.max(w1, w2) <= maxTextWidth;
    // For two lines, also verify total height fits inside
    const totalHeight = line2 ? fontSize * 2 + fontSize * 0.3 : fontSize;
    const fitsHeight = totalHeight <= (size - pad * 2 - 16);
    if (fitsWidth && fitsHeight) break;
    fontSize -= 6;
  }
  ctx.font = `bold ${fontSize}px sans-serif`;

  if (line2) {
    ctx.fillText(line1, cx, cy - fontSize * 0.7);
    ctx.fillText(line2, cx, cy + fontSize * 0.1);
  } else {
    ctx.fillText(line1, cx, cy);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export default function ParticleHeart({ count = 4000, showLines = true }: ParticleHeartProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const pointsMatRef = useRef<THREE.PointsMaterial>(null);

  const positions = useMemo(() => generateHeartPoints(count), [count]);
  const basePositions = useMemo(() => positions.slice(0), [positions]);

  // Build line segments index for near neighbors
  const { linePositions, lineColors } = useMemo(() => {
    const pos = positions;
    const maxConnections = 4;
    const maxDistance = 0.25;
    const segments: number[] = [];
    const colors: number[] = [];
    const tmpA = new THREE.Vector3();
    const tmpB = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const ia = i * 3;
      tmpA.set(pos[ia], pos[ia + 1], pos[ia + 2]);
      // find up to N nearest
      const nearest: { j: number; d: number }[] = [];
      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        const ib = j * 3;
        tmpB.set(pos[ib], pos[ib + 1], pos[ib + 2]);
        const d = tmpA.distanceTo(tmpB);
        if (d < maxDistance) nearest.push({ j, d });
      }
      nearest.sort((a, b) => a.d - b.d);
      const limit = Math.min(maxConnections, nearest.length);
      for (let k = 0; k < limit; k++) {
        const j = nearest[k].j;
        const ib = j * 3;
        segments.push(pos[ia], pos[ia + 1], pos[ia + 2], pos[ib], pos[ib + 1], pos[ib + 2]);
        // pastel soft white-pink
        const c = new THREE.Color().setHSL(0.95, 0.5, 0.9);
        colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
      }
    }
    return {
      linePositions: new Float32Array(segments),
      lineColors: new Float32Array(colors),
    };
  }, [positions, count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Heartbeat scale
    const scale = 1 + Math.sin(t * 2.2) * 0.06;
    if (pointsRef.current) pointsRef.current.scale.setScalar(scale);
    if (linesRef.current) linesRef.current.scale.setScalar(scale);

    // Global twinkle: subtle opacity flutter
    if (pointsMatRef.current) {
      const baseOpacity = 0.9;
      const amp = 0.05;
      const twinkle = baseOpacity + Math.sin(t * 3.1 + twinklePhase) * amp;
      pointsMatRef.current.opacity = THREE.MathUtils.clamp(twinkle, 0.6, 1);
    }

    // Gentle particle oscillation
    const pos = positions;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const bx = basePositions[idx];
      const by = basePositions[idx + 1];
      const bz = basePositions[idx + 2];
      pos[idx] = bx + Math.sin(t + i * 0.13) * 0.02;
      pos[idx + 1] = by + Math.cos(t * 1.1 + i * 0.21) * 0.02;
      pos[idx + 2] = bz + Math.sin(t * 0.9 + i * 0.17) * 0.02;
    }
    (pointsRef.current?.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  const twinklePhase = useMemo(() => Math.random() * Math.PI * 2, []);
  const textTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createTextTexture("Chúc Thư Trung Thu Vui Vẻ");
  }, []);

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={pointsMatRef}
          color={"#ffffff"}
          size={0.055}
          sizeAttenuation
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          map={textTexture ?? undefined}
          alphaTest={0.02}
          depthTest
          depthWrite={false}
        />
      </points>
      {showLines && (
        <lineSegments ref={linesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[linePositions, 3]}
              count={linePositions.length / 3}
              array={linePositions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[lineColors, 3]}
              count={lineColors.length / 3}
              array={lineColors}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial vertexColors transparent opacity={0.18} color={0xffb3d1} />
        </lineSegments>
      )}
    </group>
  );
}


