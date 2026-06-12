import { createRouter } from "@tanstack/react-router";

import { emptyRouterContext } from "@/lib/bootstrap";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
  context: emptyRouterContext,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
