# Enforcement — EntitlementService.assert\*

**The server is the only real gate.** The console mirrors entitlements for UX ([frontend-gating.md](frontend-gating.md)) but never enforces.

## Imperative asserts (the primary pattern)

`EntitlementService` (`templates/api/entitlement.service.ts`) exposes assertion methods that throw `BillingEntitlementException` (HTTP status + machine `code`). Feature services call them **imperatively** right before the gated action — this is the proven pattern because most checks need request context (a current count, the period's usage) that a blanket guard can't see.

```ts
// in some feature service
async createReport(orgId: string, input: CreateReportDto) {
  await this.entitlements.assertFeature(orgId, 'advancedReports'); // 403 if locked
  await this.entitlements.assertCanUse(orgId);                     // status + quota + rate
  const report = await this.repo.create({ ...input, organizationId: orgId });
  await this.entitlements.recordUsage(orgId);                      // increment AFTER success
  return report;
}
```

| Method | Checks | Throws (HTTP / code) |
| --- | --- | --- |
| `assertFeature(org, key)` | boolean feature flag | 403 `FEATURE_NOT_AVAILABLE` |
| `assertCanUse(org)` | status + period quota + rate limit | 402 `SUBSCRIPTION_INACTIVE` / 402 `REQUEST_QUOTA_EXCEEDED` / 429 `RATE_LIMIT_EXCEEDED` |
| `recordUsage(org)` | — (increments the counter; no-op when blocked) | — |
| `assertCanCreateItem(org)` | status + resource cap | 403 `ITEM_LIMIT_EXCEEDED` |

Three independent mechanisms — don't conflate them:
1. **Feature gate** (boolean) — `assertFeature`.
2. **Quota** (volume per period) — inside `assertCanUse`, `requestsUsed` vs `maxRequestsPerPeriod`; increment with `recordUsage` only after a terminal success.
3. **Rate limit** (throughput) — Redis fixed window keyed `rate:{orgId}` (`RateLimitService`), inside `assertCanUse`.
4. **Resource cap** (count) — `assertCanCreateItem`, counts existing rows via the injected `UsageProvider`.

## Optional `@RequiresFeature()` guard

For simple endpoint-level feature gates with no extra context, the convenience decorator + guard (`templates/api/requires-feature.guard.ts`) reads `organizationId` off the request and calls `assertFeature`:

```ts
@RequiresFeature('webhooks')
@Post('webhooks')
createWebhook() { ... }
```

Use it as sugar for pure feature gates; keep the imperative `assert*` for anything needing a count, the request body, or post-success metering.

## Wiring

Inject `EntitlementService` from `BillingModule` (exported) into feature services. Provide a `USAGE_PROVIDER` implementing `countItems(orgId)` against your resource table, and a `PAYMENT_GATEWAY` adapter ([payments.md](payments.md)). Seat checks usually live in your auth layer's invite/accept hooks (calling `canInviteMemberSeat`/`canAcceptMemberSeat` from `@app/plans`) to avoid an auth↔billing circular dependency.

## Error contract

All failures are `{ statusCode, message, code }`. Clients branch on `code` (`BillingErrorCode`), never message text. `RATE_LIMIT_EXCEEDED` includes `retryAfterSeconds`.
