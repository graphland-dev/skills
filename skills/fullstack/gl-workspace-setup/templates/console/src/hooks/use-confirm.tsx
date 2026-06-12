import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createContext,
  useCallback,
  useContext as useReactContext,
  useState,
  type ReactNode,
} from "react";
import { Loader2Icon } from "lucide-react";

type ConfirmHandlers = {
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
};

type ConfirmOptions = ConfirmHandlers & {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "success";
};

type ConfirmContextValue = {
  trigger: (options?: ConfirmOptions) => void;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const trigger = useCallback((opts?: ConfirmOptions) => {
    setOptions(opts ?? {});
    setIsConfirming(false);
    setOpen(true);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isConfirming) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    if (isConfirming) {
      return;
    }

    setOpen(false);
    setIsConfirming(false);
  };

  const handleCancel = async () => {
    if (isConfirming) {
      return;
    }

    const cb = options?.onCancel;
    handleClose();
    await cb?.();
  };

  const handleConfirm = async () => {
    const cb = options?.onConfirm;
    setIsConfirming(true);

    try {
      await cb?.();
      setOpen(false);
    } finally {
      setIsConfirming(false);
    }
  };

  const title = options?.title ?? "Are you sure?";
  const description = options?.description ?? "This action cannot be undone.";
  const confirmText = options?.confirmText ?? "Confirm";
  const cancelText = options?.cancelText ?? "Cancel";
  const buttonVariant =
    options?.variant === "success" ? "default" : (options?.variant ?? "destructive");

  return (
    <ConfirmContext.Provider value={{ trigger }}>
      {children}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={!isConfirming}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
          <DialogFooter className="mt-4 flex flex-row justify-end">
            <Button
              className="text-muted-foreground"
              type="button"
              variant="link"
              onClick={handleCancel}
              disabled={isConfirming}
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={buttonVariant}
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : null}
              {confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export const useConfirmation = (): ConfirmContextValue => {
  const ctx = useReactContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx;
};
