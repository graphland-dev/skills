import type { CustomerQuotation } from "@graphland/pgw-merchant";
import { useCustomerQuotations } from "@graphland/pgw-merchant/react";
import { ExternalLinkIcon, FileSignatureIcon } from "lucide-react";

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
import { formatDate, formatDateTime } from "@/lib/format";
import { formatCatalogAmount } from "@/lib/pgw-catalog";

const STATUS_LABEL: Record<CustomerQuotation["status"], string> = {
  sent: "Awaiting response",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
};

function statusVariant(status: CustomerQuotation["status"]) {
  switch (status) {
    case "accepted":
      return "default" as const;
    case "declined":
      return "destructive" as const;
    case "expired":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

export function QuotationHistory() {
  const { data: quotations, loading, error } = useCustomerQuotations();

  return (
    <Card className="rounded-2xl shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSignatureIcon className="size-4 text-muted-foreground" />
          Quotations
        </CardTitle>
        <CardDescription>
          Custom offers. Open one to review, accept, or decline it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormError
          title="Unable to load quotations"
          errors={error ? [billingErrorMessage(error, "Please try again.")] : undefined}
        />

        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Loading quotations…
          </p>
        ) : quotations?.length ? (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid until</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation) => (
                  <TableRow key={quotation.quotationUID}>
                    <TableCell className="font-medium">
                      {quotation.quotationUID}
                      {quotation.revision > 1 ? (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          Rev {quotation.revision}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {quotation.subject || quotation.items[0]?.name || "Quotation"}
                    </TableCell>
                    <TableCell>
                      {formatCatalogAmount(quotation.amount, quotation.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(quotation.status)}>
                        {STATUS_LABEL[quotation.status] ?? quotation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {quotation.validUntil ? formatDate(quotation.validUntil) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDateTime(quotation.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={quotation.status === "sent" ? "default" : "ghost"}
                        size="sm"
                        asChild
                      >
                        <a
                          href={quotation.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLinkIcon className="size-3.5" />
                          {quotation.status === "sent" ? "Review" : "View"}
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : !error ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No quotations yet.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
