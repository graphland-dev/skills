import { createFileRoute, redirect } from "@tanstack/react-router";

import { TokenService } from "@/lib/token-service";

export const Route = createFileRoute("/auth/login")({
  beforeLoad: () => {
    if (TokenService.isAuthenticated()) {
      throw redirect({ to: "/select-organization" });
    }
  },
});
