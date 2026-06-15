# Frontend gating — UX hints, not security

The console mirrors entitlements to disable buttons and show upgrade prompts. **It is never authoritative** — every gated action is also enforced by the API, which returns the real `BillingErrorCode`. Treat the frontend as a courtesy that saves a round-trip.

## One source: `useEntitlements`

`templates/console/hooks/use-entitlements.ts` fetches `GET /v1/billing/entitlements` via React Query (key `billing/entitlements`, `staleTime: 30s`, enabled once an org is active). Load it once in the merchant layout; everything else reads from the cache. It returns helpers backed by `@app/plans` (`hasFeature`, `canInviteMember`, `getLockMessage`) so the UI uses the *same* logic the server enforces.

`templates/console/lib/billing.ts` re-exports the `@app/plans` checks/labels and defines the query keys + API client functions (`getEntitlements`, `createCheckout`, `updateSubscription`). Point its `apiRequest` import at your project's fetch wrapper.

## Components

| Component | Use | Template |
| --- | --- | --- |
| `useFeatureGate(key)` | per-element gate state (`locked`, `lockMessage`) | `hooks/use-feature-gate.ts` |
| `<FeatureGateButton feature="webhooks">` | action button → disabled lock + upgrade tooltip when locked | `components/feature-gate-button.tsx` |
| `<PlanFeatureGate feature="advancedReports">` | wraps a section → upgrade card when locked | `components/plan-feature-gate.tsx` |
| `<BillingBanner />` | global banner whenever `status !== 'active'` (trial countdown, usage, pay CTA) | `components/billing-banner.tsx` |

```tsx
<FeatureGateButton feature="advancedReports" onClick={openReport}>
  Advanced report
</FeatureGateButton>
```

For numeric/seat limits use the `canInviteMember()` / usage values from `useEntitlements` to drive a similar disabled+tooltip button.

## Adaptation

Templates target React + TanStack Router + TanStack Query + shadcn (the gl-console-patterns stack). For Next.js, make the hooks client components and swap the `<Link to="/billing">` for `next/link`. The `@app/plans` import and the `OrgEntitlements` shape stay identical — that's the whole point of the shared package.
