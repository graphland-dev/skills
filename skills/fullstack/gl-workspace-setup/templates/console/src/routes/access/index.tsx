import { createFileRoute, redirect } from "@tanstack/react-router";

import { AccessPage } from "./~components";
import { getAccessCallbackPath, parseAccessSearch } from "./~util";

export const Route = createFileRoute("/access/")({
  validateSearch: parseAccessSearch,
  beforeLoad: ({ context, search }) => {
    if (context.session?.user) {
      throw redirect({
        href: getAccessCallbackPath(search.redirect),
      });
    }
  },
  component: AccessPage,
});
