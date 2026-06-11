import { useQuery } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";

import LoadingScreen from "@/components/LoadingScreen";
import {
  bootstrapQueryKey,
  emptyRouterContext,
  fetchBootstrap,
} from "@/lib/bootstrap";
import { TokenService } from "@/lib/token-service";
import { router } from "@/router";

export function Bootstrap() {
  const bootstrapQuery = useQuery({
    queryKey: bootstrapQueryKey,
    queryFn: fetchBootstrap,
    enabled: TokenService.isAuthenticated(),
    retry: false,
  });

  const routerContext = useMemo(() => {
    if (!TokenService.isAuthenticated()) {
      return emptyRouterContext;
    }
    return bootstrapQuery.data ?? emptyRouterContext;
  }, [bootstrapQuery.data]);

  const hasSyncedRouterContext = useRef(false);

  useEffect(() => {
    if (!bootstrapQuery.data) {
      return;
    }
    if (!hasSyncedRouterContext.current) {
      hasSyncedRouterContext.current = true;
      return;
    }
    void router.invalidate();
  }, [routerContext, bootstrapQuery.data]);

  if (TokenService.isAuthenticated() && bootstrapQuery.isLoading) {
    return <LoadingScreen label="Loading console..." />;
  }

  return <RouterProvider router={router} context={routerContext} />;
}
