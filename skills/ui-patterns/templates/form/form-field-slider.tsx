import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface FormFieldSliderProps {
  label: string;
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  className?: string;
  showValues?: boolean;
  valueLabels?: { min?: string; max?: string; current?: string };
}

export function FormFieldSlider({
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  description,
  className,
  showValues = true,
  valueLabels,
}: FormFieldSliderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <Slider
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
        className="mt-2"
      />
      {showValues && (
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{valueLabels?.min ?? String(min)}</span>
          <span>{valueLabels?.current ?? String(value[0])}</span>
          <span>{valueLabels?.max ?? String(max)}</span>
        </div>
      )}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
