import type { SubscriptionStatus } from "@graphland/pgw-merchant";
import {
  useEntitlements as usePgwEntitlements,
  usePgWContext,
} from "@graphland/pgw-merchant/react";
import {
  CreditCardIcon,
  GaugeIcon,
  Loader2Icon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";

import { UsageBar } from "@/components/billing/usage-progress";
import { FormError } from "@/components/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { billingErrorMessage, usePayInvoice } from "@/lib/billing-api";
import { formatDate } from "@/lib/format";
import {
  formatCatalogAmount,
  formatCatalogName,
  getCatalogEntitlementLimit,
  getCatalogFeatureLabel,
  usePgwCatalog,
} from "@/lib/pgw-catalog";
import { cn } from "@/lib/utils";

const STATUS_TONE: Partial<Record<SubscriptionStatus, string>> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  trialing: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  past_due: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  pending_payment: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  cancellation_scheduled: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  cancelled: "bg-destructive/15 text-destructive",
  expired: "bg-destructive/15 text-destructive",
};

const STATUS_LABEL: Partial<Record<SubscriptionStatus, string>> = {
  trialing: "Trial active",
  past_due: "Grace period",
  pending_payment: "Payment pending",
  cancellation_scheduled: "Cancels at period end",
};

export function SubscriptionOverview({ tenant }: { tenant: string }) {
  const pgwContext = usePgWContext();
  const entitlements = usePgwEntitlements();
  const catalogQuery = usePgwCatalog();
  const payInvoice = usePayInvoice(tenant);

  const subscription = pgwContext.data?.subscription ?? null;
  const pendingInvoice = pgwContext.data?.pendingInvoice ?? null;
  const status = subscription?.status;
  const catalogPlan = catalogQuery.data?.plans.find(
    (plan) => plan.planKey === subscription?.planKey,
  );
  const usageRows = (catalogQuery.data?.features ?? []).filter(
    (feature) => feature.type !== "boolean" && Boolean(entitlements[feature.key]),
  );

  if (pgwContext.loading) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FormError
        title="Unable to open payment"
        errors={
          payInvoice.error
            ? [billingErrorMessage(payInvoice.error, "Unable to open payment")]
            : undefined
        }
      />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-2xl shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CreditCardIcon className="size-5" />
                </div>
                <p className="text-sm font-medium">Current subscription</p>
              </div>
              <Badge
                className={cn(
                  "border-0",
                  (status && STATUS_TONE[status]) || "bg-muted text-muted-foreground",
                )}
              >
                {status
                  ? (STATUS_LABEL[status] ?? formatCatalogName(status))
                  : "Not active"}
              </Badge>
            </div>

            <CardTitle className="mt-8 text-3xl tracking-tight">
              {catalogPlan?.name ??
                (subscription?.planKey
                  ? formatCatalogName(subscription.planKey)
                  : "No active plan")}
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {status === "trialing"
                ? `Your trial includes everything on this plan${
                    subscription?.trialEnd
                      ? ` until ${formatDate(subscription.trialEnd)}`
                      : ""
                  }.`
                : status === "past_due" && subscription?.graceEndsAt
                  ? `Your grace period ends on ${formatDate(
                      subscription.graceEndsAt,
                    )}. Pay the pending invoice to keep access.`
                  : "Your tools and limits come from this plan. Change it in the Plans tab."}
            </p>

            {pendingInvoice ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-destructive/5 p-3 ring-1 ring-destructive/20">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    Pending payment ·{" "}
                    {formatCatalogAmount(
                      pendingInvoice.amount,
                      pendingInvoice.currency,
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Invoice {pendingInvoice.invoiceNumber}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={payInvoice.isPending}
                  onClick={() => {
                    payInvoice.reset();
                    payInvoice.mutate(pendingInvoice.invoiceNumber);
                  }}
                >
                  {payInvoice.isPending ? (
                    <>
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                      Opening payment…
                    </>
                  ) : (
                    "Pay now"
                  )}
                </Button>
              </div>
            ) : null}
          </CardHeader>
        </Card>

        <Card className="rounded-2xl shadow-none">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Usage this period</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Usage against your plan limits.
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ZapIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {usageRows.length > 0 ? (
              <div className="space-y-6">
                {usageRows.map((feature) => {
                  const entitlement = entitlements[feature.key];
                  if (!entitlement) return null;
                  return (
                    <UsageBar
                      key={feature.key}
                      label={getCatalogFeatureLabel(feature)}
                      used={entitlement.consumed ?? 0}
                      limit={getCatalogEntitlementLimit(entitlement)}
                      icon={
                        feature.type === "non_consumable" ? (
                          <UsersIcon className="size-3" />
                        ) : (
                          <GaugeIcon className="size-3" />
                        )
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-muted/40 px-4 py-8 text-center">
                <p className="text-sm font-medium">No usage to show yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Usage appears here as plan resources are used.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
