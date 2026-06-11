import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function RequiredAsterisk() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="text-destructive ml-1 cursor-help"
          aria-label="Required"
          tabIndex={0}
        >
          *
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        Required
      </TooltipContent>
    </Tooltip>
  );
}

