import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

export type PresetName =
  | "particles"
  | "shapes"
  | "model"
  | "shader"
  | "text"
  | "scroll";

export interface MotionConfig {
  preset?: PresetName;
  colors?: string[];
  background?: string | null;
  speed?: number;
  density?: number;
  interactive?: boolean;
  maxPixelRatio?: number;
  pauseOffscreen?: boolean;
  model?: string | null;
  dracoPath?: string;
  text?: string;
  fontUrl?: string;
  waypoints?: [number, number, number][];
  scroll?: "page" | "section" | "none";
  scrollSelector?: string;
}

interface Resolved extends MotionConfig {
  preset: PresetName;
  colors: string[];
  speed: number;
  density: number;
  interactive: boolean;
  maxPixelRatio: number;
  pauseOffscreen: boolean;
}
type Frame = {
  t: number;
  dt: number;
  rawDt: number;
  ptr: { x: number; y: number };
  scroll: number;
};
type Ctx = {
  camera: THREE.PerspectiveCamera;
  renderOnce: () => void;
  reduceMotion: boolean;
};
type Preset = (
  scene: THREE.Scene,
  cfg: Resolved,
  ctx: Ctx,
) => { update(f: Frame): void };

const DEFAULT_COLORS = ["#6ee7ff", "#a78bfa"];
const tmp = new THREE.Object3D();
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function buildShapes(
  scene: THREE.Scene,
  cfg: Resolved,
  box: [number, number, number],
  center: [number, number, number],
) {
  const count = Math.round(40 * cfg.density);
  const mesh = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.35, 0),
    new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.2 }),
    count,
  );
  const color = new THREE.Color();
  const data = Array.from({ length: count }, (_, i) => {
    mesh.setColorAt(i, color.set(cfg.colors[i % cfg.colors.length]));
    return {
      p: new THREE.Vector3(
        center[0] + (Math.random() - 0.5) * box[0],
        center[1] + (Math.random() - 0.5) * box[1],
        center[2] + (Math.random() - 0.5) * box[2],
      ),
      s: 0.5 + Math.random(),
      r: Math.random() * Math.PI,
      f: 0.3 + Math.random() * 0.7,
    };
  });
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(3, 4, 5);
  scene.add(mesh, sun, new THREE.AmbientLight(0xffffff, 0.6));
  return (t: number, px: number) => {
    data.forEach((d, i) => {
      tmp.position.set(
        d.p.x + px * 0.3,
        d.p.y + Math.sin(t * d.f + d.r) * 0.4,
        d.p.z,
      );
      tmp.rotation.set(t * d.f * 0.5 + d.r, t * d.f * 0.3, 0);
      tmp.scale.setScalar(d.s);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
}

const PRESETS: Record<PresetName, Preset> = {
  particles(scene, cfg) {
    const pos = new Float32Array(Math.round(1500 * cfg.density) * 3);
    for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - 0.5) * 12;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.03,
        color: cfg.colors[0],
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      }),
    );
    scene.add(pts);
    return {
      update: ({ t, ptr }) => {
        pts.rotation.y = t * 0.05 + ptr.x * 0.2;
        pts.rotation.x = t * 0.02 + ptr.y * 0.1;
      },
    };
  },

  shapes(scene, cfg) {
    const tick = buildShapes(scene, cfg, [10, 6, 6], [0, 0, 0]);
    return { update: ({ t, ptr }) => tick(t, ptr.x) };
  },

  shader(scene, cfg) {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2() },
        uA: { value: new THREE.Color(cfg.colors[0]) },
        uB: { value: new THREE.Color(cfg.colors[1] ?? cfg.colors[0]) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uTime; uniform vec2 uPointer; uniform vec3 uA; uniform vec3 uB;
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          p += uPointer * 0.15;
          float v = 0.0;
          for (int i = 1; i < 4; i++) {
            float fi = float(i);
            p += 0.35 / fi * vec2(sin(fi * p.y * 2.0 + uTime * 0.4), cos(fi * p.x * 2.0 - uTime * 0.3));
            v += sin(p.x + p.y + uTime * 0.2) / fi;
          }
          float m = smoothstep(-1.0, 1.0, v);
          gl_FragColor = vec4(mix(uA, uB, m) * (0.35 + 0.65 * m), 1.0);
          #include <colorspace_fragment>
        }`,
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    quad.frustumCulled = false; // vertex shader ignores the camera
    scene.add(quad);
    return {
      update: ({ t, ptr }) => {
        mat.uniforms.uTime.value = t;
        mat.uniforms.uPointer.value.set(ptr.x, ptr.y);
      },
    };
  },

  text(scene, cfg, ctx) {
    const group = new THREE.Group();
    const light = new THREE.DirectionalLight(0xffffff, 2.5);
    light.position.set(2, 3, 5);
    scene.add(group, light, new THREE.AmbientLight(0xffffff, 0.5));
    let appear = ctx.reduceMotion ? 1 : 0;
    if (!cfg.fontUrl)
      console.warn(
        "[motion-scene] text preset needs fontUrl (a typeface.json file)",
      );
    else
      new FontLoader()
        .loadAsync(cfg.fontUrl)
        .then((font) => {
          // `depth` in current three.js; older releases call it `height`
          const geo = new TextGeometry(cfg.text ?? "Hello", {
            font,
            size: 1,
            depth: 0.35,
            curveSegments: 8,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
            bevelSegments: 3,
          });
          geo.center();
          geo.computeBoundingBox();
          const w = geo.boundingBox!.max.x - geo.boundingBox!.min.x;
          group.scale.setScalar(Math.min(1, 7 / w)); // keep long text in frame
          group.add(
            new THREE.Mesh(
              geo,
              new THREE.MeshStandardMaterial({
                color: cfg.colors[0],
                roughness: 0.3,
                metalness: 0.4,
              }),
            ),
          );
          ctx.renderOnce();
        })
        .catch((e) => console.warn("[motion-scene] font failed to load", e));
    return {
      update({ t, rawDt, ptr }) {
        appear = Math.min(1, appear + rawDt * 1.2);
        const e = 1 - Math.pow(1 - appear, 3);
        group.position.set(0, Math.sin(t) * 0.1, (1 - e) * -3);
        group.rotation.y = (1 - e) * -1 + ptr.x * 0.4 + Math.sin(t * 0.5) * 0.1;
        group.rotation.x = -ptr.y * 0.15;
      },
    };
  },

  scroll(scene, cfg, ctx) {
    const pts = (
      cfg.waypoints ?? [
        [0, 0, 6],
        [2, 1, -4],
        [-2, 0, -14],
        [0, 0, -24],
      ]
    ).map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const curve = new THREE.CatmullRomCurve3(pts);
    scene.fog = new THREE.Fog(cfg.background ?? "#000000", 8, 30);
    const tick = buildShapes(scene, cfg, [14, 7, 34], [0, 0, -12]);
    const look = new THREE.Vector3();
    let smooth = 0;
    return {
      update({ t, rawDt, ptr, scroll }) {
        smooth += (scroll - smooth) * (1 - Math.exp(-rawDt * 4)); // eased follow
        const u = Math.min(smooth, 0.98);
        curve.getPointAt(u, ctx.camera.position);
        curve.getPointAt(u + 0.02, look);
        ctx.camera.position.x += ptr.x * 0.2;
        ctx.camera.lookAt(look);
        tick(t, ptr.x);
      },
    };
  },

  model(scene, cfg, ctx) {
    const root = new THREE.Group();
    scene.add(root, new THREE.HemisphereLight(0xffffff, 0x444444, 1.5));
    let mixer: THREE.AnimationMixer | undefined;
    if (cfg.model) {
      const loader = new GLTFLoader();
      let draco: DRACOLoader | undefined;
      if (cfg.dracoPath) {
        draco = new DRACOLoader();
        draco.setDecoderPath(cfg.dracoPath); // e.g. '/draco/'
        loader.setDRACOLoader(draco);
      }
      loader
        .loadAsync(cfg.model)
        .then((gltf) => {
          root.add(gltf.scene);
          if (gltf.animations.length) {
            mixer = new THREE.AnimationMixer(gltf.scene);
            mixer.clipAction(gltf.animations[0]).play();
          }
          ctx.renderOnce();
        })
        .catch((e) => console.warn("[motion-scene] model failed to load", e))
        .finally(() => draco?.dispose());
    }
    return {
      update: ({ dt, ptr }) => {
        mixer?.update(dt);
        root.rotation.y = ptr.x * 0.5;
      },
    };
  },
};

const disposeObject = (o: THREE.Object3D) => {
  const m = o as THREE.Mesh;
  m.geometry?.dispose();
  (o as THREE.InstancedMesh).dispose?.();
  ([] as THREE.Material[]).concat(m.material ?? []).forEach((mat) => {
    Object.values(mat).forEach(
      (v) => v instanceof THREE.Texture && v.dispose(),
    );
    mat.dispose();
  });
};

export function createMotionScene(
  container: HTMLElement,
  userConfig: MotionConfig = {},
) {
  // Ignore undefined values so a missing key never wipes a default
  const clean = Object.fromEntries(
    Object.entries(userConfig).filter(([, v]) => v !== undefined),
  ) as MotionConfig;
  const cfg: Resolved = {
    preset: "particles",
    background: null,
    speed: 1,
    density: 1,
    interactive: true,
    maxPixelRatio: 2,
    pauseOffscreen: true,
    ...clean,
    colors: clean.colors?.length ? clean.colors : DEFAULT_COLORS,
  };
  const scrollMode = cfg.scroll ?? (cfg.preset === "scroll" ? "page" : "none");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const noop = { dispose() {}, pause() {}, resume() {} };

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: cfg.background == null,
    });
  } catch {
    container.classList.add("motion-scene-fallback"); // style with a static gradient/image
    return noop;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, cfg.maxPixelRatio));
  if (cfg.background) renderer.setClearColor(cfg.background);
  Object.assign(renderer.domElement.style, {
    display: "block",
    width: "100%",
    height: "100%",
  });
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 6;
  const render = () => renderer.render(scene, camera);

  const ptr = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    const r = container.getBoundingClientRect();
    ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ptr.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  if (cfg.interactive && !reduceMotion)
    window.addEventListener("pointermove", onMove);

  const scrollEl = cfg.scrollSelector
    ? document.querySelector<HTMLElement>(cfg.scrollSelector)
    : null;
  const readScroll = () => {
    if (scrollMode === "none") return 0;
    if (scrollMode === "section" && scrollEl) {
      const r = scrollEl.getBoundingClientRect();
      return clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1);
    }
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
  };

  const preset = (PRESETS[cfg.preset] ?? PRESETS.particles)(scene, cfg, {
    camera,
    renderOnce: render,
    reduceMotion,
  });

  const clock = new THREE.Clock();
  let t = 0,
    running = false,
    inView = true;

  const resize = () => {
    const w = container.clientWidth || 1,
      h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (!running) render();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  const frame = () => {
    const rawDt = clock.getDelta();
    const dt = rawDt * cfg.speed;
    t += dt;
    preset.update({ t, dt, rawDt, ptr, scroll: readScroll() });
    render();
  };
  const resume = () => {
    if (running || reduceMotion) return;
    running = true;
    clock.getDelta();
    renderer.setAnimationLoop(frame);
  };
  const pause = () => {
    running = false;
    renderer.setAnimationLoop(null);
  };

  let io: IntersectionObserver | undefined;
  if (cfg.pauseOffscreen && "IntersectionObserver" in window) {
    io = new IntersectionObserver(([en]) => {
      inView = en.isIntersecting;
      inView && !document.hidden ? resume() : pause();
    });
    io.observe(container);
  }
  const onVis = () => (document.hidden || !inView ? pause() : resume());
  document.addEventListener("visibilitychange", onVis);

  // Mobile browsers can drop the context under memory pressure
  const canvas = renderer.domElement;
  const onLost = (e: Event) => {
    e.preventDefault();
    pause();
  };
  const onRestored = () => {
    if (reduceMotion) render();
    else resume();
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  resize();
  if (reduceMotion) {
    preset.update({ t: 0, dt: 0, rawDt: 0, ptr, scroll: 0 });
    render();
  } else resume();

  return {
    pause,
    resume,
    dispose() {
      pause();
      ro.disconnect();
      io?.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      scene.traverse(disposeObject);
      renderer.forceContextLoss(); // free the context now; apps that remount often rely on this
      renderer.dispose();
      canvas.remove();
    },
  };
}
