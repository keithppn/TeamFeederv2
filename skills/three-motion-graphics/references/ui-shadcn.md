# shadcn/ui layout patterns (Tailwind; use utilities that exist in v3 and v4)

Work inside the template's existing components and reuse its container, spacing, and typography.

Hero:

```tsx
<section className="relative isolate overflow-hidden">
  <MotionScene config={{ preset: "shader" }} className="-z-10 opacity-40" />
  <div className="absolute inset-0 -z-10 bg-background/40" />{" "}
  {/* contrast overlay */}
  <div className="container mx-auto px-6 py-24">
    <h1 className="text-4xl font-bold tracking-tight">Headline</h1>
    <p className="mt-4 max-w-xl text-muted-foreground">Subtext</p>
    <Button size="lg" className="mt-8">
      Get started
    </Button>
  </div>
</section>
```

Scroll story (sticky canvas):

```tsx
<div id="story" className="relative h-[400vh]">
  <div className="sticky top-0 h-screen overflow-hidden">
    <MotionScene
      config={{ preset: "scroll", scroll: "section", scrollSelector: "#story" }}
    />
    <div className="relative z-10 flex h-full items-center justify-center">
      {/* copy */}
    </div>
  </div>
</div>
```

Card banner (dashboards, pricing, empty states):

```tsx
<Card className="overflow-hidden">
  <div className="relative h-32">
    <MotionScene
      config={{ preset: "particles", density: 0.5, maxPixelRatio: 1.5 }}
    />
  </div>
  <CardHeader>
    <CardTitle>…</CardTitle>
  </CardHeader>
</Card>
```

Auth page: put the scene in the decorative side panel (`hidden lg:block relative`) and leave the form side untouched.

Notes:

- Starter kits use `@/` aliases and `components/ui`; put the wrapper in `components/` with a kebab-case filename.
- Tune the wrapper's `opacity` instead of changing the preset when the scene feels loud.
- Use `density: 0.5` and `maxPixelRatio: 1.5` for small or repeated scenes. One full-bleed scene per page is plenty.
