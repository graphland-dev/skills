import LoadingScreen from "@/components/LoadingScreen";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
  beforeLoad(ctx) {
    if (ctx.context.session?.user) {
      throw redirect({ to: "/merchant" });
    } else {
      throw redirect({ to: "/access" });
    }
  },
});

function Index() {
  return <LoadingScreen label="Redirecting..." />;
}
