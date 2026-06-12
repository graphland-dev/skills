type DashboardPageHeaderProps = {
  title: string;
  description?: string;
  Action?: React.ComponentType;
};

export function DashboardPageHeader({
  title,
  description,
  Action,
}: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {Action ? (
        <div className="shrink-0">
          <Action />
        </div>
      ) : null}
    </div>
  );
}
