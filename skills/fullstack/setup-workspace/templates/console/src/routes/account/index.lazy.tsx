import { createLazyFileRoute } from "@tanstack/react-router";

import { AccountSettingsPage } from "./~components";

export const Route = createLazyFileRoute("/account/")({
  component: AccountSettingsPage,
});
