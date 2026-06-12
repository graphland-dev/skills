import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type FormSheetShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  formId: string;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  hideFooter?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
};

export function FormSheetShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  formId,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isSubmitting = false,
  hideFooter = false,
  side = "right",
  className,
}: FormSheetShellProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={cn("flex w-full flex-col sm:max-w-md", className)}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">{children}</div>

        {!hideFooter ? (
          <SheetFooter className="flex-row justify-end gap-2 border-t px-4 pt-4">
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                {cancelLabel}
              </Button>
            </SheetClose>
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : submitLabel}
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
