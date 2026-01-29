"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-surface sm:max-w-[460px] p-0">
        <DialogHeader className="flex flex-row items-start gap-3 border-b border-border/60 bg-gradient-to-r from-destructive/10 via-warning/10 to-transparent px-6 py-5">
          <div className="flex size-12 items-center justify-center rounded-lg bg-destructive/20 text-destructive shadow-inner ring-1 ring-destructive/30">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-left">
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            This action cannot be undone.
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 bg-background/40 px-6 py-4">
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
              className="shadow-[0_12px_30px_rgba(239,68,68,0.35)]"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteModal;
