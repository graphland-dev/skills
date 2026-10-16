import { useEntitlement } from "@graphland/pgw-merchant/react";

import { getCatalogEntitlementLimit } from "@/lib/pgw-catalog";
import { cn } from "@/lib/utils";

/**
 * Quota bar for list pages (e.g. "Products 42 / 50"). Hidden for boolean
 * features. Warns at 80%, errors at 100%. `-1` limits render "Unlimited".
 */
export function EntitlementUsageProgress({
  featureKey,
  label,
  className,
}: {
  featureKey: string;
  label: string;
  className?: string;
}) {
  const { entitlement } = useEntitlement(featureKey);
  if (!entitlement || entitlement.type === "boolean") return null;

  return (
    <UsageBar
      className={className}
      label={label}
      used={entitlement.consumed ?? 0}
      limit={getCatalogEntitlementLimit(entitlement)}
    />
  );
}

export function UsageBar({
  label,
  used,
  limit,
  icon,
  className,
}: {
  label: string;
  used: number;
  limit: number | null;
  icon?: React.ReactNode;
  className?: string;
}) {
  const percentage = limit ? Math.min((used / limit) * 100, 100) : 0;
  const tone =
    percentage >= 100 ? "error" : percentage >= 80 ? "warning" : "ok";

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span
          className={cn(
            "font-medium",
            tone === "warning" && "text-amber-600",
            tone === "error" && "text-destructive",
          )}
        >
          {used.toLocaleString()} /{" "}
          {limit !== null ? limit.toLocaleString() : "Unlimited"}
        </span>
      </div>
      {limit !== null ? (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-[width]",
              tone === "ok" && "bg-emerald-500",
              tone === "warning" && "bg-amber-500",
              tone === "error" && "bg-destructive",
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
