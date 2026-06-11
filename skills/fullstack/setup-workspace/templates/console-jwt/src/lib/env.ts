import { z } from "zod";

declare global {
  interface Window {
    __ENV__?: Record<string, string>;
  }
}

const envSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_APP_DOMAIN: z.url(),
  VITE_STORAGE_API_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;

function getEnvValue(key: keyof Env): string {
  const runtimeValue = window.__ENV__?.[key];
  if (runtimeValue) {
    return runtimeValue;
  }

  return import.meta.env[key] ?? "";
}

function loadEnv(): Env {
  const rawEnv = {
    VITE_API_URL: getEnvValue("VITE_API_URL"),
    VITE_APP_DOMAIN: getEnvValue("VITE_APP_DOMAIN"),
    VITE_STORAGE_API_URL: getEnvValue("VITE_STORAGE_API_URL"),
  };

  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    if (import.meta.env.DEV) {
      throw new Error(`Invalid environment variables:\n${errors}`);
    }

    return rawEnv as Env;
  }

  return result.data;
}

export const env = loadEnv();
