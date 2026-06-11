import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

type AccessDeniedProps = {
  title?: string;
  description?: string;
};

export function AccessDenied({
  title = "Access denied",
  description = "You do not have permission to view this page in the current organization.",
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed p-8">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link to="/merchant">Back to overview</Link>
      </Button>
    </div>
  );
}
