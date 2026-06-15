import { Link } from '@tanstack/react-router';
import { LockIcon } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFeatureGate } from '@/hooks/use-feature-gate';
import type { BillingFeatureKey } from '@/lib/billing';
import { cn } from '@/lib/utils';

type FeatureGateButtonProps = React.ComponentProps<typeof Button> & {
  feature: BillingFeatureKey;
  lockIconOnly?: boolean;
};

/**
 * Renders a normal button when the feature is unlocked; a disabled lock button
 * with an upgrade tooltip when locked. UX only — the API still enforces.
 */
export function FeatureGateButton({
  feature,
  children,
  className,
  disabled,
  onClick,
  lockIconOnly = false,
  ...props
}: FeatureGateButtonProps) {
  const { locked, lockMessage, isLoading } = useFeatureGate(feature);

  if (locked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex', className)}>
            <Button {...props} type="button" disabled>
              <LockIcon className="size-4 shrink-0" aria-hidden />
              {lockIconOnly ? null : children}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-56 text-xs">
          <p>{lockMessage}</p>
          <Link
            to="/billing"
            className="mt-1 inline-block font-medium text-primary underline-offset-4 hover:underline"
          >
            View plans
          </Link>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      {...props}
      className={className}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
