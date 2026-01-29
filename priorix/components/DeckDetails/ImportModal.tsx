"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CloudUpload, FileDown, Wand2 } from "lucide-react";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, deckId: string) => Promise<void>;
  deckId: string;
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  deckId,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setIsDragging(false);
      setIsImporting(false);
    }
  }, [isOpen]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "application/pdf") {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0].type === "application/pdf") {
      setSelectedFile(files[0]);
    }
  };

  const handleGenerate = async () => {
    if (selectedFile) {
      setIsImporting(true);
      try {
        await onImport(selectedFile, deckId);
        onClose();
        setSelectedFile(null);
      } catch (error) {
        console.error("Import failed:", error);
      } finally {
        setIsImporting(false);
      }
    }
  };
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="modal-surface sm:max-w-[540px] p-0">
        <DialogHeader className="flex flex-row items-start gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 via-muted/40 to-transparent px-6 py-5">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-inner ring-1 ring-primary/20">
            <Wand2 className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-left">
            <DialogTitle className="text-xl">Import PDF to Create Flashcards</DialogTitle>
            <DialogDescription>
              Drop a PDF and generate cards with AI extraction.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          <div
            className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-background/70 px-6 py-10 text-center shadow-inner transition-all duration-200 ${
              isDragging
                ? "border-primary/70 bg-primary/5"
                : selectedFile
                ? "border-green-400/70 bg-green-400/5"
                : "hover:border-primary/60"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/20">
              {selectedFile ? (
                <FileDown className="h-5 w-5" />
              ) : (
                <CloudUpload className="h-5 w-5" />
              )}
            </div>
            <div className="space-y-1">
              <p className="font-semibold">
                {selectedFile ? selectedFile.name : "Drag & drop your PDF"}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedFile ? "Click to choose another file" : "or click to browse"}
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf"
              className="hidden"
            />
            <div className="absolute inset-x-6 bottom-4 text-xs text-muted-foreground">
              PDF only • We keep your files private
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground shadow-inner">
            <p>• Larger PDFs may take a bit longer to analyze.</p>
            <p>• We extract key terms and auto-create flashcards.</p>
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 bg-background/40 px-6 py-4">
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!selectedFile || isImporting}
              className="shadow-[0_12px_30px_rgba(139,92,246,0.35)]"
            >
              {isImporting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </>
              ) : (
                "Generate Flashcards"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportModal;
