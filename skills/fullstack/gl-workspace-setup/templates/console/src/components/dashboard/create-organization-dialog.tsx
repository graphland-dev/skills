import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";

import { FormError } from "@/components/form";
import { FormFieldInput } from "@/components/form/form-field-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { bootstrapQueryKey } from "@/lib/bootstrap";
import {
  createOrganization,
  organizationQueryKeys,
  slugifyOrganizationName,
} from "@/lib/organizations";
import { Loader2Icon } from "lucide-react";

type CreateOrganizationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateOrganizationDialog({
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<{
    name?: string;
    slug?: string;
  }>({});
  const [formErrors, setFormErrors] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!slugTouched) {
      setSlug(slugifyOrganizationName(name));
    }
  }, [name, slugTouched]);

  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.all,
      });
      await queryClient.refetchQueries({ queryKey: bootstrapQueryKey });
      toast.success("Organization created");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  React.useEffect(() => {
    if (!open) {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setFieldErrors({});
      setFormErrors([]);
    }
  }, [open]);

  function validate() {
    const nextFieldErrors: { name?: string; slug?: string } = {};
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedName) {
      nextFieldErrors.name = "Name is required";
    }

    if (!trimmedSlug) {
      nextFieldErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug)) {
      nextFieldErrors.slug =
        "Use lowercase letters, numbers, and hyphens only";
    }

    setFieldErrors(nextFieldErrors);
    setFormErrors(
      Object.values(nextFieldErrors).filter(
        (message): message is string => Boolean(message),
      ),
    );

    return Object.keys(nextFieldErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    await createMutation.mutateAsync({
      name: name.trim(),
      slug: slug.trim(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
          <DialogDescription>
            Add a new organization for your team. You will be switched to it
            after creation.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <FormError errors={formErrors} />

          <FieldGroup>
            <FormFieldInput
              label="Name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={fieldErrors.name}
              placeholder="Acme Inc."
              disabled={createMutation.isPending}
              autoFocus
            />
            <FormFieldInput
              label="Slug"
              required
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              error={fieldErrors.slug}
              placeholder="acme-inc"
              description="Used in URLs and API references."
              disabled={createMutation.isPending}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={createMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : null}
              Create organization
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
