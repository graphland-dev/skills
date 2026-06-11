import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function comboboxTriggerText(option: ComboboxOption): string {
  return option.compactLabel ?? option.label;
}

export interface ComboboxOption {
  value: string;
  /** Used for fuzzy match in the dropdown (defaults to label) */
  keywords?: string;
  /** Fallback text + search string when renderLabel / compactLabel are omitted */
  label: string;
  /** One-line label for the trigger when rich renderLabel would be too tall */
  compactLabel?: string;
  disabled?: boolean;
  /** Rich content in dropdown rows (invoice lines, etc.); trigger uses compactLabel ?? label */
  renderLabel?: React.ReactNode;
}

interface ComboboxEmptyRenderContext {
  /** Current search text (controlled `searchValue`, or empty when uncontrolled). */
  searchValue: string;
  /** Close the dropdown (e.g. before opening a sheet from the empty state). */
  close: () => void;
}

/** Renders after option rows — use `shouldFilter={false}` so filtering does not hide the row. Enter selects it like any other row. */
export interface ComboboxAppendItem {
  show: boolean;
  /** Passed to underlying cmdk item `value` (must stay unique stable per row identity). */
  value: string;
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  /** When set, replaces `emptyMessage` so you can render actions (e.g. “create …”). */
  emptyRender?: (ctx: ComboboxEmptyRenderContext) => React.ReactNode;
  /**
   * Optional row appended after mapped options — implemented as `CommandItem` so keyboard
   * navigation and Enter behave like selecting a listed option (unlike passive `emptyRender`).
   */
  appendItem?: ComboboxAppendItem;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  popoverWidth?: number | "auto";
  shouldFilter?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showClearButton?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyMessage = "No option found.",
  emptyRender,
  appendItem,
  searchPlaceholder = "Search...",
  disabled = false,
  className,
  buttonClassName,
  popoverWidth = "auto",
  shouldFilter = true,
  searchValue,
  onSearchChange,
  showClearButton = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [internalPopoverWidth, setInternalPopoverWidth] = React.useState<number | undefined>(
    undefined,
  );

  React.useEffect(() => {
    if (triggerRef.current && open && popoverWidth === "auto") {
      setInternalPopoverWidth(triggerRef.current.offsetWidth);
    }
  }, [open, popoverWidth]);

  // Find the selected option - use useMemo to recalculate when options or value change
  const selectedOption = React.useMemo(() => {
    if (!value) return undefined;
    return options.find((option) => option.value === value);
  }, [options, value]);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("");
  };

  const popoverContentWidth = popoverWidth === "auto" ? internalPopoverWidth : popoverWidth;

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between font-normal h-10 pr-3",
              !value && "text-muted-foreground",
              buttonClassName,
            )}
            disabled={disabled}
          >
            <span
              className={cn("truncate text-left pr-2", !selectedOption && "text-muted-foreground")}
            >
              {selectedOption ? comboboxTriggerText(selectedOption) : placeholder}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        {showClearButton && value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded cursor-pointer z-10"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        )}
        <PopoverContent
          align="start"
          className={cn(
            "p-0",
            "max-h-[min(400px,var(--radix-popover-content-available-height,80dvh))]",
            "overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-gutter:stable]",
          )}
          onWheel={(e) => e.stopPropagation()}
          style={
            popoverContentWidth
              ? { width: popoverContentWidth }
              : popoverWidth === "auto"
                ? undefined
                : { width: popoverWidth }
          }
        >
          <Command
            shouldFilter={shouldFilter}
            key={open ? "open" : "closed"}
            className="h-auto min-h-0 overflow-visible rounded-none border-0 bg-transparent shadow-none"
          >
            <CommandInput
              placeholder={searchPlaceholder}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  appendItem?.show &&
                  options.length === 0 &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  appendItem.onSelect();
                  setOpen(false);
                }
              }}
              {...(onSearchChange != null
                ? {
                    value: searchValue ?? "",
                    onValueChange: (value: string) => {
                      onSearchChange(typeof value === "string" ? value : "");
                    },
                  }
                : {})}
            />
            <CommandList className="max-h-none overflow-visible">
              <CommandEmpty>
                {emptyRender
                  ? emptyRender({
                      searchValue: searchValue ?? "",
                      close: () => setOpen(false),
                    })
                  : emptyMessage}
              </CommandEmpty>
              <CommandGroup className="overflow-visible">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.keywords ?? option.label}
                    disabled={option.disabled}
                    onSelect={() => handleSelect(option.value)}
                    className="items-start"
                  >
                    <Check
                      className={cn(
                        "mr-2 mt-0.5 h-4 w-4 shrink-0",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="min-w-0 flex-1 whitespace-normal [&>*]:leading-snug">
                      {option.renderLabel ?? option.label}
                    </div>
                  </CommandItem>
                ))}
                {appendItem?.show ? (
                  <CommandItem
                    key="__combobox_append__"
                    value={appendItem.value}
                    onSelect={() => {
                      appendItem.onSelect();
                      setOpen(false);
                    }}
                    className={cn("items-start", appendItem.className)}
                  >
                    {appendItem.children}
                  </CommandItem>
                ) : null}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
