import { LoaderIcon } from "lucide-react";

const LoadingScreen: React.FC<{ label?: string }> = ({
  label = "Loading...",
}) => {
  return (
    <div className="flex items-center justify-center h-screen flex-col gap-2">
      <LoaderIcon className="size-10 animate-spin" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
};

export default LoadingScreen;
