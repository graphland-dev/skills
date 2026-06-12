import { cn } from "@/lib/utils";

type AppLogoProps = {
  className?: string;
  iconClassName?: string;
  name?: string;
};

const defaultName =
  import.meta.env.VITE_APP_NAME?.trim() || "Your App";

export function AppLogo({
  className,
  iconClassName,
  name = defaultName,
}: AppLogoProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground",
          iconClassName,
        )}
      >
        {initial}
      </div>
      <span className="text-lg font-semibold">{name}</span>
    </div>
  );
}
