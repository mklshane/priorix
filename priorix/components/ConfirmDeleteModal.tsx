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
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-2 border-border shadow-bento !rounded-[2rem] bg-card">
        <DialogHeader className="flex flex-col items-center justify-center gap-3 border-b-2 border-border bg-blush px-6 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-border bg-white shadow-bento-sm">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div className="space-y-1 text-center">
            <DialogTitle className="font-editorial text-4xl text-foreground">{title}</DialogTitle>
            <DialogDescription className="text-foreground/70 font-medium text-sm px-4">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-6 bg-card space-y-6">
          <div className="rounded-xl border-2 border-red-500/50 bg-red-500/10 px-4 py-3 text-center text-sm font-bold text-red-600">
            This action cannot be undone.
          </div>

          <DialogFooter className="pt-2">
            <div className="flex w-full items-center justify-end gap-3">
              <Button 
                variant="ghost" 
                onClick={onClose} 
                disabled={isLoading}
                className="h-12 px-6 rounded-xl font-bold hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                disabled={isLoading}
                className="h-12 px-8 rounded-xl border-2 border-transparent bg-red-500 text-white font-bold hover:bg-red-600 hover:-translate-y-0.5 transition-transform shadow-none"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteModal;
