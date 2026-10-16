import type { CatalogEntitlement } from "@graphland/pgw-merchant";
import { usePgWContext, useSubscription } from "@graphland/pgw-merchant/react";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import { FormError } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { billingErrorMessage, useCreateCheckout } from "@/lib/billing-api";
import {
  formatCatalogAmount,
  formatCatalogName,
  getCatalogCycleLabel,
  getCatalogEntitlementLabel,
  getCatalogVariant,
  getVariantSavings,
  usePgwCatalog,
} from "@/lib/pgw-catalog";
import { cn } from "@/lib/utils";

interface PlanComparisonProps {
  tenant: string;
  /** Plan key to highlight as "Popular". */
  popularPlanKey?: string;
}

export function PlanComparison({ tenant, popularPlanKey }: PlanComparisonProps) {
  const catalogQuery = usePgwCatalog();
  const pgwContext = usePgWContext();
  const subscription = useSubscription();
  const checkout = useCreateCheckout(tenant);
  const [selectedCycleDays, setSelectedCycleDays] = useState<number>();

  const plans = catalogQuery.data?.plans ?? [];
  const features = catalogQuery.data?.features ?? [];
  const cycleOptions = Array.from(
    new Map(
      plans
        .flatMap((plan) => plan.priceVariants)
        .map((variant) => [variant.billingCycleDays, variant]),
    ).values(),
  ).sort((a, b) => a.billingCycleDays - b.billingCycleDays);
  const cycleDays = cycleOptions.some(
    (variant) => variant.billingCycleDays === selectedCycleDays,
  )
    ? selectedCycleDays
    : cycleOptions[0]?.billingCycleDays;

  const canStartSubscription =
    pgwContext.data?.canStartSubscription ?? !subscription;
  const hasActiveSubscription = Boolean(subscription) && !canStartSubscription;
  const currentPlanKey = hasActiveSubscription ? subscription?.planKey : undefined;
  const pendingPlan = checkout.isPending ? checkout.variables?.planKey : undefined;

  if (catalogQuery.isLoading) {
    return <Skeleton className="h-[32rem] w-full" />;
  }

  if (catalogQuery.isError || !catalogQuery.data) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Plans are unavailable right now. Please try again shortly.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <FormError
        title="Unable to start checkout"
        errors={
          checkout.error
            ? [billingErrorMessage(checkout.error, "Unable to start checkout")]
            : undefined
        }
      />

      {cycleOptions.length > 1 ? (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-2xl bg-secondary p-1.5">
            {cycleOptions.map((variant) => {
              const active = cycleDays === variant.billingCycleDays;
              return (
                <button
                  key={variant.billingCycleDays}
                  type="button"
                  onClick={() => setSelectedCycleDays(variant.billingCycleDays)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-xl px-5 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {getCatalogCycleLabel(variant.billingCycleDays)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const variant = cycleDays
            ? getCatalogVariant(plan, cycleDays)
            : plan.priceVariants[0];
          const savings = variant ? getVariantSavings(plan, variant) : null;
          const isCurrent = currentPlanKey === plan.planKey;
          const popular = plan.planKey === popularPlanKey;
          const isPaid = Boolean(variant && variant.price > 0);
          const hasTrial =
            isPaid &&
            (plan.trialDays ?? 0) > 0 &&
            Boolean(pgwContext.data?.canStartTrial) &&
            Boolean(pgwContext.data?.trialEligiblePlanKeys.includes(plan.planKey));
          const canSelect = hasActiveSubscription ? isPaid : true;
          const limits = plan.entitlements.filter((e) => e.mode !== "boolean");
          const flags = sortIncludedFirst(
            plan.entitlements.filter((e) => e.mode === "boolean"),
          );

          return (
            <article
              key={plan.planKey}
              className={cn(
                "relative flex h-full flex-col rounded-2xl p-7",
                popular ? "bg-primary/5 ring-1 ring-primary/20" : "bg-secondary",
                isCurrent && "ring-2 ring-primary/40",
              )}
            >
              <div className="flex min-h-6 flex-wrap gap-2">
                {isCurrent ? <PlanTag>Current</PlanTag> : null}
                {popular ? <PlanTag>Popular</PlanTag> : null}
              </div>

              <h3 className="mt-2 text-lg font-semibold">{plan.name}</h3>
              <p className="text-xs text-muted-foreground">
                {formatCatalogName(plan.planKey)} plan
              </p>

              <div className="mt-6 flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-4xl font-bold tracking-tight">
                  {variant
                    ? formatCatalogAmount(variant.price, plan.currency)
                    : "Unavailable"}
                </span>
                {variant ? (
                  <span className="text-sm text-muted-foreground">
                    / {getCatalogCycleLabel(variant.billingCycleDays)}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex min-h-6 flex-wrap items-center gap-2 text-xs">
                {savings ? (
                  <>
                    <del className="text-muted-foreground">
                      {formatCatalogAmount(savings.regularPrice, plan.currency)}
                    </del>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 font-medium text-emerald-700 dark:text-emerald-400">
                      Save {savings.discountPercentage}%
                    </span>
                  </>
                ) : null}
                {hasTrial ? (
                  <span className="rounded-full bg-blue-500/15 px-2.5 py-1 font-medium text-blue-700 dark:text-blue-400">
                    {plan.trialDays}-day free trial
                  </span>
                ) : null}
              </div>

              <div className="mt-4 space-y-2 rounded-xl bg-card p-4">
                {limits.length > 0 ? (
                  limits.map((entitlement) => (
                    <div
                      key={entitlement.featureKey}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {getCatalogEntitlementLabel(entitlement)}
                      </span>
                      <span className="font-medium">
                        {formatLimit(
                          entitlement.value,
                          features.find((f) => f.key === entitlement.featureKey)
                            ?.unit,
                        )}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No usage limits configured
                  </p>
                )}
              </div>

              {flags.length > 0 ? (
                <ul className="mt-5 space-y-2.5">
                  {flags.map((entitlement) => {
                    const included = entitlement.value > 0;
                    const Icon = included ? CheckIcon : XIcon;
                    return (
                      <li
                        key={entitlement.featureKey}
                        className={cn(
                          "flex items-start gap-2.5 text-sm",
                          !included && "text-muted-foreground",
                        )}
                      >
                        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                        <span>
                          <span className="sr-only">
                            {included ? "Included: " : "Not included: "}
                          </span>
                          {getCatalogEntitlementLabel(entitlement)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <div className="mt-7 flex-1" />

              <Button
                type="button"
                className="h-11 w-full"
                variant={isCurrent ? "secondary" : isPaid ? "default" : "outline"}
                disabled={isCurrent || !variant || !canSelect || checkout.isPending}
                onClick={() => {
                  if (!variant) return;
                  checkout.reset();
                  checkout.mutate({
                    planKey: plan.planKey,
                    variantKey: variant.variantKey,
                  });
                }}
              >
                {isCurrent ? (
                  "Current plan"
                ) : pendingPlan === plan.planKey ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Redirecting…
                  </>
                ) : !isPaid && hasActiveSubscription ? (
                  "Included in your plan"
                ) : hasTrial ? (
                  "Start free trial"
                ) : hasActiveSubscription ? (
                  `Upgrade to ${plan.name}`
                ) : (
                  `Choose ${plan.name}`
                )}
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function PlanTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium tracking-wider text-primary uppercase">
      {children}
    </span>
  );
}

function sortIncludedFirst(entitlements: CatalogEntitlement[]) {
  return [
    ...entitlements.filter((e) => e.value > 0),
    ...entitlements.filter((e) => e.value <= 0),
  ];
}

function formatLimit(value: number | undefined, unit?: string): string {
  if (value === undefined || value === null) return "Not configured";
  if (value < 0) return "Unlimited";
  return `${value.toLocaleString()}${unit ? ` ${unit}` : ""}`;
}
