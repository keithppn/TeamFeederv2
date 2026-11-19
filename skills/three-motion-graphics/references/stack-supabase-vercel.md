# React + Supabase + Vercel

- **Next.js App Router:** the wrapper is a client component, imported with `dynamic(() => import('./motion-scene'), { ssr: false })` from another client component. Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Vite SPA:** env `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Add to `vercel.json`:
  `{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }`
- **Models in Supabase Storage** (keeps large GLBs out of git):
  ```ts
  const { data } = supabase.storage.from('models').getPublicUrl('robot.glb');
  <MotionScene config={{ preset: 'model', model: data.publicUrl }} />
  ```
  Private bucket: `createSignedUrl(path, 3600)` and refresh it before it expires. Check CORS in the browser console on first use.
- **Config in the database**, so the look changes without a redeploy:
  ```sql
  create table motion_configs (slug text primary key, config jsonb not null);
  alter table motion_configs enable row level security;
  create policy "public read" on motion_configs for select using (true);
  ```
  ```ts
  const { data } = await supabase
    .from("motion_configs")
    .select("config")
    .eq("slug", "home-hero")
    .single();
  ```
- **Never ship the `service_role` key to the browser.** Only the anon key.
- **Vercel caching** for versioned static files: set `Cache-Control: public, max-age=31536000, immutable` on `/models/(.*)` in `vercel.json` (or `headers()` in `next.config`). Use `immutable` only when filenames change on every update.
- **Gotchas:** a blank canvas means the container has zero height; a scroll scene that doesn't move with a sticky canvas needs `scroll: 'section'` and `scrollSelector`.
