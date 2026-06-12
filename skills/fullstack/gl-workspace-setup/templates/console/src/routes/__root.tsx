import { auth } from "@/lib/auth";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export interface IRouteContext {
  session: typeof auth.$Infer.Session | null;
  currentOrganization: typeof auth.$Infer.Organization | null;
  currentMemberRole: string | null;
}

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
