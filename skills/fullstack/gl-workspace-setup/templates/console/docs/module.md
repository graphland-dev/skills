Each page route is a colocated module folder:

```
src/routes/<area>/<route-path>/index.lazy.tsx
src/routes/<area>/<route-path>/~util.ts
src/routes/<area>/<route-path>/~components/index.tsx
```

Index routes (e.g. `/merchant/`, `/account/`) use the same layout at the parent folder level:

```
src/routes/merchant/index.lazy.tsx
src/routes/merchant/~util.ts
src/routes/merchant/~components/index.tsx
```

Page-specific components live under `~components/` alongside the page. Shared UI stays in `src/components/`.

TanStack Router ignores `~`-prefixed files via `routeFileIgnorePrefix: "~"` in `vite.config.ts`.

Routes that need `beforeLoad` or `validateSearch` (e.g. `/access/`) keep a thin `index.tsx` for the route shell and colocate UI in `~components/`.
