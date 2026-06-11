import { DashboardPageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import useAppContext from "@/hooks/useAppContext";

export function MerchantOverviewPage() {
  const { currentOrganization } = useAppContext();

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        title={
          currentOrganization?.name
            ? `${currentOrganization.name} overview`
            : "Console overview"
        }
        description="Your GraphLand console is ready. Scaffold the first feature module with the new-module skill."
      />

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>
            The foundation is wired: Better Auth session bootstrap, org context,
            dashboard shell, form primitives, and the DataTable wrapper.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Add API resources with the <code>new-api-module</code> skill, then
            add console list pages with <code>new-module</code>.
          </p>
          <p>
            Route conventions live in <code>docs/module.md</code> — co-locate
            data operations in <code>~util.ts</code> and UI in{" "}
            <code>~components/</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
