import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ChevronsUpDownIcon,
  Loader2Icon,
  PlusIcon,
  SettingsIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { CreateOrganizationDialog } from "@/components/dashboard/create-organization-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import useAppContext from "@/hooks/useAppContext";
import { useOrgAccess } from "@/hooks/use-org-access";
import {
  getOrganizationInitials,
  listOrganizations,
  organizationQueryKeys,
  setActiveOrganization,
} from "@/lib/organizations";
import { cn } from "@/lib/utils";

function OrganizationAvatar({
  name,
  logo,
  className,
}: {
  name: string;
  logo?: string | null;
  className?: string;
}) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className={cn("size-8 rounded-lg object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground",
        className,
      )}
    >
      {getOrganizationInitials(name)}
    </div>
  );
}

export function OrgSwitcher() {
  const { isMobile } = useSidebar();
  const { session, currentOrganization } = useAppContext();
  const { roleLabel } = useOrgAccess();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [pendingOrganizationId, setPendingOrganizationId] = React.useState<
    string | null
  >(null);

  const organizationsQuery = useQuery({
    queryKey: organizationQueryKeys.list(),
    queryFn: listOrganizations,
    enabled: Boolean(session?.user),
  });

  const switchMutation = useMutation({
    mutationFn: setActiveOrganization,
    onMutate: (organizationId) => {
      setPendingOrganizationId(organizationId);
    },
    onSuccess: () => {
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      setPendingOrganizationId(null);
    },
  });

  const openSettingsMutation = useMutation({
    mutationFn: async ({
      organizationId,
      isActive,
    }: {
      organizationId: string;
      isActive: boolean;
    }) => {
      if (!isActive) {
        await setActiveOrganization(organizationId);
      }

      window.location.href = "/merchant/settings";
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (!session?.user) {
    return null;
  }

  const organizations = organizationsQuery.data ?? [];
  const activeOrganizationId =
    pendingOrganizationId ?? currentOrganization?.id ?? null;
  const activeOrganization =
    organizations.find((org) => org.id === activeOrganizationId) ??
    currentOrganization;
  const isSwitching =
    switchMutation.isPending || openSettingsMutation.isPending;

  function handleOpenOrgSettings(
    organizationId: string,
    isActive: boolean,
  ) {
    setDropdownOpen(false);
    openSettingsMutation.mutate({ organizationId, isActive });
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label="Switch organization"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={organizationsQuery.isLoading || isSwitching}
            >
              {organizationsQuery.isLoading ? (
                <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-accent">
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                </div>
              ) : activeOrganization ? (
                <OrganizationAvatar
                  name={activeOrganization.name}
                  logo={activeOrganization.logo}
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-accent text-xs font-semibold">
                  ?
                </div>
              )}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeOrganization?.name ?? "Select organization"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {roleLabel}
                  {organizations.length > 0
                    ? ` · ${organizations.length} org${organizations.length === 1 ? "" : "s"}`
                    : ""}
                </span>
              </div>
              {isSwitching ? (
                <Loader2Icon
                  className="ml-auto size-4 animate-spin"
                  aria-hidden
                />
              ) : (
                <ChevronsUpDownIcon className="ml-auto size-4" aria-hidden />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {organizations.length === 0 ? (
              <DropdownMenuItem disabled>No organizations</DropdownMenuItem>
            ) : (
              organizations.map((organization) => {
                const isActive = organization.id === activeOrganizationId;

                return (
                  <div
                    key={organization.id}
                    className="flex items-center gap-0.5 px-1"
                  >
                    <DropdownMenuItem
                      className="min-w-0 flex-1 gap-2 p-2"
                      disabled={isActive || isSwitching}
                      onSelect={(event) => {
                        event.preventDefault();
                        switchMutation.mutate(organization.id);
                      }}
                    >
                      <OrganizationAvatar
                        name={organization.name}
                        logo={organization.logo}
                        className="size-6 rounded-md text-[10px]"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {organization.name}
                      </span>
                      {isActive ? (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          Active
                        </span>
                      ) : null}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="size-7 shrink-0 justify-center p-0"
                      disabled={isSwitching}
                      aria-label={`Settings for ${organization.name}`}
                      onSelect={(event) => {
                        event.preventDefault();
                        handleOpenOrgSettings(organization.id, isActive);
                      }}
                    >
                      <SettingsIcon aria-hidden />
                    </DropdownMenuItem>
                  </div>
                );
              })
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              disabled={isSwitching}
              onSelect={(event) => {
                event.preventDefault();
                setDropdownOpen(false);
                setCreateDialogOpen(true);
              }}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <PlusIcon className="size-4" aria-hidden />
              </div>
              Create organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>

      <CreateOrganizationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
