---
name: three-motion-graphics
description: Add 3D motion graphics (animated shader gradients, particle fields, floating shapes, animated 3D text, scroll-driven camera journeys, animated GLB models) to React apps with three.js, styled to match MUI or shadcn/ui templates. Use this skill whenever the user mentions three.js, WebGL, shaders, 3D animation, motion graphics, animated or 3D hero sections or backgrounds, scrollytelling, 3D text, GLB/glTF models, or "too many WebGL contexts" errors, or wants a React, Next.js, Vite, Laravel (Inertia), Supabase, or Vercel project to feel more dynamic or immersive, even if they never say "three.js". Also use it for hosting, compressing, or loading GLB files in a React app. Do not use it for 2D-only motion (CSS, Lottie, SVG, GSAP, framer-motion), chart performance, or Blender/Unity/Mapbox work.
---

# Three.js motion graphics for React + MUI / shadcn/ui

Goal: drop a performant, accessible, config-driven 3D scene into the user's existing project so it looks like part of their template.

## Workflow

1. **Detect the host.** Read `package.json` and config: Vite vs Next.js, JS vs TS, SSR or not, Laravel/Inertia (`resources/js`), Supabase, installed three.js version.
2. **Detect the UI kit.** MUI: `@mui/material` in dependencies. shadcn/ui: `components.json` at the root and CSS variables like `--primary`. If neither or both, follow the kit the neighboring components use.
3. **Install the code once** by copying from `assets/`: `motion-scene.ts` and `theme-colors.ts` into `src/lib/` (Laravel: `resources/js/lib/`), plus the matching wrapper (`MotionScene.shadcn.tsx` or `MotionScene.mui.tsx`). Adjust the `@/` alias to the project. Don't rewrite the core per project. If `three` is missing: `npm i three && npm i -D @types/three`.
4. **Place it in the template's own layout.** Read `references/ui-shadcn.md` or `references/ui-mui.md` for hero, scroll-story, card, and auth-panel patterns.
5. **Wire the stack.** Read `references/stack-laravel.md` (Inertia props, assets, CSP) or `references/stack-supabase-vercel.md` (Storage, env vars, DB-driven config, caching).
6. **Pick a model or font, if needed** from `references/asset-sources.md`.
7. **Before finishing,** read `references/performance.md` and `references/accessibility.md`, then verify: build passes, unmount leaves no canvas, light and dark both look right, text contrast holds, reduced motion shows a still frame, the page works with the scene disabled.

## Presets

| preset      | use for                                                                 |
| ----------- | ----------------------------------------------------------------------- |
| `shader`    | full-screen flowing gradient; cheapest and best default behind headings |
| `particles` | ambient hero background                                                 |
| `shapes`    | playful floating geometry                                               |
| `text`      | animated 3D headline (needs `text`, `fontUrl`)                          |
| `scroll`    | camera journey on scroll (`scroll`, optional `waypoints`)               |
| `model`     | animated GLB showcase (`model` URL, optional `dracoPath`)               |

Start with `shader` for backgrounds, `scroll` for landing-page stories, and `model` only when the user has a real asset.

## Config

`preset, colors[], background, speed, density, interactive, maxPixelRatio, pauseOffscreen, model, dracoPath, text, fontUrl, waypoints, scroll ('page'|'section'|'none'), scrollSelector`. Everything is JSON-serializable, so it can live in a database row, a Laravel config file, or a feature flag.

## Rules and why

- **Theme tokens over hardcoded colors.** A scene that ignores the palette looks bolted on and breaks in dark mode.
- **Don't add a second ThemeProvider, restyle the template, or install a UI kit** the project doesn't already use.
- **Transparent canvas, scene behind content:** `background: null`, negative z-index, `pointer-events: none`, `aria-hidden`.
- **Dashboards and admin pages:** only login, empty states, and banners, at low `density` and `maxPixelRatio ≤ 1.5`. Never behind tables or forms people are working in.
- **Client-only mount and always dispose.** SSR has no WebGL, and browsers cap live contexts while SPAs remount often.
- **Reduced motion gets a still frame.** The core does this; don't bypass it.
- **Big models stay out of git.** Compress, then host in `public/` or Supabase Storage.
- **Only the Supabase anon key goes to the browser.**
- **Record asset licenses** in the project's credits.

## Extending

Add a function to `PRESETS` in `motion-scene.ts` that returns `{ update(frame) }`. Sizing, pausing, scroll, pointer, context loss, fallback, and disposal are already handled.
