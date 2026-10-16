# Client integration (React)

Complete files live under `templates/console/src/`. Copy them; use this page
for the reasoning and the edge cases.

| Concern | Template |
| --- | --- |
| Provider + status gate | `components/billing/billing-workspace.tsx` |
| Wrapper hooks, missing-key policy | `hooks/use-feature-access.ts` |
| Page / action gates | `components/billing/feature-gate.tsx` |
| Usage bars | `components/billing/usage-progress.tsx` |
| Catalog helpers, public catalog | `lib/pgw-catalog.ts` |
| Checkout + pay-invoice mutations | `lib/billing-api.ts` |
| Plans | `components/billing/plan-comparison.tsx` |
| Expired screen | `components/billing/expired-subscription.tsx` |
| Billing page | `routes/merchant/$tenant/billing/` |

## 0. Env

`bun add @graphland/pgw-merchant`, then extend `src/lib/env.ts` (zod schema +
`loadEnv`) and `.env.example`:

```ts
VITE_PGW_PUBLIC_API_KEY: z.string().min(1),
VITE_PGW_CLIENT_ID: z.string().min(1),
VITE_PGW_BASE_URL: z.url().optional().or(z.literal("")),
```

```bash
VITE_PGW_PUBLIC_API_KEY=   # public key only — never PGW_API_KEY
VITE_PGW_CLIENT_ID=
VITE_PGW_BASE_URL=https://pgw.graphland.dev
```

Then wrap the tenant layout: `<BillingWorkspace tenant={tenant}><DashboardFrame /></BillingWorkspace>`.

## Contents

1. Provider placement
2. Subscription-status gate
3. Wrapper hooks (and the missing-key policy)
4. Gate components: page, action, nav, usage
5. Billing page
6. Pre-tenant catalog reads

## 1. Provider placement

Mount **one** `PgWProvider` per active billing customer, as high as the tenant-scoped layout:

```tsx
<PgWProvider clientId={env.PGW_CLIENT_ID} billingCustomerId={tenant} publicApiKey={env.PGW_PUBLIC_API_KEY} baseUrl={env.PGW_BASE_URL}>
  <Workspace tenant={tenant} />
</PgWProvider>
```

- The provider makes one bootstrap request: `{ catalog, subscription, pendingInvoice, entitlements, canStartSubscription, canStartTrial, trialEligiblePlanKeys }`. Every hook reads that snapshot, so **don't add per-feature entitlement fetches**.
- Exceptions: `useCustomerInvoices()` and `useCustomerQuotations()` each make their own request.
- Validate the public env vars at startup (zod or similar).
- An admin view of another tenant mounts its own provider with that tenant's id.

## 2. Subscription-status gate

Before rendering the workspace, branch on `useSubscription()?.status`:

| Status | Suggested UI |
| --- | --- |
| provider loading | Full-screen loader. Avoids a flash of locked content. |
| `active`, `trialing`, `cancellation_scheduled` | Normal app |
| `past_due` | Normal app plus a banner with `graceEndsAt` and a "Pay now" button (`pendingInvoice`) |
| `pending_payment` | Normal app or a "complete payment" prompt (product decision) |
| `expired` | Renewal screen: pay the pending or failed invoice, or pick a plan |
| `null`, `cancelled`, `superseded`, `scheduled` | "Choose a plan" screen with the plan comparison |

**Always let the billing route through**, or users can't fix their own billing. Statuses are a union in the SDK (`SubscriptionStatus`), so keep your allowlist and the status labels in sync with it.

## 3. Wrapper hooks and the missing-key policy

The SDK hooks (`useFeaturePermission`, `useEntitlement`, `useEntitlements`) return `state: loading | error | allowed | denied | missing`. Wrap them once in your app so every gate applies the same policy:

The template exports `useFeatureAccess(key)` → `{ allowed, state, featureType, loading, error }`, `isFeatureOpen(access)` (the policy), `usePlanFeatureState(key)` → `{ locked, loading }` for nav items, and `useEntitlements()` → `{ hasFeature, planKey, refresh, ... }` for conditional UI. Keys are matched case-insensitively.

