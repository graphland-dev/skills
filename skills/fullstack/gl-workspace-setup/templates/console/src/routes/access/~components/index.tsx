import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { auth } from "@/lib/auth";
import { getRouteApi, Link } from "@tanstack/react-router";
import { CommandIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";

import { getAccessCallbackPath, type SocialProvider } from "../~util";

const accessRoute = getRouteApi("/access/");

export function AccessPage() {
  const { redirect: redirectTo } = accessRoute.useSearch();
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(
    null,
  );

  const callbackPath = getAccessCallbackPath(redirectTo);

  const handleSocialLogin = async (provider: SocialProvider) => {
    setLoadingProvider(provider);

    try {
      await auth.signIn.social({
        provider,
        callbackURL: `${window.location.origin}${callbackPath}`,
      });
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="absolute top-4 right-4 md:top-6 md:right-6">
        <ThemeSwitcher />
      </div>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <CommandIcon className="size-4" aria-hidden />
          </div>
          Console
        </Link>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your organization console.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field className="gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full"
                    disabled={loadingProvider !== null}
                    onClick={() => void handleSocialLogin("github")}
                  >
                    {loadingProvider === "github" ? (
                      <Loader2Icon className="animate-spin" aria-hidden />
                    ) : (
                      <GitHubIcon className="size-4" />
                    )}
                    Continue with GitHub
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full"
                    disabled={loadingProvider !== null}
                    onClick={() => void handleSocialLogin("google")}
                  >
                    {loadingProvider === "google" ? (
                      <Loader2Icon className="animate-spin" aria-hidden />
                    ) : (
                      <GoogleIcon className="size-4" />
                    )}
                    Continue with Google
                  </Button>
                  <FieldDescription className="text-center">
                    Use the account linked to your organization.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            By continuing, you agree to the acceptable use policies
            for console access.
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
    >
      <path
        d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
    >
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
        fill="currentColor"
      />
    </svg>
  );
}
