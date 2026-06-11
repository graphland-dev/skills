import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

export type { ComboboxOption };

interface FormFieldComboboxSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  required?: boolean;
  placeholder?: string;
  options: ComboboxOption[];
  description?: string;
  className?: string;
  disabled?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
}

export function FormFieldComboboxSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  required = false,
  placeholder = "Select option...",
  options,
  description,
  className,
  disabled,
  emptyMessage = "No option found.",
  searchPlaceholder = "Search...",
}: FormFieldComboboxSelectProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        return (
          <FormItem className={className}>
            <FormLabel>
              {label}
              {required ? (
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
              ) : null}
            </FormLabel>
            <FormControl>
              <Combobox
                options={options}
                value={field.value}
                onValueChange={field.onChange}
                placeholder={placeholder}
                emptyMessage={emptyMessage}
                searchPlaceholder={searchPlaceholder}
                disabled={disabled}
                popoverWidth="auto"
              />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
