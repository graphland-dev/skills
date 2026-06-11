import { createFileRoute, redirect } from "@tanstack/react-router";

import { AccountShell } from "@/components/account/account-shell";

export const Route = createFileRoute("/account")({
  beforeLoad(ctx) {
    if (!ctx.context.session?.user) {
      throw redirect({
        to: "/access",
        search: { redirect: window.location.pathname },
      });
    }
  },
  component: AccountShell,
});
