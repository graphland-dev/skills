import { usePgWContext } from "@graphland/pgw-merchant/react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PlanComparison } from "@/components/billing/plan-comparison";
import { FormError } from "@/components/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { BillingSearch } from "./index";
import { InvoiceHistory } from "./~components/invoice-history";
import { QuotationHistory } from "./~components/quotation-history";
import { SubscriptionOverview } from "./~components/subscription-overview";

export const Route = createLazyFileRoute("/merchant/$tenant/billing/")({
  component: BillingPage,
});

type BillingTab = NonNullable<BillingSearch["tab"]>;

function BillingPage() {
  const { tenant } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { refresh } = usePgWContext();
  const [checkoutError, setCheckoutError] = useState<string>();

  const activeTab: BillingTab = search.tab ?? "overview";
  const checkoutOutcome = search.checkout;

  // Return from hosted checkout. PGW settles asynchronously, so refresh now
  // and once more shortly after; always clear the param so reloads are quiet.
  useEffect(() => {
    if (!checkoutOutcome) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (checkoutOutcome === "success") {
      toast.success("Payment received — your plan will update shortly.");
      void refresh();
      timer = setTimeout(() => void refresh(), 4000);
    } else if (checkoutOutcome === "failed") {
      setCheckoutError("Payment failed. No charge was made — please try again.");
    }

    void navigate({
      search: (prev) => ({ ...prev, checkout: undefined }),
      replace: true,
    });
    return () => clearTimeout(timer);
  }, [checkoutOutcome, navigate, refresh]);

  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Billing & subscription
        </h1>
        <p className="text-sm text-muted-foreground">
          Your plan, usage, invoices, and quotations.
        </p>
      </header>

      <FormError
        title="Checkout did not complete"
        errors={checkoutError ? [checkoutError] : undefined}
      />

      <Tabs
        value={activeTab}
        onValueChange={(tab) =>
          void navigate({
            search: (prev) => ({ ...prev, tab: tab as BillingTab }),
            replace: true,
          })
        }
      >
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="quotations">Quotations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SubscriptionOverview tenant={tenant} />
        </TabsContent>
        <TabsContent value="plans">
          <PlanComparison tenant={tenant} />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoiceHistory />
        </TabsContent>
        <TabsContent value="quotations">
          <QuotationHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
