---
name: gl-console-deploy
description: Deploy the console/webapp to Cloudflare Workers and attach its custom domain — Vite SPAs as static assets with SPA fallback routing, Next.js apps via the OpenNext Cloudflare adapter (@opennextjs/cloudflare). Covers wrangler config, env vars, preview, deploy, custom domains, and CI via Workers Builds. Use when deploying or setting up deployment/domains for a GraphLand console.
compatibility: Any agent that supports the Agent Skills format (Claude Code, Cursor, opencode, Codex, etc.)
metadata:
  graphland-invocation: "manual"  # run on explicit request, not auto-triggered
  graphland-input: "[app path, e.g. apps/console]"
---

Deploy a GraphLand console (or any Vite/Next.js webapp) to **Cloudflare Workers**. Detect the framework from the app's config (`vite.config.ts` → Vite path, `next.config.*` → Next.js path). Both paths deploy to Workers — Cloudflare Pages is in maintenance mode; do not set up new Pages projects.

## 0. Intake — ask these questions first

**Do not deploy until intake is complete.** Ask the user (or infer from the request / conversation when already stated). If anything is unclear, ask — do not guess.

| # | Question | Options | Default when user defers |
| --- | --- | --- | --- |
| 1 | **App to deploy** | path, e.g. `apps/console` | detect — the sole Vite/Next.js app in the repo; ask when several exist |
| 2 | **Custom domain** | hostname, e.g. `console.acme.com` · `none` (workers.dev only) | ask — **never invent a hostname** |
| 3 | **Production API base URL** (`VITE_BACKEND_BASE_URL` / `NEXT_PUBLIC_BACKEND_BASE_URL`) | URL | ask — the value is inlined at build time; a guess ships in the bundle |
| 4 | **CI** | `none` (manual deploy) · `workers-builds` · `github-actions` | `none` |

Also confirm prerequisites (both paths): a Cloudflare account and `wrangler` authenticated — run `npx wrangler whoami`; if not logged in, tell the user to run `npx wrangler login` themselves (browser OAuth). Never ask for or paste API tokens. When intake #2 names a domain, its zone must already be on the same Cloudflare account (see **Custom domain** below).

## Path A — Vite SPA (static assets on Workers)

The GraphLand Vite console is a pure SPA (TanStack Router, client-side data fetching) — it deploys as static assets with no server code.

1. **Env vars are build-time.** `VITE_*` variables are inlined by `vite build`. Set the production values (at minimum `VITE_BACKEND_BASE_URL` from intake #3) in the shell or a `.env.production` before building — a wrong value ships in the bundle, not fixable at runtime.

2. **`wrangler.jsonc`** in the app root (no `main` — assets only):

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "<project>-console",
  "compatibility_date": "<today>",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
}
```

`not_found_handling: "single-page-application"` serves `index.html` for unmatched paths so deep links into TanStack Router routes work. Without it, refreshing `/merchant/vehicles` 404s.

3. **Scripts** in the app's `package.json`:

```json
{
  "deploy": "vite build && wrangler deploy",
  "cf-preview": "vite build && wrangler dev"
}
```

4. **Deploy:** `npm run deploy` (use the project's package manager). First deploy prints the `*.workers.dev` URL. Then attach the domain (see **Custom domain** below) and deploy again.

Monorepo note: run wrangler from the app directory (`apps/console`), each app gets its own `wrangler.jsonc` and Worker name.

## Path B — Next.js (OpenNext Cloudflare adapter)

Uses [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) — the Next.js build runs unmodified on the Workers Node.js runtime (SSR, RSC, API routes, middleware all work). For a **brand-new** app, prefer `npm create cloudflare@latest -- <name> --framework=next --platform=workers` and skip to step 6. For an existing app:

1. **Install:** `@opennextjs/cloudflare@latest` (dependency) and `wrangler@latest` (dev dependency, ≥ 3.99.0).

2. **Remove edge runtime.** The adapter does not support the edge runtime — delete any `export const runtime = "edge"` from routes/pages.

3. **`wrangler.jsonc`** in the app root:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "<project>-console",
  "main": ".open-next/worker.js",
  "compatibility_date": "<today>",  // must be ≥ 2024-09-23
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "services": [
    { "binding": "WORKER_SELF_REFERENCE", "service": "<project>-console" }
  ]
}
```

