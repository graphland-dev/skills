import { FormErrorAlert, FormFieldInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  entityFormSchema,
  type Entity,
  type EntityFormValues,
} from "../~util";

interface EntityFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null/undefined = create mode, an entity = edit mode */
  entity?: Entity | null;
  onSubmit: (values: EntityFormValues) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function EntityFormSheet({
  open,
  onOpenChange,
  entity,
  onSubmit,
  isLoading = false,
  error,
}: EntityFormSheetProps) {
  const isEditMode = !!entity;

  const form = useForm<EntityFormValues>({
    resolver: zodResolver(entityFormSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (entity) {
        form.reset({
          name: entity.name ?? "",
        });
      } else {
        form.reset({
          name: "",
        });
      }
    } else {
      form.reset();
    }
  }, [open, entity, form]);

  const handleSubmit = async (values: EntityFormValues) => {
    await onSubmit(values);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Entity" : "Create Entity"}</SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Update the entity information below."
              : "Add a new entity to your system."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormErrorAlert message={error} />

            <FormFieldInput
              control={form.control}
              name="name"
              label="Name"
              placeholder="Enter name"
            />

            <SheetFooter className="flex flex-col">
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                    ? "Update Entity"
                    : "Create Entity"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
