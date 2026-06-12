import { createFileRoute, redirect } from "@tanstack/react-router";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export const Route = createFileRoute("/merchant")({
  beforeLoad(ctx) {
    if (!ctx.context.session?.user) {
      throw redirect({
        to: "/access",
        search: { redirect: window.location.pathname },
      });
    }
  },
  component: DashboardLayout,
});
