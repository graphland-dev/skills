import { Link } from '@tanstack/react-router';
import { LockIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEntitlements } from '@/hooks/use-entitlements';
import { BILLING_FEATURE_LABELS, type BillingFeatureKey } from '@/lib/billing';

type PlanFeatureGateProps = {
  feature: BillingFeatureKey;
  children: React.ReactNode;
};

/** Wraps a whole section: renders children when unlocked, an upgrade card otherwise. */
export function PlanFeatureGate({ feature, children }: PlanFeatureGateProps) {
  const { hasFeature, isLoading, getLockMessage } = useEntitlements();

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (hasFeature(feature)) {
    return children;
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <LockIcon className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <CardTitle>{BILLING_FEATURE_LABELS[feature]} unavailable</CardTitle>
        <CardDescription>{getLockMessage(feature)}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link to="/billing">Upgrade plan</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
