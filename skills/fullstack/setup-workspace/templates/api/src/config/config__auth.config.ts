import { parseOrigins } from '@/config/parse-origins';

export default () => ({
  auth: {
    secret: process.env.BETTER_AUTH_SECRET,
    url: process.env.BETTER_AUTH_URL,
    trustedOrigins: parseOrigins(
      process.env.TRUSTED_ORIGINS,
      process.env.CORS_ORIGIN,
      process.env.BETTER_AUTH_URL,
    ),
    // M2M clients (curl, backend jobs) often have no Origin header.
    // Default true; set AUTH_DISABLE_CSRF_CHECK=false to enforce origin checks.
    disableCsrfCheck: process.env.AUTH_DISABLE_CSRF_CHECK !== 'false',
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
});
