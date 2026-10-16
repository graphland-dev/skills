import { usePgWContext } from "@graphland/pgw-merchant/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { gql, gqlRequest } from "@/lib/gql-client";

export const BillingCreateCheckoutMutation = gql`
  mutation Billing__createCheckout($input: CreatePgwCheckoutInput!) {
    billing__createCheckout(input: $input) {
      sessionId
      redirectUrl
      invoiceId
    }
  }
`;

export const BillingPayInvoiceMutation = gql`
  mutation Billing__payInvoice($input: PayPgwInvoiceInput!) {
    billing__payInvoice(input: $input) {
      sessionId
      redirectUrl
      invoiceId
    }
  }
`;

type CheckoutSession = {
  sessionId: string;
  redirectUrl?: string | null;
  invoiceId: string;
};

export function billingErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * Starts hosted checkout for a plan + variant. Free variants activate
 * immediately and return no redirect, so the snapshot is refreshed instead.
 * Errors are returned to the caller for inline display — never toasted.
 */
export function useCreateCheckout(tenant: string) {
  const { refresh } = usePgWContext();

  return useMutation({
    mutationFn: (input: { planKey: string; variantKey: string }) =>
      gqlRequest<{ billing__createCheckout: CheckoutSession }>({
        query: BillingCreateCheckoutMutation,
        variables: { input },
        tenant,
      }),
    onSuccess: (data) => {
      const url = data.billing__createCheckout.redirectUrl;
      if (url) {
        toast.success("Redirecting to checkout…");
        window.location.href = url;
      } else {
        toast.success("Your subscription has been updated.");
        void refresh();
      }
    },
  });
}

/** Reopens hosted checkout for an existing PGW invoice. */
export function usePayInvoice(tenant: string) {
  return useMutation({
    mutationFn: (invoiceNumber: string) =>
      gqlRequest<{ billing__payInvoice: CheckoutSession }>({
        query: BillingPayInvoiceMutation,
        variables: { input: { invoiceNumber } },
        tenant,
      }),
    onSuccess: (data) => {
      const url = data.billing__payInvoice.redirectUrl;
      if (url) {
        toast.success("Redirecting to payment…");
        window.location.href = url;
      }
    },
  });
}
