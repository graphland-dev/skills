import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmationProvider } from "@/hooks/use-confirm";
import { queryClient } from "@/lib/tc-query.client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "./theme-provider";

export default function CommonProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ConfirmationProvider>{children}</ConfirmationProvider>
            <Toaster position="bottom-right" richColors />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
}
