import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

interface FormFieldTextareaProps<
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
  textareaClassName?: string;
  disabled?: boolean;
  rows?: number;
}

export function FormFieldTextarea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  required = false,
  placeholder,
  description,
  className,
  textareaClassName = "bg-white",
  disabled,
  rows = 4,
}: FormFieldTextareaProps<TFieldValues, TName>) {
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
            <Textarea
              placeholder={placeholder}
              className={cn("resize-none", textareaClassName)}
              disabled={disabled}
              rows={rows}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
