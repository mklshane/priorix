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
          console.error("PDF Parse Error:", e);
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
      <DialogContent className="sm:max-w-3xl max-h-[92dvh] md:max-h-[85dvh] flex flex-col border-2 border-border rounded-3xl bg-background shadow-bento-sm p-4 md:p-5 overflow-hidden">
        <DialogHeader className="flex flex-row items-center gap-3 shrink-0 mb-2 pb-2 px-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-lilac border-2 border-border shadow-bento-sm">
            <Wand2 className="h-5 w-5 text-foreground" />
          </div>
          <div className="space-y-0.5 text-left">
            <DialogTitle className="text-xl font-editorial italic text-foreground tracking-tight">Import documents</DialogTitle>
            <DialogDescription className="text-xs font-medium">
              PDF, DOCX, PPT, and TXT supported.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="px-2 py-2 space-y-4 overflow-y-auto flex-1 customized-scrollbar">
          {parsedFiles.length === 0 ? (
            <div
              className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-muted/20 px-6 py-10 text-center transition-all duration-200 cursor-pointer ${
                isDragging ? "border-primary bg-primary/5 shadow-bento-sm" : "border-border hover:border-primary/50"
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
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border-2 border-primary/20 shadow-sm mb-2">
                <CloudUpload className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-base">Drag & drop your document</p>
                <p className="text-sm font-medium text-muted-foreground">or click to browse</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept={ACCEPTED_EXTENSIONS.join(",")}
                className="hidden"
              />
              <div className="absolute inset-x-6 bottom-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                PDF, DOC/DOCX, PPT/PPTX, TXT • Max 15MB
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card p-4 shadow-bento-sm">
              <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                <div className="flex shrink-0 size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border-2 border-primary/20">
                  <FileDown className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-foreground truncate">{parsedFiles[0].fileName}</span>
                  <span className="text-xs font-medium text-muted-foreground">Document loaded</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 w-full sm:w-auto">
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
                  className="w-full sm:w-auto border-2 font-bold shadow-bento-sm"
                >
                  Change File
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
                      className="rounded-2xl border-2 border-border bg-card shadow-bento-sm overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border-b-2 border-border px-4 py-3 bg-muted/20">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-bold text-base text-foreground truncate">{file.fileName}</span>
                          <span className="text-xs font-semibold text-muted-foreground uppercase">{file.fileType} • {file.pages.length} Pages</span>
                        </div>
                        <div className="w-full sm:w-auto flex items-center justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => toggleAll(file, !allSelected)}
                            className="h-8 font-bold border-2"
                          >
                            {allSelected ? "Deselect All" : "Select All"}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 max-h-[40vh] overflow-y-auto customized-scrollbar">
                        {file.pages.map((page) => {
                          const isChecked = selection[file.fileId]?.has(page.index) ?? false;
                          return (
                            <label
                              key={page.index}
                              className={`relative flex flex-col rounded-sm border-2 ${
                                isChecked ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/50"
                              } overflow-hidden cursor-pointer transition-all`}
                            >
                              <div className="absolute right-2 top-2 z-10">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 bg-background border-2 border-border rounded text-primary focus:ring-primary/20"
                                  checked={isChecked}
                                  onChange={() => togglePage(file.fileId, page.index)}
                                  aria-label={`${page.title} from ${file.fileName}`}
                                />
                              </div>
                              {page.preview ? (
                                <img
                                  src={page.preview}
                                  alt={page.title}
                                  className={`w-full h-32 object-contain bg-background/50 border-b-2 ${isChecked ? "border-primary/20" : "border-border"}`}
                                />
                              ) : (
                                <div className={`h-32 bg-background/50 flex items-center justify-center p-3 text-xs text-muted-foreground text-center border-b-2 ${isChecked ? "border-primary/20" : "border-border"}`}>
                                  {page.snippet ? <span className="line-clamp-4">{page.snippet}</span> : "No preview available"}
                                </div>
                              )}
                              <div className="px-3 py-2 flex items-center justify-between gap-2 text-xs font-bold text-foreground bg-background">
                                <span className="truncate">{page.title}</span>
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

        <DialogFooter className="border-t-2 border-border bg-background pt-3 pb-2 px-2 shrink-0">
          <div className="flex w-full flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-bold text-muted-foreground w-full sm:w-auto text-center sm:text-left">
              Select the pages or slides you want to include before generating.
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
              <Button
                onClick={onClose}
                variant="outline"
                disabled={isParsing || isImporting}
                className="w-full sm:w-auto border-2 font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isParsing || isImporting || totalSelected === 0}
                className="w-full sm:w-auto shadow-bento-sm font-bold"
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
