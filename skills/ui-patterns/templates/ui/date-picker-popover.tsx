"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDatePattern, formatIsoDateOnly } from "@/lib/date-format";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

function parsePickerValue(value: string | undefined): Date | undefined {
  if (!value?.trim()) return undefined;
  const d = new Date(value.trim());
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export type DatePickerPopoverOutput = "iso" | "date-only";

export interface DatePickerPopoverProps {
  id?: string;
  "aria-label"?: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  /** How selected dates are emitted. Default `iso` (matches legacy `Input type="date"` + `toISOString()`). */
  output?: DatePickerPopoverOutput;
  fromDate?: Date;
  toDate?: Date;
  /** Display pattern for the trigger label (default `PPP` — long date). */
  displayFormat?: string;
  /** Show a clear control in the popover when there is a value (optional filters). */
  allowClear?: boolean;
}

export function DatePickerPopover({
  id,
  "aria-label": ariaLabel,
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
  buttonClassName,
  output = "iso",
  fromDate,
  toDate,
  displayFormat = "PPP",
  allowClear,
}: DatePickerPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parsePickerValue(value);

  const commitDate = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }
    if (output === "date-only") {
      onChange(formatIsoDateOnly(date));
    } else {
      onChange(date.toISOString());
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            buttonClassName,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {selected ? (
            <span className="truncate">
              {formatDatePattern(selected, displayFormat)}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0", className)} align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            commitDate(date);
            setOpen(false);
          }}
          disabled={disabled}
          fromDate={fromDate}
          toDate={toDate}
          initialFocus
        />
        {allowClear && value ? (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
