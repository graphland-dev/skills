import {
  useCustomerInvoices,
  usePgWContext,
} from "@graphland/pgw-merchant/react";
import { EyeIcon, FileTextIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";

import { FormError } from "@/components/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { billingErrorMessage } from "@/lib/billing-api";
import { formatDateTime } from "@/lib/format";
import { formatCatalogAmount, formatCatalogName } from "@/lib/pgw-catalog";

function statusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
      return "default" as const;
    case "failed":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

export function InvoiceHistory() {
  const { client } = usePgWContext();
  const { data: invoices, loading, error } = useCustomerInvoices();
  const [openingInvoice, setOpeningInvoice] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string>();

  const viewInvoice = async (invoiceUID: string) => {
    setOpenError(undefined);
    setOpeningInvoice(invoiceUID);
    // Open the tab before awaiting so popup blockers treat it as user-initiated.
    const tab = window.open("", "_blank");
    try {
      const { url } = await client.getPublicPreview(invoiceUID);
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (cause) {
      tab?.close();
      setOpenError(billingErrorMessage(cause, "Unable to open invoice"));
    } finally {
      setOpeningInvoice(null);
    }
  };

  return (
    <Card className="rounded-2xl shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileTextIcon className="size-4 text-muted-foreground" />
          Billing history
        </CardTitle>
        <CardDescription>Your invoices, newest first.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormError
          title="Unable to load invoices"
          errors={error ? [billingErrorMessage(error, "Please try again.")] : undefined}
        />
        <FormError
          title="Unable to open invoice"
          errors={openError ? [openError] : undefined}
        />

        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Loading invoices…
          </p>
        ) : invoices?.length ? (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.invoiceUID}>
                    <TableCell className="font-medium">
                      {invoice.invoiceUID}
                    </TableCell>
                    <TableCell>
                      {invoice.description || "Subscription charge"}
                    </TableCell>
                    <TableCell>
                      {formatCatalogAmount(invoice.amount, invoice.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(invoice.status)}>
                        {formatCatalogName(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDateTime(invoice.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={openingInvoice !== null}
                        onClick={() => void viewInvoice(invoice.invoiceUID)}
                      >
                        {openingInvoice === invoice.invoiceUID ? (
                          <Loader2Icon className="size-3.5 animate-spin" />
                        ) : (
                          <EyeIcon className="size-3.5" />
                        )}
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : !error ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No invoices yet.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