The `WORKER_SELF_REFERENCE` service name must equal the Worker's own `name`.

4. **`open-next.config.ts`** in the app root. Minimal (no ISR/`revalidate` caching across requests):

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
export default defineCloudflareConfig();
```

If the app uses ISR or data-cache revalidation, back the incremental cache with R2: create a bucket, add an `r2_buckets` binding named `NEXT_INC_CACHE_R2_BUCKET` to `wrangler.jsonc`, and pass `{ incrementalCache: r2IncrementalCache }` (imported from `@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache`).

5. **Wire the rest:**
   - `next.config.ts` — append at the end so `next dev` gets bindings/env locally:
     ```ts
     import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
     initOpenNextCloudflareForDev();
     ```
   - `.dev.vars` — `NEXTJS_ENV=development` (makes local preview load `.env.development`).
   - `.gitignore` — add `.open-next`.
   - `package.json` scripts:
     ```json
     {
       "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
       "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
       "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
     }
     ```

6. **Env vars.** `NEXT_PUBLIC_*` (e.g. `NEXT_PUBLIC_BACKEND_BASE_URL` from intake #3) are inlined at build time — set them before `deploy`. Server-side runtime values go in `wrangler.jsonc` `vars` (non-secret) or `npx wrangler secret put <NAME>` (secret) — never commit secrets.

7. **Deploy:** `npm run preview` first (production build served locally in the Workers runtime — catches runtime incompatibilities `next dev` hides), then `npm run deploy`. Then attach the domain (see **Custom domain** below) and deploy again.

## Custom domain (both paths)

Skip this section when intake #2 is `none`. The hostname comes from intake #2 (e.g. `console.acme.com`); its zone (`acme.com`) must already exist in the same Cloudflare account — if it doesn't, adding the site and switching nameservers is an account-level step the user does in the dashboard first; don't attempt it.

Add to `wrangler.jsonc`:

```jsonc
"routes": [
  { "pattern": "console.acme.com", "custom_domain": true }
]
```

Then re-run the deploy script. Wrangler creates the DNS record and issues the TLS certificate automatically — no manual DNS setup. Notes:

- A conflicting DNS record (e.g. an old CNAME) on that exact hostname blocks creation — wrangler will ask to override; confirm with the user before overriding anything that might serve live traffic.
- Matching is **exact hostname**: `acme.com` and `www.acme.com` are separate. Deploy the console on one canonical hostname; if the other should redirect, add a Redirect Rule in the zone's dashboard (Rules → Redirect Rules) plus a proxied placeholder DNS record — mention this to the user rather than configuring it silently.
- The `*.workers.dev` URL keeps working alongside the domain. To turn it off, set `"workers_dev": false` in `wrangler.jsonc` — do this once the custom domain is confirmed working, and remember auth/CORS allowlists must then use only the custom domain.
- Propagation is near-instant (the zone is already on Cloudflare), but certificate issuance can take a minute — a brief 522/526 right after the first domain deploy resolves on its own.

After the domain is live, update dependents: the API's CORS allowlist and Better Auth `trustedOrigins`/callback URLs should use the custom domain, and any `VITE_*`/`NEXT_PUBLIC_*` value that referenced the `workers.dev` URL needs a rebuild + redeploy.

## CI (both paths)

Skip when intake #4 is `none`. For `workers-builds`, connect the repo via **Workers Builds** (Cloudflare dashboard → Workers → the Worker → Settings → Build): pick the repo/branch, set the build command to the app's `deploy` script minus the final deploy step (Workers Builds runs the deploy), set the root directory to the app path in a monorepo, and define build-time env vars (`VITE_*` / `NEXT_PUBLIC_*`) in the build settings. For `github-actions`, run the app's `deploy` script in a workflow using a `CLOUDFLARE_API_TOKEN` repo secret — the user must create that token in the dashboard and add the repo secret themselves.

## Verify

After deploy, open the deployed URL (the custom domain when one is attached, else `*.workers.dev`) and check: a deep route loads on hard refresh (SPA fallback / SSR), the console reaches the API (watch for CORS — the API must allow the deployed origin), and auth redirects use the deployed origin (update the Better Auth `trustedOrigins` / callback URLs on the API if needed).
