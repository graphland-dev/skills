import type { IRouteContext } from "@/lib/router-context";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export type { IRouteContext };

export const Route = createRootRouteWithContext<IRouteContext>()({
  component: () => (
    <>
      <Outlet />
      {!import.meta.env.PROD && (
        <TanStackRouterDevtools position="bottom-right" />
      )}
    </>
  ),
});
