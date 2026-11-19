# Accessibility

- **Reduced motion:** the core renders one still frame under `prefers-reduced-motion: reduce`. Don't add other motion (CSS parallax) that ignores the same preference.
- **Pause control:** WCAG 2.2.2 expects a way to pause, stop, or hide non-essential moving content lasting over 5 seconds. For prominent scenes add a keyboard-focusable toggle that calls `scene.pause()` and `scene.resume()`, and remember the choice in `localStorage`.
- **Flashing:** nothing may flash more than three times per second (WCAG 2.3.1). Keep `speed` modest and avoid strobing color cycles.
- **Decorative by default:** `aria-hidden="true"` and `pointer-events: none`, so the canvas never traps focus, hover, or clicks. If a model carries real information (a product), put a text alternative next to it and keep the canvas out of the tab order.
- **Contrast:** check text against the brightest part of the scene in light and dark mode. Use the overlay pattern from the UI-kit reference when needed.
- **Scroll scenes:** the page must stay usable with the scene off. Don't hijack scroll speed or snapping.
- **Fallback parity:** the static fallback (no WebGL, data saver, errors) should look intentional. Test by blocking WebGL.
- **Context loss:** the core pauses on `webglcontextlost` and resumes on restore. If a canvas still goes blank after backgrounding the tab, check that handler first.
