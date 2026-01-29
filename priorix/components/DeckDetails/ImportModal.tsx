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
import {
  CheckSquare,
  CloudUpload,
  FileDown,
  Loader2,
  Square,
  Wand2,
} from "lucide-react";

type ParsedPage = {
  index: number;
  title: string;
  snippet: string;
  text: string;
  preview?: string;
};

type ParsedFile = {
  fileId: string;
  fileName: string;
  fileType: string;
  pages: ParsedPage[];
};

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string, deckId: string) => Promise<void>;
  deckId: string;
}

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".ppt", ".pptx", ".txt"];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  deckId,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [selection, setSelection] = useState<Record<string, Set<number>>>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setParsedFiles([]);
      setSelection({});
      setIsDragging(false);
      setIsParsing(false);
      setIsImporting(false);
      setError(null);
    }
  }, [isOpen]);

  const makeId = () => (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;

  const renderPdfPagePreview = async (page: any, scale = 0.3): Promise<string> => {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return "";

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL("image/png");
  };

  const parsePdfClient = async (file: File): Promise<ParsedFile> => {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pages: ParsedPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      let preview: string | undefined;
      try {
        preview = await renderPdfPagePreview(page, 0.28);
      } catch (e) {
        preview = undefined;
      }
      pages.push({
        index: i - 1,
        title: `Page ${i}`,
        snippet: text.length > 220 ? `${text.slice(0, 220)}...` : text,
        text,
        preview,
      });
    }

    return {
      fileId: makeId(),
      fileName: file.name,
      fileType: "pdf",
      pages,
    };
  };

  const resetSelections = (files: ParsedFile[]) => {
    const nextSelection: Record<string, Set<number>> = {};
    files.forEach((file) => {
      nextSelection[file.fileId] = new Set(file.pages.map((p) => p.index));
    });
    setSelection(nextSelection);
  };

  const validateClient = (files: FileList | File[]) => {
    const picked = Array.from(files);
    const invalid = picked.find((file) => {
      const ext = file.name.toLowerCase();
      const allowed = ACCEPTED_EXTENSIONS.some((item) => ext.endsWith(item));
      return !allowed || file.size > MAX_FILE_SIZE;
    });

    if (invalid) {
      if (invalid.size > MAX_FILE_SIZE) {
        setError(`"${invalid.name}" is too large (max 15MB).`);
      } else {
        setError("Unsupported file type selected.");
      }
      return false;
    }
    return true;
  };

  const clearFiles = () => {
    setParsedFiles([]);
    setSelection({});
    setError(null);
  };

  const parseFiles = async (files: FileList | File[]) => {
    if (parsedFiles.length) {
      setError("Remove the current file before adding another.");
      return;
    }
    if (!validateClient(files)) return;
    setIsParsing(true);
    setError(null);

    const picked = Array.from(files);
    const pdfs = picked.filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    const others = picked.filter((f) => !f.name.toLowerCase().endsWith(".pdf"));

    const nextFiles: ParsedFile[] = [];
    const errors: string[] = [];

    try {
      // Parse PDFs client-side for reliability.
      for (const pdf of pdfs) {
        try {
          const parsed = await parsePdfClient(pdf);
          if (parsed.pages.length === 0) {
            errors.push(`${pdf.name}: no readable text found`);
          } else {
            nextFiles.push(parsed);
          }
        } catch (e) {
          errors.push(`${pdf.name}: failed to parse PDF`);
        }
      }

      // Parse other docs server-side.
      if (others.length) {
        const formData = new FormData();
        others.forEach((file) => formData.append("files", file));

        const res = await fetch("/api/files/parse", {
          method: "POST",
          body: formData,
        });
        const contentType = res.headers.get("content-type") || "";
        const data = contentType.includes("application/json") ? await res.json() : null;

        if (!res.ok || !data?.files) {
          throw new Error(data?.error || "Failed to parse files");
        }

        nextFiles.push(...data.files);
        if (data.errors?.length) {
          data.errors.forEach((e: any) => errors.push(`${e.fileName}: ${e.error}`));
        }
      }

      if (!nextFiles.length) {
        setError(errors[0] || "No content parsed.");
        setParsedFiles([]);
        setSelection({});
        return;
      }

      setParsedFiles(nextFiles);
      resetSelections(nextFiles);

      if (errors.length) {
        setError(errors.join("; "));
      }
    } catch (err) {
      console.error("Parse error", err);
      const message = err instanceof Error ? err.message : "Failed to parse files";
      setError(message);
      setParsedFiles([]);
      setSelection({});
    } finally {
      setIsParsing(false);
    }
  };

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
    if (parsedFiles.length) {
      setError("Remove the current file before adding another.");
      return;
    }
    if (e.dataTransfer.files?.length) {
      parseFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      parseFiles(files);
    }
  };

  const togglePage = (fileId: string, pageIndex: number) => {
    setSelection((prev) => {
      const current = new Set(prev[fileId] || []);
      if (current.has(pageIndex)) {
        current.delete(pageIndex);
      } else {
        current.add(pageIndex);
      }
      return { ...prev, [fileId]: current };
    });
  };

  const toggleAll = (file: ParsedFile, selectAll: boolean) => {
    setSelection((prev) => ({
      ...prev,
      [file.fileId]: selectAll
        ? new Set(file.pages.map((p) => p.index))
        : new Set<number>(),
    }));
  };

  const totalSelected = parsedFiles.reduce((acc, file) => {
    const selected = selection[file.fileId];
    return acc + (selected ? selected.size : 0);
  }, 0);

  const handleGenerate = async () => {
    if (!parsedFiles.length) return;
    const selectedText = parsedFiles
      .flatMap((file) =>
        file.pages
          .filter((page) => selection[file.fileId]?.has(page.index))
          .map((page) => page.text)
      )
      .join("\n\n");

    if (!selectedText.trim()) {
      setError("Select at least one page or slide to continue.");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      await onImport(selectedText, deckId);
      onClose();
    } catch (err) {
      console.error("Import failed:", err);
      setError(err instanceof Error ? err.message : "Failed to generate flashcards");
    } finally {
      setIsImporting(false);
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
      <DialogContent className="modal-surface sm:max-w-[900px] p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-start gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 via-muted/40 to-transparent px-6 py-5">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-inner ring-1 ring-primary/20">
            <Wand2 className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-left">
            <DialogTitle className="text-xl">Import documents to create flashcards</DialogTitle>
            <DialogDescription>
              PDF, DOCX, PPT/PPTX, and TXT are supported. Preview pages and pick what to include.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 overflow-auto flex-1">
          {parsedFiles.length === 0 ? (
            <div
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-background/70 px-6 py-8 text-center shadow-inner transition-all duration-200 ${
                isDragging ? "border-primary/70 bg-primary/5" : "hover:border-primary/60"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/20">
                <CloudUpload className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Drag & drop your document</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept={ACCEPTED_EXTENSIONS.join(",")}
                className="hidden"
              />
              <div className="absolute inset-x-6 bottom-3 text-xs text-muted-foreground">
                PDF, DOC/DOCX, PPT/PPTX, TXT • Max 15MB per file
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-4 py-3 text-sm shadow-inner">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/20">
                  <FileDown className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{parsedFiles[0].fileName}</span>
                  <span className="text-muted-foreground">File selected. Choose another to replace.</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept={ACCEPTED_EXTENSIONS.join(",")}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    clearFiles();
                    setTimeout(() => fileInputRef.current?.click(), 0);
                  }}
                  disabled={isParsing || isImporting}
                >
                  Select different file
                </Button>
              </div>
            </div>
          )}

          {(isParsing || isImporting) && (
            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isParsing ? "Analyzing documents..." : "Generating flashcards..."}
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {parsedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {parsedFiles.length} file{parsedFiles.length > 1 ? "s" : ""} • {totalSelected} section
                  {totalSelected === 1 ? "" : "s"} selected
                </span>
              </div>

              <div className="space-y-4">
                {parsedFiles.map((file) => {
                  const selectedCount = selection[file.fileId]?.size || 0;
                  const allSelected = selectedCount === file.pages.length;
                  return (
                    <div
                      key={file.fileId}
                      className="rounded-lg border border-border/60 bg-background/70 shadow-inner"
                    >
                      <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3 text-sm">
                        <div className="font-semibold text-foreground">{file.fileName}</div>
                        <div className="text-muted-foreground">{file.fileType.toUpperCase()}</div>
                        <div className="text-muted-foreground">{file.pages.length} pages/slides</div>
                        <div className="ml-auto flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAll(file, !allSelected)}
                            className="h-8"
                          >
                            {allSelected ? "Deselect all" : "Select all"}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                        {file.pages.map((page) => {
                          const isChecked = selection[file.fileId]?.has(page.index) ?? false;
                          return (
                            <label
                              key={page.index}
                              className={`relative block rounded-lg border ${
                                isChecked ? "border-primary/60 ring-2 ring-primary/30" : "border-border/60"
                              } bg-background/80 shadow-sm overflow-hidden cursor-pointer transition hover:border-primary/50`}
                            >
                              <input
                                type="checkbox"
                                className="absolute left-3 top-3 h-4 w-4 z-10"
                                checked={isChecked}
                                onChange={() => togglePage(file.fileId, page.index)}
                                aria-label={`${page.title} from ${file.fileName}`}
                              />
                              {page.preview ? (
                                <img
                                  src={page.preview}
                                  alt={page.title}
                                  className="w-full h-40 object-contain bg-muted"
                                />
                              ) : (
                                <div className="h-40 bg-muted/60 flex items-center justify-center px-3 text-sm text-muted-foreground text-center">
                                  {page.snippet || "No preview available"}
                                </div>
                              )}
                              <div className="px-3 py-2 border-t border-border/60 bg-background/80 flex items-center gap-2 text-sm font-medium text-foreground">
                                {isChecked ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                <span>{page.title}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 bg-background/40 px-6 py-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Select the pages or slides you want to include before generating.
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={onClose} variant="outline" disabled={isParsing || isImporting}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isParsing || isImporting || totalSelected === 0}
                className="shadow-[0_12px_30px_rgba(139,92,246,0.35)]"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  `Generate (${totalSelected})`
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportModal;
