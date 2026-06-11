import { Link, Outlet } from "@tanstack/react-router";
import { ArrowLeftIcon, CommandIcon } from "lucide-react";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";

export function AccountShell() {
  return (
    <div className="min-h-svh bg-muted">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 md:px-6">
          <Link to="/merchant" className="flex items-center gap-2 font-medium">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CommandIcon className="size-4" aria-hidden />
            </span>
            Console
          </Link>
          <div className="flex items-center gap-1">
            <ThemeSwitcher />
            <Button asChild variant="ghost" size="sm">
              <Link to="/merchant">
                <ArrowLeftIcon />
                Back to console
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
        <Outlet />
      </div>
    </div>
  );
}
