import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEntitlements } from '@/hooks/use-entitlements';
import { statusLabel } from '@/lib/billing';

/** Global banner shown whenever the subscription is not active. */
export function BillingBanner() {
  const { entitlements } = useEntitlements();

  if (!entitlements || entitlements.status === 'active') {
    return null;
  }

  const limit = entitlements.limits.maxRequestsPerPeriod;
  const usageLine =
    limit != null
      ? `${entitlements.usage.requestsUsed} / ${limit} requests used`
      : null;

  let description = 'Manage billing to restore full access.';
  if (entitlements.status === 'trialing') {
    const ends = entitlements.trialEndsAt
      ? new Date(entitlements.trialEndsAt).toLocaleDateString()
      : '';
    description = [`Trial ends ${ends}`, usageLine].filter(Boolean).join(' · ');
  } else if (
    entitlements.status === 'awaiting_payment' ||
    entitlements.status === 'past_due'
  ) {
    description = 'Paid features are blocked until you pay.';
  }

  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardHeader>
        <CardTitle className="text-base">
          {statusLabel(entitlements.status)}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild size="sm">
          <Link to="/billing">Manage billing</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
