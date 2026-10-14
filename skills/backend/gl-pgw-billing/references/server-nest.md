# Server integration (NestJS, plus the non-Nest fallback)

## Contents

1. Module setup
2. Provisioning on tenant create
3. Checkout and pay-invoice proxy
4. Boolean features (guard and helper)
5. Quotas (`assertAndConsume`)
6. Errors
7. Without Nest

## 1. Module setup

```ts
import { PGWBilling } from "@graphland/pgw-merchant/nest"; // alias of PGWBillingModule

PGWBilling.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (c: ConfigService) => ({
    apiKey: c.getOrThrow("PGW_API_KEY"),
    clientId: c.getOrThrow("PGW_CLIENT_ID"),
    baseUrl: c.get("PGW_BASE_URL"),                 // default https://pgw.graphland.dev
    consoleUrl: c.getOrThrow("APP_URL"),            // origin for checkout return URLs
    checkoutReturnPath: "/app/{tenant}/billing?checkout={outcome}", // default: /merchant/{tenant}/billing?checkout={outcome}
    defaultPlanKey: "free",                         // baseline plan for ensureBillingAccount
    defaultPriceVariantKey: "30d",
  }),
}),
```

The module is **global**. It provides `PAYMENT_GATEWAY` (inject it with `@Inject(PAYMENT_GATEWAY) gateway: PaymentGateway`), `EntitlementService` (inject by class), and `PGW_BILLING_CONFIG`.

If `apiKey` or `clientId` is missing, the gateway logs a warning. Reads and writes then throw "not configured", and `ensureBillingAccount` **silently no-ops**. Validate the env at boot (Joi or zod) so production can't start without the keys.

## 2. Provisioning on tenant create

Right after your tenant or org is persisted:

```ts
await this.gateway.ensureBillingAccount?.(tenant.uid).catch((err) =>
  this.logger.error(`PGW provisioning failed for ${tenant.uid}: ${err.message}`),
);
```

- This is idempotent (key `${clientId}:account:${id}`). It creates the customer and the default free subscription.
- It is **best-effort**: don't fail signup because PGW is down. The trade-off is that a tenant with a failed provisioning lands on the "choose a plan" screen. Log it loudly, and consider a retry job or calling it again lazily on first billing page load.
- The config `displayName` is static. For a **per-tenant** display name, use the raw client:
  `new GraphlandPGWClient({ apiKey, clientId, baseUrl }).ensureCustomer(id, { displayMetadata: { name } }, "<client>:customer:<id>:display-name")`.

## 3. Checkout and pay-invoice proxy

The browser can't hold the private key, so expose one authenticated, tenant-scoped mutation or endpoint per action:

```ts
async createCheckout(input: { planKey: string; variantKey: string }, tenant: string, user: AuthUser) {
  const session = await this.gateway.createCheckoutSession({
    organizationId: tenant,
    planKey: input.planKey,
    priceVariantKey: input.variantKey,      // pass the variant the UI selected, don't re-derive it
    customerName: user.name,
    customerEmail: user.email,
    // success/cancel/fail URLs optional, falling back to consoleUrl + checkoutReturnPath
  });
  return { sessionId: session.sessionId, redirectUrl: session.redirectUrl, invoiceId: session.invoiceId };
}

async payInvoice(invoiceNumber: string) {
  return this.gateway.payInvoice({ invoiceNumber }); // reopens hosted checkout, creates no new invoice
}
```

- PGW decides between a new subscription and a plan change, handles trial eligibility, and provisions the customer. Don't replicate that logic.
- Free variants activate immediately and may return no `redirectUrl`. Handle both cases in the UI.
- If you need to validate input, look the plan and variant up in `gateway.getCatalog()` and match on `variantKey` or `billingCycleDays`. **Don't accept months and multiply by 30**, because a 365-day yearly variant does not round-trip through 12 × 30.
- Gate both operations with the host application's billing checkout permission. Take the tenant from the auth context, not the request body.
- Map SDK errors to the host API's standard error shape.

## 4. Boolean features

`EntitlementService.assertAndConsume` only handles quota types, so write a small helper:

