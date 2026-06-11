import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const auth = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  basePath: "/auth",
  plugins: [organizationClient()],
});
