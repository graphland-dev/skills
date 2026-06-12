import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";

import { AppLogo } from "@/components/auth/app-logo";
import LoadingScreen from "@/components/shared/LoadingScreen";
import { TenantLogo } from "@/components/shared/tenant-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMyTenants, identityQueryKeys } from "@/lib/identity";
import { TokenService } from "@/lib/token-service";
import { cn } from "@/lib/utils";

export const Route = createLazyFileRoute("/select-organization/")({
  pendingComponent: LoadingScreen,
  component: SelectOrganizationPage,
});

function SelectOrganizationPage() {
  if (!TokenService.isAuthenticated()) {
    return <Navigate to="/auth/login" />;
  }

  const tenantsQuery = useQuery({
    queryKey: identityQueryKeys.myTenants,
    queryFn: fetchMyTenants,
  });

  useEffect(() => {
    if (tenantsQuery.isError) {
      TokenService.removeToken();
      window.location.href = "/auth/login";
    }
  }, [tenantsQuery.isError]);

  const tenants = tenantsQuery.data ?? [];

  return (
    <div className="min-h-svh bg-muted px-4 py-10 md:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <AppLogo className="mb-8" />

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Select Organization</CardTitle>
            <CardDescription>
              Choose an organization to continue to your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tenantsQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : tenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No organizations found for your account.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {tenants.map((tenant) => (
                  <Link
                    key={tenant._id}
                    from="/select-organization/"
                    to="/merchant/$tenant"
                    params={{ tenant: tenant.uid }}
                    className={cn(
                      "block rounded-lg border bg-muted/40 p-4 transition-all",
                      "hover:border-primary hover:bg-card hover:shadow-sm",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-card">
                        <TenantLogo
                          name={tenant.name}
                          uid={tenant.uid}
                          logo={tenant.logo}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{tenant.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {tenant.uid}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {tenantsQuery.isFetching && !tenantsQuery.isLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                Refreshing organizations...
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
