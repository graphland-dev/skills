import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useEffect, useState } from "react";

export type { ComboboxOption as FilterComboboxOption };

interface FilterComboboxProps {
  options: ComboboxOption[];
  placeholder?: string;
  onValueChange: (value: string) => void;
  emptyMessage?: string;
  searchPlaceholder?: string;
  value?: string; // Controlled value prop
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  shouldFilter?: boolean;
}

export function FilterCombobox({
  options,
  placeholder = "Select...",
  onValueChange,
  emptyMessage = "No option found.",
  searchPlaceholder = "Search...",
  value: controlledValue,
  searchValue,
  onSearchChange,
  shouldFilter = true,
}: FilterComboboxProps) {
  const [selectedValue, setSelectedValue] = useState<string>("");

  // Sync internal state with controlled value if provided
  useEffect(() => {
    if (controlledValue !== undefined) {
      // Use empty string for undefined/null to properly clear the selection
      setSelectedValue(controlledValue || "");
    }
  }, [controlledValue]);

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    // Pass empty string as-is, parent will convert to undefined if needed
    onValueChange(value);
  };

  return (
    <Combobox
      options={options}
      value={selectedValue}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      searchPlaceholder={searchPlaceholder}
      popoverWidth="auto"
      shouldFilter={shouldFilter}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
    />
  );
}
