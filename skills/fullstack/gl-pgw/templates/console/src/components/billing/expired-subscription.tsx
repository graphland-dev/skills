import { useCustomerInvoices } from "@graphland/pgw-merchant/react";
import { AlertTriangleIcon, FileTextIcon, Loader2Icon } from "lucide-react";

import { PlanComparison } from "@/components/billing/plan-comparison";
import { FormError } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { billingErrorMessage, usePayInvoice } from "@/lib/billing-api";
import { formatDateTime } from "@/lib/format";
import { formatCatalogAmount } from "@/lib/pgw-catalog";

/**
 * Renewal screen for `expired` subscriptions: pay an outstanding PGW invoice
 * (reopens hosted checkout for that invoice) or pick a plan.
 */
export function ExpiredSubscription({ tenant }: { tenant: string }) {
  const { data: invoices, loading } = useCustomerInvoices();
  const payInvoice = usePayInvoice(tenant);

  const unpaidInvoices =
    invoices?.filter(
      (invoice) => invoice.status === "pending" || invoice.status === "failed",
    ) ?? [];
  const payingInvoice = payInvoice.isPending ? payInvoice.variables : undefined;

  return (
    <main className="min-h-svh bg-muted/30 px-4 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center sm:p-8">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangleIcon className="size-6" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Your subscription has expired
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Your workspace is paused until a plan is active again. Pay an
            outstanding invoice or choose a plan below.
          </p>
        </section>

        <section className="rounded-2xl bg-background p-4 shadow-sm ring-1 ring-border/50 sm:p-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FileTextIcon className="size-5 text-muted-foreground" />
            Outstanding invoices
          </h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            Paying the pending balance reactivates your plan.
          </p>

          <FormError
            className="mb-4"
            title="Unable to open payment"
            errors={
              payInvoice.error
                ? [billingErrorMessage(payInvoice.error, "Unable to open payment")]
                : undefined
            }
          />

          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Loading invoices…
            </p>
          ) : unpaidInvoices.length > 0 ? (
            <div className="space-y-3">
              {unpaidInvoices.map((invoice) => (
                <Card key={invoice.invoiceUID} className="shadow-none">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {invoice.description || "Subscription charge"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {invoice.invoiceUID} · {formatDateTime(invoice.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className="text-sm font-semibold">
                        {formatCatalogAmount(invoice.amount, invoice.currency)}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        disabled={payInvoice.isPending}
                        onClick={() => {
                          payInvoice.reset();
                          payInvoice.mutate(invoice.invoiceUID);
                        }}
                      >
                        {payingInvoice === invoice.invoiceUID ? (
                          <>
                            <Loader2Icon className="mr-2 size-4 animate-spin" />
                            Redirecting…
                          </>
                        ) : (
                          "Pay now"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No outstanding invoices.
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-background p-4 shadow-sm ring-1 ring-border/50 sm:p-8">
          <h2 className="mb-6 text-center text-xl font-semibold tracking-tight">
            Choose a plan to reactivate
          </h2>
          <PlanComparison tenant={tenant} />
        </section>
      </div>
    </main>
  );
}
