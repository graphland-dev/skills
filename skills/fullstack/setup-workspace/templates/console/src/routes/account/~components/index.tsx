import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, UnlinkIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { FormError } from "@/components/form";
import { FormFieldInput } from "@/components/form/form-field-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { useConfirmation } from "@/hooks/use-confirm";
import useAppContext from "@/hooks/useAppContext";
import { bootstrapQueryKey } from "@/lib/bootstrap";
import {
  accountQueryKeys,
  getProviderLabel,
  linkSocialAccount,
  listLinkedAccounts,
  SOCIAL_PROVIDERS,
  type SocialProvider,
  unlinkSocialAccount,
  updateAccountProfile,
} from "@/lib/account";

export function AccountSettingsPage() {
  const { session } = useAppContext();
  const user = session?.user;
  const queryClient = useQueryClient();
  const confirmation = useConfirmation();
  const [name, setName] = React.useState(user?.name ?? "");
  const [formErrors, setFormErrors] = React.useState<string[]>([]);
  const [linkingProvider, setLinkingProvider] =
    React.useState<SocialProvider | null>(null);

  React.useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  const linkedAccountsQuery = useQuery({
    queryKey: accountQueryKeys.linkedAccounts(),
    queryFn: listLinkedAccounts,
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateAccountProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bootstrapQueryKey });
      void queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success("Profile updated");
      setFormErrors([]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: unlinkSocialAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountQueryKeys.all });
      toast.success("Account unlinked");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const linkedAccounts = linkedAccountsQuery.data ?? [];
  const canUnlink = linkedAccounts.length > 1;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  async function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormErrors(["Name is required"]);
      return;
    }

    if (trimmedName === user?.name) {
      setFormErrors(["No changes to save"]);
      return;
    }

    setFormErrors([]);
    await updateProfileMutation.mutateAsync({ name: trimmedName });
  }

  async function handleLinkProvider(provider: SocialProvider) {
    setLinkingProvider(provider);

    try {
      await linkSocialAccount(provider);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to link account",
      );
    } finally {
      setLinkingProvider(null);
    }
  }

  function handleUnlink(providerId: string) {
    confirmation.trigger({
      title: `Unlink ${getProviderLabel(providerId)}`,
      description: canUnlink
        ? `You will no longer be able to sign in with ${getProviderLabel(providerId)}.`
        : "You must keep at least one linked sign-in method.",
      confirmText: "Unlink",
      onConfirm: async () => {
        if (!canUnlink) {
          return;
        }

        await unlinkMutation.mutateAsync(providerId);
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        title="Account settings"
        description="Manage your profile and linked sign-in methods."
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Basic information for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-6" onSubmit={handleProfileSubmit}>
            <div className="flex items-center gap-4">
              <Avatar className="size-16 rounded-xl">
                <AvatarImage
                  src={user?.image ?? undefined}
                  alt={user?.name ?? ""}
                />
                <AvatarFallback className="rounded-xl text-base">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-medium">{user?.name ?? "User"}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.email ?? "No email on file"}
                </p>
              </div>
            </div>

            <FormError errors={formErrors} />

            <FieldGroup>
              <FormFieldInput
                label="Display name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={updateProfileMutation.isPending}
              />
              <FormFieldInput
                label="Email"
                value={user?.email ?? ""}
                disabled
                description="Email is managed by your linked sign-in provider."
              />
            </FieldGroup>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <Loader2Icon className="animate-spin" aria-hidden />
                ) : null}
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Linked accounts</CardTitle>
          <CardDescription>
            Connect GitHub or Google to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {linkedAccountsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading linked accounts…
            </p>
          ) : (
            <>
              {SOCIAL_PROVIDERS.map((provider) => {
                const linked = linkedAccounts.find(
                  (account) => account.providerId === provider,
                );
                const isLinking = linkingProvider === provider;

                return (
                  <div
                    key={provider}
                    className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {getProviderLabel(provider)}
                        </p>
                        {linked ? (
                          <Badge variant="default">Connected</Badge>
                        ) : (
                          <Badge variant="secondary">Not connected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {linked
                          ? `Linked on ${new Date(linked.createdAt ?? Date.now()).toLocaleDateString()}`
                          : `Connect your ${getProviderLabel(provider)} account.`}
                      </p>
                    </div>

                    {linked ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canUnlink || unlinkMutation.isPending}
                        onClick={() => handleUnlink(provider)}
                      >
                        <UnlinkIcon />
                        Unlink
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={linkingProvider !== null}
                        onClick={() => void handleLinkProvider(provider)}
                      >
                        {isLinking ? (
                          <Loader2Icon className="animate-spin" aria-hidden />
                        ) : null}
                        Connect
                      </Button>
                    )}
                  </div>
                );
              })}

              {!canUnlink && linkedAccounts.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Link another provider before unlinking your only sign-in
                  method.
                </p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
