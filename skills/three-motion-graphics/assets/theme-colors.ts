let ctx: CanvasRenderingContext2D | null = null;

/** Any CSS color (hex, rgb, hsl, oklch, var(--x)) → '#rrggbb'. three.js can't parse oklch or var(), so the browser converts. */
export function resolveCssColor(
  input: string,
  host: HTMLElement = document.documentElement,
): string {
  let value = input.trim();
  if (value.startsWith("var(")) {
    const probe = document.createElement("span");
    probe.style.color = value;
    host.appendChild(probe);
    value = getComputedStyle(probe).color;
    probe.remove();
  }
  ctx ??= document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (!ctx) return "#888888";
  ctx.fillStyle = "#000000"; // invalid colors are ignored, so reset first
  ctx.fillStyle = value;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
}

/** Read a shadcn/Tailwind CSS variable like '--primary' as '#rrggbb'. Handles "222 47% 11%" and full color values (oklch etc.). */
export function cssVarColor(
  name: string,
  host: HTMLElement = document.documentElement,
): string | undefined {
  const raw = getComputedStyle(host).getPropertyValue(name).trim();
  if (!raw) return undefined;
  const bareHsl = /^[\d.]+(deg)?\s+[\d.]+%\s+[\d.]+%(\s*\/.*)?$/.test(raw);
  return resolveCssColor(bareHsl ? `hsl(${raw})` : raw, host);
}

/** Calls back when the page toggles light/dark (class or data-theme on <html>). Returns an unsubscribe function. */
export function watchThemeChange(cb: () => void): () => void {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme"],
  });
  return () => mo.disconnect();
}