```ts
@Injectable()
export class FeatureEntitlementService {
  constructor(@Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway) {}
  async assertFeatureAllowed(tenant: string, featureKey: string) {
    const e = await this.gateway.getEntitlement(tenant, featureKey);
    if (!e.allowed) throw new ForbiddenException("Your current plan does not include this feature"); // or your AppException
  }
}
```

Enforce it with a **global guard** driven by the shared gate catalog. Gating then becomes a one-line catalog edit with no per-handler decorators:

```ts
@Injectable()
export class FeatureEntitlementGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext) {
    const gql = ctx.getType() === "http" ? undefined : GqlExecutionContext.create(ctx);
    const key =
      this.reflector.get<string>(REQUIRED_FEATURE, ctx.getHandler()) // @RequireFeature escape hatch (REST)
      ?? getRequiredFeature(gql?.getInfo().fieldName);
    if (!key) return true;
    const req = gql ? gql.getContext().req : ctx.switchToHttp().getRequest();
    const tenant = req.headers["x-tenant"];   // or wherever your tenant context lives
    if (!tenant) throw new ForbiddenException("Missing tenant for feature-gated operation");
    await this.features.assertFeatureAllowed(tenant, key);
    return true;
  }
}
// register: { provide: APP_GUARD, useClass: FeatureEntitlementGuard }
```

- The guard adds one PGW call to each gated request. Gate writes, and add reads only if they must be blocked too.
- An unknown key makes the server throw `NOT_FOUND` (an ApiError), not a clean "denied". Register keys in PGW before you ship the gate.
- For conditional logic inside a service, call `assertFeatureAllowed` directly.

## 5. Quotas

```ts
const currentQuantity = await this.model.countDocuments({ tenant });   // count what the limit means
await this.entitlementService.assertAndConsume({
  tenant,
  featureKey: APP_PGW_FEATURES.products,
  currentQuantity,
  requestId: `${clientId}:products:${tenant}:${handle}`,                // natural key → retry-safe
});
// ...then insert
```

Behavior, from the SDK source:

- **consumable**: denied if `!allowed` or `remaining < 1` (`-1` means unlimited). Otherwise it calls `consume(quantity: 1, requestId)`.
- **non_consumable**: calls `check({ currentQuantity, requestedQuantity: 1 })`. **Nothing is recorded.** Your count *is* the usage, so exclude soft-deleted rows if the limit should.
- **boolean or unknown**: throws. Use section 4 instead.
- Denials throw Nest `ForbiddenException` with a readable message. Let it propagate.

Guidance:

- Put the call **immediately before the insert**. Once a consumable is consumed it's spent, even if the write later fails.
- To consume more than 1 (for example tokens), call `gateway.consume({ billingCustomerId, featureKey, quantity, requestId })` directly after checking `getEntitlement`.
- Bulk and import paths need the same enforcement, with one check per item or a pre-check of the batch size.
- `check` returns `allowed: false` with `code: "ENTITLEMENT_EXCEEDED"` (HTTP 200). It doesn't throw.

Useful natural request identifiers include a product handle, invite email, or
order identifier. Avoid a random UUID when a retry should represent the same
unit of work.

## 6. Errors

The core client throws typed errors: `ApiError`, `ValidationApiError`, `ConflictApiError` (idempotency conflict), and `EntitlementExceededApiError`. Each carries `statusCode` and the API's `code`. Translate them at your API boundary into your standard error format. Don't leak raw PGW bodies to end users.

## 7. Without Nest

Use the core client directly with the same patterns:

```ts
const pgw = new GraphlandPGWClient({ apiKey, clientId, baseUrl, retries: 3 }); // retries only idempotent calls
await pgw.ensureBillingAccount(id, { planKey: "free", priceVariantKey: "30d" }, `${clientId}:account:${id}`);
await pgw.createCheckoutSession(id, { planKey, priceVariantKey, successUrl, cancelUrl, failUrl }, idemKey);
const e = await pgw.getEntitlement(id, key);
await pgw.check({ billingCustomerId: id, featureKey, currentQuantity, requestedQuantity: 1 });
await pgw.consume({ billingCustomerId: id, featureKey, quantity, requestId });
```

Recreate the guard as middleware in your framework.
