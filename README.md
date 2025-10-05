Heart Galaxy — Mid-Autumn Gift
================================

An interactive romantic 3D scene built with Next.js, React Three Fiber, and postprocessing. A beating heart at the center, a glowing moon, orbiting lantern-planets, starfield background, music, and a sweet reveal message.

Tech
- Next.js App Router, TypeScript
- three, @react-three/fiber, @react-three/drei
- @react-three/postprocessing (Bloom)
- @react-spring/three animations
- howler for audio

Getting started
1. Install deps: `npm i`
2. Dev: `npm run dev`
3. Open `http://localhost:3000`

Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Assets
- Place textures and audio in `public/assets/`.
  - `moon.jpg` (PolyHaven CC0)
  - `lantern.png`
  - `music.mp3` (royalty-free)
  - optional: `bunny.glb`
- Font: `public/fonts/Inter_Bold.json`

Attribution
- Moon textures: PolyHaven (`https://polyhaven.com`)
- Music: see `public/assets/music.mp3` source if used
- Optional models (e.g., bunny): Sketchfab authors per model page

Verification
See `VERIFICATION.md` for the checklist of behaviors to confirm after deploy.
