import { useEffect, useRef } from "react";
import { Box, useTheme } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { createMotionScene, type MotionConfig } from "@/lib/motion-scene";
import { resolveCssColor } from "@/lib/theme-colors";

type Props = { config?: MotionConfig; sx?: SxProps<Theme> };

export function MotionScene({ config = {}, sx }: Props) {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(config);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const colors =
      config.colors ??
      [theme.palette.primary.main, theme.palette.secondary.main].map((c) =>
        resolveCssColor(c, host),
      ); // also resolves var(--mui-...) from cssVariables themes
    const scene = createMotionScene(host, { ...config, colors });
    return () => scene.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    key,
    theme.palette.mode,
    theme.palette.primary.main,
    theme.palette.secondary.main,
  ]);

  return (
    <Box
      ref={ref}
      aria-hidden="true"
      sx={[
        { position: "absolute", inset: 0, pointerEvents: "none" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
