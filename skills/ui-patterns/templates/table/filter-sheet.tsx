import type { FilterComboboxOption } from "@/components/table/filter-combobox";
import { FilterCombobox } from "@/components/table/filter-combobox";
import { Button } from "@/components/ui/button";
import { DatePickerPopover } from "@/components/ui/date-picker-popover";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMemo } from "react";

export type FilterFieldType = "combobox" | "text" | "date" | "number";

// Note: we intentionally keep this interface very permissive (using `any`)
// so existing filter sheets that only use string values remain compatible.
export interface FilterField {
  key: string;
  label: string;
  type?: FilterFieldType;
  value?: any;
  options?: FilterComboboxOption[];
  placeholder?: string;
  emptyMessage?: string;
  onChange: (value: any) => void;
  // For grouped fields (e.g., date range, amount range)
  subFields?: {
    key: string;
    label: string;
    value?: any;
    onChange: (value: any) => void;
  }[];
}

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterField[];
  title?: string;
  description?: string;
  onClearAll?: () => void;
}

export function FilterSheet({
  open,
  onOpenChange,
  filters,
  title = "Filters",
  description = "Apply filters to refine your search results.",
  onClearAll,
}: FilterSheetProps) {
  const activeFilterCount = useMemo(() => {
    let count = 0;
    filters.forEach((filter) => {
      if (filter.subFields) {
        // Count subFields
        filter.subFields.forEach((subField) => {
          if (subField.value !== undefined && subField.value !== "") count++;
        });
      } else if (filter.value !== undefined && filter.value !== "") {
        count++;
      }
    });
    return count;
  }, [filters]);

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      // Default behavior: clear all filters by calling onChange with empty string
      filters.forEach((filter) => {
        if (filter.subFields) {
          filter.subFields.forEach((subField) => {
            subField.onChange(undefined);
          });
        } else {
          filter.onChange(undefined);
        }
      });
    }
  };

  const renderField = (filter: FilterField) => {
    const fieldType = filter.type || "combobox";

    if (filter.subFields) {
      // Render grouped fields (e.g., date range, amount range)
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium">{filter.label}</label>
          <div className="grid grid-cols-2 gap-2">
            {filter.subFields.map((subField) => (
              <div key={subField.key} className="space-y-1">
                <label className="text-xs text-muted-foreground">{subField.label}</label>
                {fieldType === "date" ? (
                  <DatePickerPopover
                    value={
                      subField.value !== undefined && typeof subField.value === "string"
                        ? subField.value
                        : undefined
                    }
                    onChange={(v) => subField.onChange(v)}
                    placeholder={filter.placeholder || subField.label}
                    output="date-only"
                    allowClear
                    buttonClassName="h-9"
                  />
                ) : (
                  <Input
                    type={fieldType === "number" ? "number" : "text"}
                    placeholder={filter.placeholder}
                    value={
                      subField.value !== undefined ? String(subField.value) : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (fieldType === "number") {
                        subField.onChange(value ? parseFloat(value) : undefined);
                      } else {
                        subField.onChange(value || undefined);
                      }
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Render single field
    switch (fieldType) {
      case "text":
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">{filter.label}</label>
            <Input
              type="text"
              placeholder={filter.placeholder || `Filter by ${filter.label.toLowerCase()}...`}
              value={filter.value !== undefined ? String(filter.value) : ""}
              onChange={(e) => filter.onChange(e.target.value || undefined)}
            />
          </div>
        );

      case "date":
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">{filter.label}</label>
            <DatePickerPopover
              value={
                filter.value && typeof filter.value === "string" ? filter.value : undefined
              }
              onChange={(v) => filter.onChange(v)}
              placeholder={
                filter.placeholder || `Filter by ${filter.label.toLowerCase()}...`
              }
              output="iso"
              allowClear
              buttonClassName="h-9"
            />
          </div>
        );

      case "number":
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">{filter.label}</label>
            <Input
              type="number"
              placeholder={filter.placeholder || `Filter by ${filter.label.toLowerCase()}...`}
              value={filter.value !== undefined ? String(filter.value) : ""}
              onChange={(e) =>
                filter.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
              }
            />
          </div>
        );

      case "combobox":
      default:
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">{filter.label}</label>
            <FilterCombobox
              options={filter.options || []}
              placeholder={filter.placeholder || `Filter by ${filter.label.toLowerCase()}...`}
              value={filter.value !== undefined ? String(filter.value) : undefined}
              onValueChange={(value) => filter.onChange(value || undefined)}
              emptyMessage={filter.emptyMessage || `No ${filter.label.toLowerCase()} found.`}
            />
          </div>
        );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {filters.map((filter) => (
            <div key={filter.key}>{renderField(filter)}</div>
          ))}
        </div>

        <SheetFooter className="flex flex-col gap-2 mt-6">
          <Button onClick={() => onOpenChange(false)}>Apply Filters</Button>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              onClick={handleClearAll}
              className="w-full text-destructive hover:text-destructive"
            >
              Clear All Filters ({activeFilterCount})
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
