import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import LoadingScreen from "./components/LoadingScreen";
import CommonProvider from "./providers/CommonProvider";
import { bootstrapQueryKey, fetchBootstrap } from "./lib/bootstrap";
import { routeTree } from "./routeTree.gen";
import { useQuery } from "@tanstack/react-query";

const router = createRouter({
  routeTree,
  context: {
    session: null,
    currentOrganization: null,
    currentMemberRole: null,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const emptyRouterContext = {
  session: null,
  currentOrganization: null,
  currentMemberRole: null,
};

const Bootstrap = () => {
  const bootstrapQuery = useQuery({
    queryKey: bootstrapQueryKey,
    queryFn: fetchBootstrap,
  });

  const bootstrap = bootstrapQuery.data ?? emptyRouterContext;

  const routerContext = useMemo(
    () => ({
      session: bootstrap.session,
      currentOrganization: bootstrap.currentOrganization,
      currentMemberRole: bootstrap.currentMemberRole,
    }),
    [
      bootstrap.session,
      bootstrap.currentOrganization,
      bootstrap.currentMemberRole,
    ],
  );

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

  if (bootstrapQuery.isLoading && !bootstrapQuery.data) {
    return <LoadingScreen label="Bootstrapping..." />;
  }

  if (bootstrapQuery.isError) {
    return <RouterProvider router={router} context={emptyRouterContext} />;
  }

  return <RouterProvider router={router} context={routerContext} />;
};

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <CommonProvider>
        <Bootstrap />
      </CommonProvider>
    </StrictMode>,
  );
}
