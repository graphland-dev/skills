import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDatePattern, tryParseDateInput } from "@/lib/date-format";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

interface FormFieldDatePickerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  dateFormat?: string;
  showTime?: boolean;
  fromDate?: Date;
  toDate?: Date;
  /**
   * When true, renders a text input the user can type into, with a calendar
   * icon button that opens the date picker popover. When false (default),
   * renders a single button that opens the popover.
   */
  editable?: boolean;
}

function hour12PartsFromDate(d: Date): {
  hour12: number;
  minute: number;
  period: "AM" | "PM";
} {
  const h = d.getHours();
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: d.getMinutes(), period };
}

function apply12HourClock(
  target: Date,
  hour12: number,
  minute: number,
  period: "AM" | "PM",
): void {
  const h24 =
    period === "AM"
      ? hour12 === 12
        ? 0
        : hour12
      : hour12 === 12
        ? 12
        : hour12 + 12;
  target.setHours(h24, minute, target.getSeconds(), target.getMilliseconds());
}

const HOURS_12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const MINUTES_0_59 = Array.from({ length: 60 }, (_, i) => i);

/** Single bordered control: input + trigger stay in one flex row (no absolute overlay). */
const dateTimeInputGroupClassName = cn(
  "flex h-9 w-full min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-white shadow-xs transition-[color,box-shadow] dark:bg-input/30",
  "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
  "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
  "has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/20 dark:has-[input[aria-invalid=true]]:ring-destructive/40",
);

const dateTimeInputClassName = cn(
  "h-full min-h-0 min-w-0 flex-1 border-0 bg-transparent px-3 py-1 text-base shadow-none outline-none md:text-sm",
  "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
  "focus-visible:border-transparent focus-visible:ring-0",
  "aria-invalid:border-transparent aria-invalid:ring-0",
  "disabled:cursor-not-allowed",
);

const calendarTriggerButtonClassName =
  "size-7 shrink-0 rounded-md text-muted-foreground mr-1 my-auto";

export function FormFieldDatePicker<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  required = false,
  placeholder = "Pick a date",
  description,
  className,
  disabled,
  dateFormat = "PPP",
  showTime = true,
  fromDate,
  toDate,
  editable = true,
}: FormFieldDatePickerProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const dateValue = field.value ? new Date(field.value) : undefined;
        const editableFormat = showTime ? "yyyy-MM-dd hh:mm a" : "yyyy-MM-dd";
        const formattedValue = dateValue
          ? formatDatePattern(dateValue, editableFormat)
          : "";

        const writeBack = (date: Date | undefined) => {
          if (!date) {
            field.onChange(undefined);
            return;
          }
          field.onChange(date.toISOString());
        };

        const handleDateChange = (
          date: Date | undefined,
          source: "calendar" | "time" = "calendar",
        ) => {
          if (date) {
            // Preserve time only when picking a day on the calendar, not when
            // adjusting hour/minute/AM-PM (those already set the full datetime).
            if (showTime && dateValue && source === "calendar") {
              date.setHours(dateValue.getHours());
              date.setMinutes(dateValue.getMinutes());
              date.setSeconds(dateValue.getSeconds());
            }
            writeBack(date);
          } else {
            writeBack(undefined);
          }
        };

        return (
          <FormItem className={className}>
            <FormLabel>
              {label}
              {required ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-destructive ml-1 cursor-help inline border-0 bg-transparent p-0 font-inherit leading-none underline-offset-2 hover:underline"
                      aria-label="Required"
                    >
                      *
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6}>
                    Required
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </FormLabel>

            {editable ? (
              <EditableDateTimePicker
                value={dateValue}
                formattedValue={formattedValue}
                placeholder={
                  placeholder === "Pick a date"
                    ? showTime
                      ? "YYYY-MM-DD hh:mm AM/PM"
                      : "YYYY-MM-DD"
                    : placeholder
                }
                disabled={disabled}
                showTime={showTime}
                fromDate={fromDate}
                toDate={toDate}
                onTextCommit={(text) => {
                  if (!text.trim()) {
                    writeBack(undefined);
                    return;
                  }
                  const parsed = tryParseDateInput(text, showTime);
                  if (parsed) writeBack(parsed);
                }}
                onDateChange={handleDateChange}
              />
            ) : (
              <Popover>
                <div className="relative w-full min-w-0">
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "relative h-9 w-full min-w-0 justify-start overflow-hidden px-3 pr-9 text-left font-normal",
                          !dateValue && "text-muted-foreground",
                        )}
                        disabled={disabled}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {dateValue
                            ? formatDatePattern(
                                dateValue,
                                showTime ? "PPP p" : dateFormat,
                              )
                            : placeholder}
                        </span>
                        <CalendarIcon
                          aria-hidden
                          className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 shrink-0 text-muted-foreground"
                        />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                </div>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateValue}
                    onSelect={(date) => handleDateChange(date, "calendar")}
                    disabled={
                      disabled ||
                      [
                        ...(fromDate ? [{ before: fromDate }] : []),
                        ...(toDate ? [{ after: toDate }] : []),
                      ]
                    }
                    startMonth={fromDate}
                    endMonth={toDate}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            )}

            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

