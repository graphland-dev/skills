import { Link } from "@tanstack/react-router";
import { CreditCardIcon, LockKeyholeIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isFeatureOpen, useFeatureAccess } from "@/hooks/use-feature-access";
import { formatCatalogName } from "@/lib/pgw-catalog";

/**
 * Locks a whole page or tab behind a boolean plan feature. UI hint only — the
 * API must enforce the same key (gate catalog or service check).
 */
export function FeatureGate({
  feature,
  tenant,
  title,
  children,
}: {
  feature: string;
  tenant: string;
  /** Human label for the locked area, e.g. "Coupons". */
  title?: string;
  children: ReactNode;
}) {
  const access = useFeatureAccess(feature);

  if (access.loading) return <Skeleton className="h-48 w-full" />;
  if (access.featureType && access.featureType !== "boolean") {
    return <>{children}</>;
  }
  if (isFeatureOpen(access)) return <>{children}</>;

  return <LockedFeature feature={feature} tenant={tenant} title={title} />;
}

/**
 * Wraps a create/action button. Boolean feature denied → upgrade link.
 * Quota exhausted → hidden (the list page stays usable).
 */
export function FeatureGateAction({
  feature,
  tenant,
  children,
}: {
  feature: string;
  tenant: string;
  children: ReactNode;
}) {
  const access = useFeatureAccess(feature);

  if (access.loading) {
    return (
      <Button type="button" disabled>
        Loading…
      </Button>
    );
  }
  if (isFeatureOpen(access)) return <>{children}</>;
  if (access.featureType !== "boolean") return null;

  return (
    <Button type="button" variant="outline" asChild>
      <Link
        to="/merchant/$tenant/billing"
        params={{ tenant }}
        search={{ tab: "plans" }}
      >
        <LockKeyholeIcon className="size-4" />
        Upgrade to unlock
      </Link>
    </Button>
  );
}

export function LockedFeature({
  feature,
  tenant,
  title,
}: {
  feature: string;
  tenant: string;
  title?: string;
}) {
  const areaLabel = title ?? formatCatalogName(feature);

  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <LockKeyholeIcon className="size-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {areaLabel} is not on your plan
          </h2>
          <p className="text-sm text-muted-foreground">
            Upgrade your subscription to unlock {areaLabel.toLowerCase()}.
          </p>
        </div>
        <Button asChild size="lg" className="mt-4">
          <Link
            to="/merchant/$tenant/billing"
            params={{ tenant }}
            search={{ tab: "plans" }}
          >
            <CreditCardIcon className="mr-2 size-5" />
            View plans
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
