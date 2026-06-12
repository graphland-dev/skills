import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDownIcon, Loader2Icon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import useAppContext from "@/hooks/useAppContext";
import { setActiveTenantUid } from "@/lib/bootstrap";
import { fetchMyTenants, identityQueryKeys } from "@/lib/identity";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function OrgSwitcher() {
  const { isMobile } = useSidebar();
  const { currentOrganization } = useAppContext();

  const tenantsQuery = useQuery({
    queryKey: identityQueryKeys.myTenants,
    queryFn: fetchMyTenants,
  });

  const tenants = tenantsQuery.data ?? [];
  const active = currentOrganization;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-medium text-sidebar-primary-foreground">
                {active?.name ? getInitials(active.name) : "?"}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {active?.name ?? "Select organization"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {active?.uid ?? "No tenant"}
                </span>
              </div>
              {tenantsQuery.isLoading ? (
                <Loader2Icon className="ml-auto size-4 animate-spin" />
              ) : (
                <ChevronsUpDownIcon className="ml-auto size-4" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            {tenants.length === 0 ? (
              <DropdownMenuItem disabled>No organizations</DropdownMenuItem>
            ) : (
              tenants.map((tenant) => (
                <DropdownMenuItem
                  key={tenant._id}
                  onClick={() => {
                    setActiveTenantUid(tenant.uid);
                    window.location.href = "/merchant";
                  }}
                >
                  {tenant.name}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
