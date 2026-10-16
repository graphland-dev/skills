import type { SubscriptionStatus } from "@graphland/pgw-merchant";
import {
  PgWProvider,
  usePgWContext,
  useSubscription,
} from "@graphland/pgw-merchant/react";
import { useLocation } from "@tanstack/react-router";
import { LockKeyholeIcon } from "lucide-react";
import type { ReactNode } from "react";

import { ExpiredSubscription } from "@/components/billing/expired-subscription";
import { PlanComparison } from "@/components/billing/plan-comparison";
import { env } from "@/lib/env";

/** Statuses that keep the workspace open. Keep in sync with SDK `SubscriptionStatus`. */
const WORKSPACE_OPEN_STATUSES: SubscriptionStatus[] = [
  "active",
  "trialing",
  "cancellation_scheduled",
  "past_due",
  "pending_payment",
];

/**
 * One PgWProvider per active billing customer (the tenant), mounted in the
 * tenant layout. Every billing hook below reads its single bootstrap request.
 *
 *   <BillingWorkspace tenant={tenant}><DashboardFrame /></BillingWorkspace>
 */
export function BillingWorkspace({
  tenant,
  children,
}: {
  tenant: string;
  children: ReactNode;
}) {
  return (
    <PgWProvider
      clientId={env.VITE_PGW_CLIENT_ID}
      billingCustomerId={tenant}
      publicApiKey={env.VITE_PGW_PUBLIC_API_KEY}
      baseUrl={env.VITE_PGW_BASE_URL || undefined}
    >
      <SubscriptionGate tenant={tenant}>{children}</SubscriptionGate>
    </PgWProvider>
  );
}

function SubscriptionGate({
  tenant,
  children,
}: {
  tenant: string;
  children: ReactNode;
}) {
  const location = useLocation();
  const { loading } = usePgWContext();
  const subscription = useSubscription();
  const status = subscription?.status;

  if (loading) return <FullScreenLoader />;

  // Billing must stay reachable in every state, or users can't fix billing.
  if (location.pathname.startsWith(`/merchant/${tenant}/billing`)) {
    return <>{children}</>;
  }

  if (status === "expired") return <ExpiredSubscription tenant={tenant} />;
  if (!status || !WORKSPACE_OPEN_STATUSES.includes(status)) {
    return <SubscriptionRequired tenant={tenant} />;
  }

  return <>{children}</>;
}

function SubscriptionRequired({ tenant }: { tenant: string }) {
  return (
    <main className="min-h-svh bg-muted/30 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LockKeyholeIcon className="size-6" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Choose a plan to get started
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Your workspace opens as soon as a plan is active. You can change
            plans anytime from Billing.
          </p>
        </section>
        <section className="mt-12 rounded-2xl bg-background p-4 shadow-sm ring-1 ring-border/50 sm:p-8">
          <PlanComparison tenant={tenant} />
        </section>
      </div>
    </main>
  );
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}
