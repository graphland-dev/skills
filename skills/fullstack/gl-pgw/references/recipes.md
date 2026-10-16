# Recipes and review checklist

## A. Wire a new app to PGW billing (greenfield)

1. In PGW: create the client (`clientId`), features with the right types, plans, and price variants (including a free baseline), then publish. Issue a private and a public key.
2. Env: API `PGW_API_KEY`, `PGW_CLIENT_ID`, `PGW_BASE_URL`, `WEB_CONSOLE_URL` (`pgwEnvSchema`). Console `VITE_PGW_PUBLIC_API_KEY`, `VITE_PGW_CLIENT_ID`, `VITE_PGW_BASE_URL`. Both validated at boot.
3. Copy `templates/feature-keys/` and fill in the real keys (feature-keys.md).
4. API: copy `templates/api/`, import `PgwBillingModule` + `BillingModule`, call `BillingProvisioningService.provision()` on tenant create, add quota calls to services (server-nest.md).
5. Console: copy `templates/console/`, wrap the tenant layout in `BillingWorkspace`, add the Billing nav item, add gates to paid areas (client-react.md).
6. Run the checklist below.

## B. Put an area behind a boolean plan feature

1. Confirm the key exists in PGW with `type: "boolean"`. If it doesn't, stop and have it created there first.
2. Add the constant to the shared keys module.
3. Map every gated **write** operation to the key in `featureGateCatalog`. Use `@RequireFeature` only for non-GraphQL handlers.
4. UI: set `planFeature` on nav items, use a page `FeatureGate` for routes outside the nav, and `FeatureGateAction` on create buttons.
5. Verify that a plan without the feature sees the lock **and** gets FORBIDDEN from a direct API call.

## C. Limit how many X a tenant can have (or meter usage)

1. Confirm the key and its type: `non_consumable` for "max N existing" or `consumable` for "N uses per period".
2. Add the constant. **Don't** add it to `featureGateCatalog`.
3. In the service's create method, count with the same scope the limit means, then call `assertAndConsume` with a natural-key `requestId`, then insert.
4. Cover bulk and import paths.
5. UI: add a usage bar on the list page and wrap the create button with an action gate. Don't lock the nav.

## D. Add or change a billing cycle

1. Add the variant in PGW. The UI selector reads `priceVariants`, so it appears automatically.
2. Make sure checkout sends `variantKey` (or exact `billingCycleDays`), so non-30-multiple cycles work.
3. Check cycle labels (365 → "1 year") and savings maths.

## E. Debug "why is this locked / allowed?"

| Symptom | Likely cause |
| --- | --- |
| UI locked, API allows | The UI sees `denied`, `loading`, or `error`. Inspect `usePgWContext().data.entitlements[key]` and `status`. |
| UI open, API forbids | Key missing from bootstrap under a fail-open policy, or the gate catalog maps the op to the wrong key |
| API error `NOT_FOUND` on a gated op | The feature key isn't registered in PGW for this `clientId` |
| "feature is not configured for usage limits" | `assertAndConsume` was called with a boolean key |
| Whole app shows "choose a plan" | Status not in the allowlist, or provisioning failed at signup (check server logs) |
| "No published price variant" at checkout | Plan or variant key mismatch, or a days↔months conversion |
| Paid but still on the old plan | Settlement is async. `refresh()` again, and check the invoice status in PGW. |

Use `explainEntitlement(id, key)` (private key) to see exactly which grants produced a decision.

## Review checklist

- [ ] No local plan, price, subscription, or billing-invoice persistence, and no renewal jobs.
- [ ] No private key in any client bundle (grep the client apps for `PGW_API_KEY`).
- [ ] Feature keys come from the shared constants, with values identical to PGW.
- [ ] Every UI gate has a server counterpart (gate catalog for boolean, `assertAndConsume` for quotas).
- [ ] `assertAndConsume` runs right before the write, only for quota types, with an idempotent `requestId`.
- [ ] `billingCustomerId` comes from trusted tenant context and is the same id everywhere.
- [ ] Checkout selects the variant by `variantKey` or exact days. Free plans without `redirectUrl` are handled.
- [ ] The checkout return calls `refresh()` and clears the query param.
- [ ] The missing-key policy is implemented in exactly one helper.
- [ ] The billing route is reachable in every subscription status.
- [ ] Errors follow the host app's convention (form-level for failures, toasts for success).
- [ ] Billing docs are updated alongside behavior changes.
