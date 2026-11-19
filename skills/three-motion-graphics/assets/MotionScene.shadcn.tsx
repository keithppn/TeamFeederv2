"use client"; // keep for Next.js App Router; remove in Vite/Laravel
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { createMotionScene, type MotionConfig } from "@/lib/motion-scene";
import { cssVarColor, watchThemeChange } from "@/lib/theme-colors";

type Props = { config?: MotionConfig; className?: string };
const TOKENS = ["--primary", "--chart-2"]; // swap for the project's brand tokens

export function MotionScene({ config = {}, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(config);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let scene: ReturnType<typeof createMotionScene> | undefined;
    const mount = () => {
      scene?.dispose();
      const themed = TOKENS.map((t) => cssVarColor(t)).filter(
        (c): c is string => !!c,
      );
      const colors = config.colors ?? (themed.length ? themed : undefined);
      scene = createMotionScene(host, colors ? { ...config, colors } : config);
    };
    mount();
    const stop = watchThemeChange(mount); // re-theme on dark-mode toggle
    return () => {
      stop();
      scene?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
    />
  );
}