interface EditableDateTimePickerProps {
  value: Date | undefined;
  formattedValue: string;
  placeholder: string;
  disabled?: boolean;
  showTime: boolean;
  fromDate?: Date;
  toDate?: Date;
  onTextCommit: (text: string) => void;
  onDateChange: (date: Date | undefined, source: "calendar" | "time") => void;
}

function EditableDateTimePicker({
  value,
  formattedValue,
  placeholder,
  disabled,
  showTime,
  fromDate,
  toDate,
  onTextCommit,
  onDateChange,
}: EditableDateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState(formattedValue);

  // Keep the text input in sync when the underlying value changes from outside
  // (e.g., calendar selection, form reset).
  React.useEffect(() => {
    setText(formattedValue);
  }, [formattedValue]);

  const clockBase = React.useMemo(() => value ?? new Date(), [value]);

  const { hour12, minute, period } = hour12PartsFromDate(clockBase);

  const commitTimeKeepPopoverOpen = (next: {
    hour12?: number;
    minute?: number;
    period?: "AM" | "PM";
  }) => {
    const nextDate = value ? new Date(value) : new Date(clockBase);
    apply12HourClock(
      nextDate,
      next.hour12 ?? hour12,
      next.minute ?? minute,
      next.period ?? period,
    );
    onDateChange(nextDate, "time");
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <div className={dateTimeInputGroupClassName}>
        <FormControl>
          <Input
            value={text}
            placeholder={placeholder}
            disabled={disabled}
            className={dateTimeInputClassName}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => onTextCommit(text)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onTextCommit(text);
              }
            }}
          />
        </FormControl>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={
              showTime ? "Open date and time picker" : "Open calendar"
            }
            className={calendarTriggerButtonClassName}
          >
            <CalendarIcon className="size-4" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent
        className="w-auto p-0"
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-3 p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onDateChange(date, "calendar");
              setOpen(false);
            }}
            disabled={
              disabled ||
              [
                ...(fromDate ? [{ before: fromDate }] : []),
                ...(toDate ? [{ after: toDate }] : []),
              ]
            }
            startMonth={fromDate}
            endMonth={toDate}
            autoFocus
          />
          {showTime ? (
            <div className="flex flex-wrap gap-2 border-t px-3 pb-3 pt-2">
              <Select
                value={String(hour12)}
                onValueChange={(v) =>
                  commitTimeKeepPopoverOpen({ hour12: Number(v) })
                }
                disabled={disabled}
              >
                <SelectTrigger
                  size="sm"
                  className="w-[4.5rem]"
                  aria-label="Hour"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  {HOURS_12.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(minute)}
                onValueChange={(v) =>
                  commitTimeKeepPopoverOpen({ minute: Number(v) })
                }
                disabled={disabled}
              >
                <SelectTrigger
                  size="sm"
                  className="w-[4.5rem]"
                  aria-label="Minute"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  {MINUTES_0_59.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {String(m).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={period}
                onValueChange={(v) =>
                  commitTimeKeepPopoverOpen({
                    period: v as "AM" | "PM",
                  })
                }
                disabled={disabled}
              >
                <SelectTrigger
                  size="sm"
                  className="w-[4.75rem]"
                  aria-label="AM or PM"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
