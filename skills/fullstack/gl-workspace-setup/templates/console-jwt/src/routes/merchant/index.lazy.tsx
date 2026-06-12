import { createLazyFileRoute } from "@tanstack/react-router";

import { MerchantOverviewPage } from "./~components";

export const Route = createLazyFileRoute("/merchant/")({
  component: MerchantOverviewPage,
});
