# Asset sources

Prefer CC0 GLB. Licenses are set per file or pack and can change, so check the source page before shipping.

| source                           | what it offers                                 | notes                                                                                   |
| -------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| Quaternius (quaternius.com)      | ~80 CC0 packs, 1,100+ models, GLB/FBX          | characters and animals ship with walk/run/idle clips                                    |
| Kenney (kenney.nl)               | 270+ CC0 packs                                 | consistent low-poly style; universal animation library for its characters               |
| KayKit (kaylousberg.itch.io)     | ~25 packs, most free CC0                       | pay-what-you-want at $0                                                                 |
| Poly Haven (polyhaven.com)       | CC0 models, PBR textures, HDRIs                | has an API                                                                              |
| Poly Pizza (poly.pizza)          | 10,000+ low-poly models, mostly CC-BY          | keep attribution for CC-BY                                                              |
| Sketchfab                        | license varies per model                       | filter by downloadable and CC0/CC-BY                                                    |
| Cinevva (app.cinevva.com/assets) | searches several libraries                     | GLB viewer and FBX→GLB converter                                                        |
| 3DAssets.dev                     | free CC0 GLB models and game packs             | web-oriented                                                                            |
| CGHEVEN (cgheven.com)            | CC0 VFX (explosions, smoke)                    | fbx/glb/vdb                                                                             |
| three.js repo examples           | animated GLBs (Soldier, Xbot, RobotExpressive) | `github.com/mrdoob/three.js/tree/dev/examples/models/gltf`; check each folder's license |
| Mixamo                           | free rigging and animation                     | not open source; read its terms                                                         |

## Other

- **Fonts for the `text` preset:** needs a typeface.json. three.js ships some in `examples/fonts`; copy one to `public/fonts/` and check its license. Converting other fonts requires the font's own license to allow it.
- **Code references:** three.js official examples; Codrops demos (MIT, but a few older ones restrict reselling as-is, so read each README); three.quarks and three-nebula for particles. GSAP's formerly premium plugins became free in 2025; check current license terms before commercial use.
- **Hosting:** small files in `public/models/`; large or user-uploaded files in Supabase Storage or Laravel `storage/app/public`. Host the compressed version and keep originals out of the repo.
- **Credits template:** `Model: <name> by <author> — <license> — <url>` in the README or credits page.
