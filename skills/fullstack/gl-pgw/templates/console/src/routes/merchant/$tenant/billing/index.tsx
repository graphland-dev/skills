import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const billingSearchSchema = z.object({
  tab: z
    .enum(["overview", "plans", "invoices", "quotations"])
    .optional()
    .catch(undefined),
  checkout: z.enum(["success", "cancelled", "failed"]).optional().catch(undefined),
});

export type BillingSearch = z.infer<typeof billingSearchSchema>;

export const Route = createFileRoute("/merchant/$tenant/billing/")({
  validateSearch: billingSearchSchema,
});