**Missing-key policy.** Bootstrap omits keys the plan doesn't define, while the server rejects unknown keys with `NOT_FOUND`.

- **Fail-closed** (`missing` → locked): matches the server and is safer. Recommended for new apps.
- **Fail-open** (`missing` → allowed): useful for staged catalog rollouts. The cost is that the UI may show actions the server rejects.

Whichever you pick, implement it in one helper, not per component. The template has `MISSING_FEATURE_POLICY = "closed"` at the top of `use-feature-access.ts`.

For quotas, also treat `remaining <= 0` (except `-1`) as not allowed when deciding to show "create".

## 4. Gate components

| Need | Component pattern | When not allowed |
| --- | --- | --- |
| Whole page or route | `<FeatureGate feature tenant title>` | Locked card with "Go to billing → plans". Skeleton while loading. |
| Sidebar item plus its route | `planFeature` on the nav config; render a lock icon from `usePlanFeatureState(planFeature).locked` and wrap the route in `FeatureGate` | Lock **only boolean** features this way. Never lock a list page because a quota is full. |
| Create button | `<FeatureGateAction feature>` | Boolean: "Upgrade to create" link. Quota exhausted: hide or disable. |
| Quota visibility | `<EntitlementUsageProgress featureKey label>` | Hidden for boolean. `-1` limit → "Unlimited". Warn at 80%, error at 100%. |

The SDK's own `<FeatureGate featureKey fallback loadingFallback errorFallback>` works for simple cases. Wrap it, or build on your hook, once you need upgrade CTAs and type-aware behavior.

Useful catalog helpers:

- `getCatalogEntitlementLimit(e)` turns `effectiveLimit` (or `consumed + remaining`) into a number, or `null` when the limit is `-1`.
- `getCatalogCycleLabel(days)`: 365n → years, 30n → months, otherwise days.
- `getVariantSavings(plan, variant)` compares a variant against the shortest cycle's price.
- `formatCatalogAmount(amount, currency)`.

## 5. Billing page

Use tabs: **Overview · Plans · Invoices · Quotations**, with state in the URL (`?tab=`).

- **Overview**: plan name, status badge, trial or grace dates, per-entitlement usage, and "Pay now" when `bootstrap.pendingInvoice` exists. That calls your server's pay-invoice proxy, or redirects to `pendingInvoice.paymentUrl` if the return URLs are fine.
- **Plans**: build the cycle selector from `catalog.plans[].priceVariants[]` (`variantKey`, `billingCycleDays`, `price`). Mark the current plan from `subscription.planKey`. "Choose" calls the server checkout proxy with **`planKey` + `variantKey`**, then sets `window.location.href = redirectUrl`. If there's no `redirectUrl` (a free plan), call `refresh()`. Use `canStartTrial` and `trialEligiblePlanKeys` for trial CTAs.
- **Invoices**: `useCustomerInvoices()`. For "View", call `client.getPublicPreview(uid)`. Open the tab synchronously *before* the await, to beat popup blockers.
- **Quotations**: `useCustomerQuotations()`. Link to `publicUrl`, which shows the accept/decline page. Status `sent` means it's awaiting the customer.
- **Checkout return**: the server's return URLs land on `…/billing?checkout=success|cancelled|failed`. On success, show a message and call `refresh()`. Always clear the param so a reload doesn't repeat the message. PGW settles asynchronously, so "success" may show the old plan for a moment. Say "will update shortly", and consider refreshing once more after a short delay.

Errors (checkout, pay-invoice, invoice preview, load failures, `?checkout=failed`) render in `FormError` at the top of the section. Toasts are only for success ("Redirecting to checkout…", "Payment received").

## 6. Pre-tenant catalog reads

Signup and onboarding flows run before a `billingCustomerId` exists, so there's no provider. Use `fetchPublishedBillingCatalog()` from `lib/pgw-catalog.ts` (public client, promise-cached, retried after a failure) — typically inside `useQuery({ queryKey: ["pgw-catalog"], queryFn: fetchPublishedBillingCatalog })`.

The same applies to marketing pricing pages. Read the key from env and don't hardcode it, even though it's public.

