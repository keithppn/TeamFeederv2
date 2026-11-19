# React + Laravel (Inertia + Vite)

- Files go under `resources/js/lib/` and `resources/js/components/`. If there's no `@/` alias, use relative imports.
- **Config from PHP**, so look changes need no frontend rebuild:
  ```php
  return Inertia::render('Home', [
      'motion' => ['preset' => 'shader', 'colors' => ['#0ea5e9', '#8b5cf6'], 'speed' => 0.8],
  ]);
  ```
  ```tsx
  import { usePage } from "@inertiajs/react";
  const { motion } = usePage<{ motion: MotionConfig }>().props;
  <MotionScene config={motion} />;
  ```
  Later the array can come from `config/motion.php` or a database table.
- **Assets:** `public/models/` and `public/fonts/`, referenced as `/models/robot.glb`. For user uploads use `storage/app/public` plus `php artisan storage:link` (served at `/storage/...`).
- **Inertia SSR:** WebGL is only touched inside `useEffect`, so SSR is safe. If the SSR build still errors on `three/addons`, lazy-import the wrapper with `React.lazy`.
- **Blade-only pages (no React):** import `createMotionScene` in `resources/js/app.js` and call it on a `<div>`.
- **CSP, if set:** allow `worker-src blob:` for Draco workers, `img-src blob: data:`, and the model host under `connect-src`.
- **Gotchas:** a blank canvas means the container has zero height; a double scene in dev is React Strict Mode (mount, unmount, mount), which `dispose()` handles.
