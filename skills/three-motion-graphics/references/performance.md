# Performance

Starting-point budgets (tune per project):

| item                         | target                               | why                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------- |
| three.js in the first load   | 0 KB                                 | lazy-load so it never competes with LCP  |
| GLB per model                | under ~1 MB compressed               | mobile network and parse time            |
| textures                     | ≤ 1024px unless hero subject         | GPU memory is the usual mobile killer    |
| live WebGL contexts per page | 1                                    | browsers cap them and drop the oldest    |
| `maxPixelRatio`              | 2 (1.5 for small or repeated scenes) | pixels grow with the square of the ratio |
| frame rate, mid-range phone  | steady 30+ fps                       | lower `density` before lowering quality  |

## Load late

- Vite: `lazy(() => import('./MotionScene'))` inside `<Suspense fallback={null}>`.
- Next.js: `dynamic(..., { ssr: false })` from a client component.
- Below the fold: mount via IntersectionObserver with about 200px `rootMargin`.
- Hero text and CTA must render without the scene.

## Gate by device

```ts
export function shouldRender3D(): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return false;
  if ((navigator.hardwareConcurrency ?? 8) <= 2) return false;
  return true;
}
```

When false, render a static gradient or poster. The core also adds the class `motion-scene-fallback` to the container when WebGL can't start, so style that class too.

## Cheap wins

- Prefer `shader` and instanced presets; hundreds of separate meshes mean hundreds of draw calls.
- Avoid real-time shadows, transmission/refraction materials, and post-processing unless the user insists.
- Keep particle counts modest; halve them on small containers via `density`.
- Reuse temp objects instead of allocating in the frame loop.
- Offscreen and hidden-tab pausing is built into the core; leave `pauseOffscreen: true`.

## Compress GLBs

Check `--help`, since flags change between releases:

```bash
npx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress webp
```

Copy `node_modules/three/examples/jsm/libs/draco/gltf/*` to `public/draco/` and set `dracoPath: '/draco/'` in the config. For meshopt instead, the loader needs `loader.setMeshoptDecoder(MeshoptDecoder)` from `three/addons/libs/meshopt_decoder.module.js`; the core doesn't wire this, so add it when needed.

## Measure

- Lighthouse LCP and TBT should not regress versus the scene disabled.
- Chrome DevTools Performance with 4x CPU throttle approximates a mid-range phone.
- `renderer.info.render.calls` and `renderer.info.memory` show draw calls and resources.
