import LoadingScreen from "@/components/LoadingScreen";
import { TokenService } from "@/lib/token-service";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
  beforeLoad() {
    if (TokenService.isAuthenticated()) {
      throw redirect({ to: "/merchant" });
    }
    throw redirect({ to: "/auth/login" });
  },
});

function Index() {
  return <LoadingScreen label="Redirecting..." />;
}
