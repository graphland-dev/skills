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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import * as React from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

interface FormFieldInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: React.ComponentProps<"input">["type"];
  icon?: LucideIcon;
  description?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export function FormFieldInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  required = false,
  placeholder,
  type = "text",
  icon: Icon,
  description,
  className,
  inputClassName,
  disabled,
}: FormFieldInputProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
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
            <div className="relative">
              {Icon && (
                <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 size-4" />
              )}
              <Input
                type={type}
                placeholder={placeholder}
                className={cn(Icon && "pl-10", inputClassName)}
                disabled={disabled}
                {...field}
              />
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
