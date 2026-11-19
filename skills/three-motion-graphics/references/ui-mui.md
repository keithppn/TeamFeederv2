# MUI layout patterns

Work inside the template's existing components and reuse its Container, Typography, and spacing.

Hero:

```tsx
<Box
  component="section"
  sx={{
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    py: { xs: 10, md: 16 },
  }}
>
  <MotionScene
    config={{ preset: "shader" }}
    sx={{ zIndex: -1, opacity: 0.4 }}
  />
  <Container maxWidth="lg">
    <Typography variant="h2" component="h1" gutterBottom>
      Headline
    </Typography>
    <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
      Subtext
    </Typography>
    <Button variant="contained" size="large" sx={{ mt: 4 }}>
      Get started
    </Button>
  </Container>
</Box>
```

Contrast overlay (`alpha` from `@mui/material/styles`):

```tsx
<Box
  sx={(t) => ({
    position: "absolute",
    inset: 0,
    zIndex: -1,
    bgcolor: alpha(t.palette.background.default, 0.4),
  })}
/>
```

Scroll story: a tall `Box` with an `id` (for example `height: '400vh'`) containing a `position: 'sticky', top: 0, height: '100vh'` child that holds the scene. Use `config={{ preset: 'scroll', scroll: 'section', scrollSelector: '#story' }}` and put the text blocks in `Typography` above the canvas with `position: 'relative', zIndex: 1`.

Card banner:

```tsx
<Card>
  <Box sx={{ position: "relative", height: 128 }}>
    <MotionScene
      config={{ preset: "particles", density: 0.5, maxPixelRatio: 1.5 }}
    />
  </Box>
  <CardContent>…</CardContent>
</Card>
```

Dark mode: use the existing `ThemeProvider`; don't create a new one. The wrapper re-mounts when `theme.palette.mode` changes. With `cssVariables` + `colorSchemes` themes, add `useColorScheme().mode` to the effect dependencies.
