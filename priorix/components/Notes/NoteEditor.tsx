"use client";

import { ChangeEvent, CSSProperties, MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { Extension, JSONContent, Node as TiptapNode } from "@tiptap/core";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Link2,
  ImagePlus,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  ChevronDown,
  FileDown,
  FileText,
  Sparkles,
  Strikethrough,
  Quote,
  Code2,
  Eraser,
  Minus,
  Crop,
  Palette,
  Type,
  Columns2,
  Columns,
  AlignJustify,
  ChevronsUpDown,
  Trash2,
  RectangleHorizontal,
  PaintBucket,
  Ruler,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useNote, useNoteMutations } from "@/hooks/useNotes";

interface NoteEditorProps {
  noteId: string;
}

const PAGE_HEIGHT = 1056; // US Letter at 96dpi
const PAGE_GAP = 40;
const PAGE_TOP_PADDING = 40;
const PAGE_BOTTOM_PADDING = 40;
const MIN_BLOCK_HEIGHT = 24;
const PAGE_OVERFLOW_TOLERANCE = 6;

const createEmptyParagraph = (): JSONContent => ({ type: "paragraph" });

const createEmptyPage = (): JSONContent => ({
  type: "page",
  content: [createEmptyParagraph()],
});

const PagedDocument = Document.extend({
  content: "page+",
});

const PageNode = TiptapNode.create({
  name: "page",
  group: "block",
  content: "block+",
  defining: true,
  draggable: false,
  parseHTML() {
    return [{ tag: 'div[data-page-node="true"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-page-node": "true" }, 0];
  },
});

const buildInitialPagedDoc = (): JSONContent => ({
  type: "doc",
  content: [createEmptyPage()],
});

const wrapLegacyHtmlAsPagedDocument = (html: string) => {
  const trimmed = html.trim();
  if (!trimmed) {
    return '<div data-page-node="true"><p></p></div>';
  }

  if (trimmed.includes('data-page-node="true"')) {
    return trimmed;
  }

  return `<div data-page-node="true">${trimmed}</div>`;
};

const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

const LineHeight = Extension.create({
  name: "lineHeight",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {};
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },
});

const ParagraphBgColor = Extension.create({
  name: "paragraphBgColor",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: (element) => element.style.backgroundColor || null,
            renderHTML: (attributes) => {
              if (!attributes.backgroundColor) return {};
              return {
                style: `background-color: ${attributes.backgroundColor}; padding: 4px 8px; border-radius: 4px;`,
              };
            },
          },
        },
      },
    ];
  },
});

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) => element.getAttribute("data-width") || element.style.width || "100%",
        renderHTML: (attributes) => ({
          "data-width": attributes.width,
          style: `width: ${attributes.width}; height: auto;`,
        }),
      },
    };
  },
});

const createImageElement = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Failed to load image")));
    image.src = url;
  });

const getCroppedImage = async (imageSrc: string, crop: Area): Promise<string> => {
  const image = await createImageElement(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context unavailable");
  }

  canvas.width = crop.width;
  canvas.height = crop.height;

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return canvas.toDataURL("image/jpeg", 0.92);
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

export default function NoteEditor({ noteId }: NoteEditorProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const { data: note, isLoading } = useNote(true, noteId);
  const { updateNote } = useNoteMutations();

  const [title, setTitle] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [fontColor, setFontColor] = useState("#111827");
  const [fontSize, setFontSize] = useState("16px");
  const [isTwoColumn, setIsTwoColumn] = useState(false);
  const [highlightColor, setHighlightColor] = useState("#fef08a");
  const [lineHeight, setLineHeight] = useState("1.75");
  const [docMargin, setDocMargin] = useState(72);
  const [paragraphBg, setParagraphBg] = useState("transparent");

  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropArea, setCropArea] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const [isReplacingImage, setIsReplacingImage] = useState(false);

  const [imageToolbarPos, setImageToolbarPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [pageCount, setPageCount] = useState(1);

  const initializedRef = useRef(false);
  const autosaveRef = useRef<NodeJS.Timeout | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const rebalanceRafRef = useRef<number | null>(null);
  const isRebalancingRef = useRef(false);
  const rebalancePagesRef = useRef<() => void>(() => {});
  const lastSavedSnapshotRef = useRef<{ title: string; html: string }>({
    title: "",
    html: "",
  });

  const editor = useEditor({
    extensions: [
      PagedDocument,
      PageNode,
      StarterKit.configure({
        document: false,
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      TextStyle,
      Color,
      FontSize,
      LineHeight,
      ParagraphBgColor,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ResizableImage.configure({ allowBase64: true }),
    ],
    content: buildInitialPagedDoc(),
    editorProps: {
      attributes: {
        class:
          "tiptap-editor prose-sm p-0 text-sm leading-7 focus:outline-none",
      },
    },
    onUpdate: () => {
      scheduleAutosave();
    },
    onSelectionUpdate: ({ editor: e }) => {
      updateImageToolbar(e);
    },
    onTransaction: ({ editor: e, transaction }) => {
      updateImageToolbar(e);

      if (!transaction.docChanged || isRebalancingRef.current) {
        return;
      }

      if (rebalanceRafRef.current !== null) {
        cancelAnimationFrame(rebalanceRafRef.current);
      }

      rebalanceRafRef.current = requestAnimationFrame(() => {
        rebalanceRafRef.current = null;
        rebalancePagesRef.current();
      });
    },
    immediatelyRender: false,
  });

  const updateImageToolbar = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      if (!e || !editorContainerRef.current) {
        setImageToolbarPos(null);
        return;
      }
      if (e.isActive("image")) {
        const imgEl = editorContainerRef.current.querySelector(
          "img.ProseMirror-selectednode"
        ) as HTMLImageElement | null;
        if (imgEl) {
          const containerRect = editorContainerRef.current.getBoundingClientRect();
          const imgRect = imgEl.getBoundingClientRect();
          setImageToolbarPos({
            top: imgRect.top - containerRect.top - 48,
            left: imgRect.left - containerRect.left + imgRect.width / 2,
            width: imgRect.width,
          });
          return;
        }
      }
      setImageToolbarPos(null);
    },
    []
  );

  const syncPageCount = useCallback(
    (fallback?: number) => {
      if (typeof fallback === "number") {
        setPageCount(Math.max(1, fallback));
        return;
      }

      if (!editor) {
        setPageCount(1);
        return;
      }

      const pages = (editor.getJSON().content || []).filter((node) => node.type === "page");
      setPageCount(Math.max(1, pages.length));
    },
    [editor]
  );

  const getPageContentCapacity = (pageEl: HTMLElement) => {
    const style = window.getComputedStyle(pageEl);
    const paddingTop = Number.parseFloat(style.paddingTop || "0") || 0;
    const paddingBottom = Number.parseFloat(style.paddingBottom || "0") || 0;
    const contentCapacity = pageEl.clientHeight - paddingTop - paddingBottom;
    return Math.max(contentCapacity, MIN_BLOCK_HEIGHT);
  };

  const getPageUsedHeight = (pageEl: HTMLElement) => {
    const pageBlockEls = Array.from(pageEl.children) as HTMLElement[];
    if (!pageBlockEls.length) {
      return 0;
    }

    const pageRect = pageEl.getBoundingClientRect();

    let minTop = Number.POSITIVE_INFINITY;
    let maxBottom = Number.NEGATIVE_INFINITY;

    pageBlockEls.forEach((blockEl) => {
      const blockRect = blockEl.getBoundingClientRect();
      minTop = Math.min(minTop, blockRect.top - pageRect.top);
      maxBottom = Math.max(maxBottom, blockRect.bottom - pageRect.top);
    });

    if (!Number.isFinite(minTop) || !Number.isFinite(maxBottom)) {
      return 0;
    }

    return Math.max(0, maxBottom - minTop);
  };

  const getPageNodePositions = useCallback(() => {
    if (!editor) {
      return [] as Array<{ pos: number; index: number }>;
    }

    const pages: Array<{ pos: number; index: number }> = [];
    let index = 0;

    editor.state.doc.forEach((node, offset) => {
      if (node.type.name === "page") {
        pages.push({ pos: offset, index });
        index += 1;
      }
    });

    return pages;
  }, [editor]);

  const moveLastBlockToNextPage = useCallback(
    (sourcePageIndex: number) => {
      if (!editor) {
        return false;
      }

      const { state } = editor;
      const pagePositions = getPageNodePositions();
      const sourcePagePos = pagePositions[sourcePageIndex]?.pos;

      if (sourcePagePos == null) {
        return false;
      }

      const sourcePageNode = state.doc.nodeAt(sourcePagePos);
      if (!sourcePageNode || sourcePageNode.type.name !== "page") {
        return false;
      }

      if (sourcePageNode.childCount <= 1) {
        return false;
      }

      const lastChildIndex = sourcePageNode.childCount - 1;
      const movedNode = sourcePageNode.child(lastChildIndex);
      let movedNodePos = sourcePagePos + 1;

      for (let index = 0; index < lastChildIndex; index += 1) {
        movedNodePos += sourcePageNode.child(index).nodeSize;
      }

      const sourcePageEndPos = sourcePagePos + sourcePageNode.nodeSize;
      const nextPagePos = pagePositions[sourcePageIndex + 1]?.pos;

      let tr = state.tr;
      tr = tr.delete(movedNodePos, movedNodePos + movedNode.nodeSize);

      if (nextPagePos != null) {
        const mappedNextInsertPos = tr.mapping.map(nextPagePos + 1, 1);
        tr = tr.insert(mappedNextInsertPos, movedNode);
      } else {
        const mappedSourceEnd = tr.mapping.map(sourcePageEndPos, 1);
        const newPageNode = state.schema.nodes.page.create(null, [movedNode]);
        tr = tr.insert(mappedSourceEnd, newPageNode);
      }

      isRebalancingRef.current = true;
      editor.view.dispatch(tr);
      isRebalancingRef.current = false;
      syncPageCount();

      return true;
    },
    [editor, getPageNodePositions, syncPageCount]
  );

  const rebalancePages = useCallback(() => {
    if (!editor || !editorContainerRef.current || isRebalancingRef.current) {
      return;
    }

    const pageEls = Array.from(
      editorContainerRef.current.querySelectorAll('[data-page-node="true"]')
    ) as HTMLElement[];

    const pagePositions = getPageNodePositions();
    if (!pageEls.length || !pagePositions.length) {
      syncPageCount();
      return;
    }
    const measurablePageCount = Math.min(pagePositions.length, pageEls.length);

    for (let pageIndex = 0; pageIndex < measurablePageCount; pageIndex += 1) {
      const pageEl = pageEls[pageIndex];
      if (!pageEl) {
        continue;
      }

      const usedHeight = getPageUsedHeight(pageEl);
      const contentCapacity = getPageContentCapacity(pageEl);

      if (usedHeight > contentCapacity + PAGE_OVERFLOW_TOLERANCE) {
        const moved = moveLastBlockToNextPage(pageIndex);
        if (moved) {
          if (rebalanceRafRef.current !== null) {
            cancelAnimationFrame(rebalanceRafRef.current);
          }

          rebalanceRafRef.current = requestAnimationFrame(() => {
            rebalanceRafRef.current = null;
            rebalancePagesRef.current();
          });
        }
        return;
      }
    }

    syncPageCount(pagePositions.length);
  }, [editor, getPageNodePositions, moveLastBlockToNextPage, syncPageCount]);

  useEffect(() => {
    rebalancePagesRef.current = rebalancePages;
  }, [rebalancePages]);

  const handlePageGapMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!editor || !editorContainerRef.current) return;

      const targetEl = event.target as HTMLElement;
      if (targetEl.closest('[data-page-node="true"]')) return;

      event.preventDefault();

      const pageEls = Array.from(
        editorContainerRef.current.querySelectorAll('[data-page-node="true"]')
      ) as HTMLElement[];

      if (!pageEls.length) {
        editor.commands.focus("end");
        return;
      }

      const pageEl =
        pageEls.find((node) => {
          const rect = node.getBoundingClientRect();
          return event.clientY <= rect.bottom;
        }) || pageEls[pageEls.length - 1];

      const pageRect = pageEl.getBoundingClientRect();
      const targetTop = Math.min(
        pageRect.bottom - PAGE_BOTTOM_PADDING - 8,
        Math.max(pageRect.top + PAGE_TOP_PADDING + 8, event.clientY)
      );
      const target = editor.view.posAtCoords({ left: event.clientX, top: targetTop });

      if (target?.pos != null) {
        editor.chain().focus().setTextSelection(target.pos).run();
      } else {
        editor.commands.focus("end");
      }
    },
    [editor]
  );

  // Track page content size changes and keep page allocation in sync
  useEffect(() => {
    if (!editor || !editorContainerRef.current) return;
    const proseMirrorEl = editorContainerRef.current.querySelector(".ProseMirror") as HTMLElement | null;
    if (!proseMirrorEl) return;

    const observer = new ResizeObserver(() => {
      if (rebalanceRafRef.current !== null) {
        cancelAnimationFrame(rebalanceRafRef.current);
      }

      rebalanceRafRef.current = requestAnimationFrame(() => {
        rebalanceRafRef.current = null;
        rebalancePagesRef.current();
      });
    });

    observer.observe(proseMirrorEl);
    return () => observer.disconnect();
  }, [editor]);

  const plainTextLength = editor?.getText()?.length ?? 0;

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  };

  const saveNow = async (nextTitle?: string) => {
    if (!editor || !noteId) {
      return;
    }

    const finalTitle = (nextTitle ?? title).trim() || "Untitled Note";
    const html = editor.getHTML();
    const text = editor.getText();

    if (
      finalTitle === lastSavedSnapshotRef.current.title &&
      html === lastSavedSnapshotRef.current.html
    ) {
      return;
    }

    await updateNote.mutateAsync({
      noteId,
      payload: {
        title: finalTitle,
        content: html,
        contentText: text,
      },
      skipInvalidate: true,
    });

    lastSavedSnapshotRef.current = { title: finalTitle, html };
    setLastSavedAt(new Date().toLocaleTimeString());
  };

  const scheduleAutosave = (nextTitle?: string) => {
    if (autosaveRef.current) {
      clearTimeout(autosaveRef.current);
    }

    autosaveRef.current = setTimeout(async () => {
      try {
        await saveNow(nextTitle);
      } catch {
        showToast("Autosave failed", "error");
      }
    }, 800);
  };

  useEffect(() => {
    initializedRef.current = false;
    lastSavedSnapshotRef.current = { title: "", html: "" };
    setLastSavedAt("");
  }, [noteId]);

  useEffect(() => {
    if (!note || !editor || initializedRef.current) {
      return;
    }

    const initialTitle = note.title || "Untitled Note";
    let initialHtml = "<p></p>";

    if (typeof note.content === "string" && note.content.trim()) {
      initialHtml = note.content;
    } else if (typeof note.contentText === "string" && note.contentText.trim()) {
      initialHtml = note.contentText
        .split("\n")
        .map((line) => `<p>${line || "<br/>"}</p>`)
        .join("");
    }

    setTitle(initialTitle);
    editor.commands.setContent(wrapLegacyHtmlAsPagedDocument(initialHtml), { emitUpdate: false });

    lastSavedSnapshotRef.current = {
      title: initialTitle,
      html: editor.getHTML(),
    };

    initializedRef.current = true;
    rebalancePagesRef.current();
  }, [note, editor]);

  useEffect(() => {
    return () => {
      if (autosaveRef.current) {
        clearTimeout(autosaveRef.current);
      }

      if (rebalanceRafRef.current !== null) {
        cancelAnimationFrame(rebalanceRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!editor) return;
    rebalancePagesRef.current();
  }, [docMargin, isTwoColumn, editor]);

  const handleTitleBlur = async () => {
    try {
      await saveNow(title);
    } catch {
      showToast("Failed to save title", "error");
    }
  };

  const handleExport = async (format: "pdf" | "docx") => {
    try {
      const response = await fetch("/api/notes/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, format }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to export note");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${title || "note"}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      showToast(`Exported as ${format.toUpperCase()}`, "success");
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "Failed to export note"), "error");
    }
  };

  const handlePreview = async () => {
    try {
      const response = await fetch("/api/notes/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, previewOnly: false, deckTitle: `${title} Deck` }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to create deck");
      }

      const data = await response.json();
      showToast("Deck created from note", "success");
      if (data?.deckId) {
        router.push(`/decks/${data.deckId}`);
      }
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "Failed to create deck"), "error");
    }
  };

  const openCropDialogForInsert = async (file: File) => {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCropImageSrc(dataUrl);
      setCropArea({ x: 0, y: 0 });
      setZoom(1);
      setCroppedPixels(null);
      setIsReplacingImage(false);
      setIsCropOpen(true);
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "Failed to load image"), "error");
    }
  };

  const handleImageInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) {
      return;
    }

    await openCropDialogForInsert(file);
    event.target.value = "";
  };

  const handleCropConfirm = async () => {
    if (!editor || !cropImageSrc || !croppedPixels) {
      return;
    }

    try {
      const cropped = await getCroppedImage(cropImageSrc, croppedPixels);

      if (isReplacingImage && editor.isActive("image")) {
        editor.chain().focus().updateAttributes("image", { src: cropped }).run();
      } else {
        editor.chain().focus().setImage({ src: cropped }).run();
        editor.chain().focus().updateAttributes("image", { width: "100%" }).run();
      }

      setIsCropOpen(false);
      setCropImageSrc("");
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "Failed to crop image"), "error");
    }
  };

  const resizeSelectedImage = (width: string) => {
    if (!editor || !editor.isActive("image")) {
      showToast("Select an image first", "error");
      return;
    }

    editor.chain().focus().updateAttributes("image", { width }).run();
  };

  const openCropForSelectedImage = () => {
    if (!editor || !editor.isActive("image")) {
      showToast("Select an image first", "error");
      return;
    }

    const src = editor.getAttributes("image").src as string | undefined;
    if (!src) {
      showToast("No image source found", "error");
      return;
    }

    setCropImageSrc(src);
    setCropArea({ x: 0, y: 0 });
    setZoom(1);
    setCroppedPixels(null);
    setIsReplacingImage(true);
    setIsCropOpen(true);
  };

  if (isLoading || !editor) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-muted-foreground">
        <FileText className="h-10 w-10" />
        <p>Note not found.</p>
      </div>
    );
  }

  const isImageSelected = editor.isActive("image");

  /* Reusable toolbar button */
  const ToolBtn = ({
    active,
    onClick,
    children,
    title: tooltip,
    disabled,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="mx-0.5 h-5 w-px bg-border" />;

  const HIGHLIGHT_COLORS = [
    { color: "#fef08a", label: "Yellow" },
    { color: "#bbf7d0", label: "Green" },
    { color: "#bfdbfe", label: "Blue" },
    { color: "#fbcfe8", label: "Pink" },
    { color: "#fed7aa", label: "Orange" },
    { color: "#e9d5ff", label: "Purple" },
  ];

  const pageContainerStyle: CSSProperties = {
    ["--page-height" as string]: `${PAGE_HEIGHT}px`,
    ["--page-gap" as string]: `${PAGE_GAP}px`,
    ["--page-top-padding" as string]: `${PAGE_TOP_PADDING}px`,
    ["--page-bottom-padding" as string]: `${PAGE_BOTTOM_PADDING}px`,
    ["--doc-margin" as string]: `${docMargin}px`,
  };

  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageInputChange}
      />

      <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
            <DialogDescription>
              Adjust the crop area and zoom, then insert the image.
            </DialogDescription>
          </DialogHeader>

          <div className="relative h-[360px] w-full overflow-hidden rounded-md border border-border/60 bg-muted">
            {cropImageSrc ? (
              <Cropper
                image={cropImageSrc}
                crop={cropArea}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCropArea}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) => setCroppedPixels(croppedAreaPixels)}
              />
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCropConfirm}>Apply Crop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-0 px-3 py-4 md:px-4 lg:px-6">

        {/* ── Header bar ── */}
        <div className="flex items-center justify-between gap-3 pb-4">
          <Input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              scheduleAutosave(event.target.value);
            }}
            onBlur={handleTitleBlur}
            className="h-auto border-none bg-transparent p-0 text-2xl font-bold tracking-tight shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
            placeholder="Untitled Note"
          />

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:block">
              {updateNote.isPending
                ? "Saving..."
                : lastSavedAt
                ? `Saved ${lastSavedAt}`
                : ""}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs">
                  Export
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => handleExport("docx")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as DOCX
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePreview}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Convert to Flashcards
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Sticky toolbar ── */}
        <div className="sticky top-0 z-20 -mx-3 mb-4 border-y border-border/50 bg-background/95 px-3 py-1.5 backdrop-blur-sm md:-mx-4 md:px-4 lg:-mx-6 lg:px-6">
          <div className="flex flex-wrap items-center gap-0.5">
            {/* Undo / Redo */}
            <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
              <Undo2 className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)">
              <Redo2 className="h-4 w-4" />
            </ToolBtn>

            <Divider />

            {/* Text style */}
            <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
              <Bold className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
              <Italic className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
              <UnderlineIcon className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
              <Strikethrough className="h-4 w-4" />
            </ToolBtn>

            <Divider />

            {/* Highlight dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-8 items-center gap-1 rounded-md px-1.5 text-sm transition-colors",
                    editor.isActive("highlight")
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Highlighter className="h-4 w-4" />
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-black/10"
                    style={{ backgroundColor: highlightColor }}
                  />
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-auto p-2">
                <div className="mb-2 flex gap-1.5">
                  {HIGHLIGHT_COLORS.map((h) => (
                    <button
                      key={h.color}
                      title={h.label}
                      onClick={() => {
                        setHighlightColor(h.color);
                        editor.chain().focus().toggleHighlight({ color: h.color }).run();
                      }}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                        highlightColor === h.color ? "border-foreground" : "border-transparent"
                      )}
                      style={{ backgroundColor: h.color }}
                    />
                  ))}
                </div>
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().unsetHighlight().run()}
                  className="text-xs"
                >
                  <Eraser className="mr-2 h-3.5 w-3.5" />
                  Remove highlight
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Font color dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 items-center gap-1 rounded-md px-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Palette className="h-4 w-4" />
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-black/10"
                    style={{ backgroundColor: fontColor }}
                  />
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-auto p-2">
                <div className="flex gap-1.5">
                  {["#111827","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899"].map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setFontColor(c);
                        editor.chain().focus().setColor(c).run();
                      }}
                      className={cn(
                        "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                        fontColor === c ? "border-foreground" : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="color"
                    value={fontColor}
                    onChange={(e) => {
                      setFontColor(e.target.value);
                      editor.chain().focus().setColor(e.target.value).run();
                    }}
                    className="h-6 w-6 cursor-pointer rounded border-none p-0"
                  />
                  <span className="text-xs text-muted-foreground">Custom</span>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Divider />

            {/* Headings dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors",
                    (editor.isActive("heading", { level: 1 }) || editor.isActive("heading", { level: 2 }) || editor.isActive("heading", { level: 3 }))
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Type className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
                  <span className="text-sm">Normal text</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                  <Heading1 className="mr-2 h-4 w-4" />
                  <span className="text-lg font-bold">Heading 1</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                  <Heading2 className="mr-2 h-4 w-4" />
                  <span className="text-base font-bold">Heading 2</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                  <Heading3 className="mr-2 h-4 w-4" />
                  <span className="text-sm font-bold">Heading 3</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Font size dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {fontSize.replace("px", "")}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-28">
                {([["12px", "Small"], ["14px", "Normal"], ["16px", "Medium"], ["20px", "Large"], ["24px", "XL"]] as [string, string][]).map(
                  ([size, label]) => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => {
                        setFontSize(size);
                        editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
                      }}
                      className={cn(fontSize === size && "bg-accent")}
                    >
                      <span className="text-xs">{label} ({size})</span>
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Divider />

            {/* Lists & blocks */}
            <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
              <List className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
              <ListOrdered className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
              <Quote className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">
              <Code2 className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
              <Minus className="h-4 w-4" />
            </ToolBtn>

            <Divider />

            {/* Alignment */}
            <ToolBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left">
              <AlignLeft className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center">
              <AlignCenter className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right">
              <AlignRight className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justify">
              <AlignJustify className="h-4 w-4" />
            </ToolBtn>

            {/* Line spacing */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="Line spacing"
                >
                  <ChevronsUpDown className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                {([["1", "Single"], ["1.25", "1.25"], ["1.5", "1.5"], ["1.75", "1.75"], ["2", "Double"], ["2.5", "2.5"]] as [string, string][]).map(
                  ([value, label]) => (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => {
                        setLineHeight(value);
                        editor.chain().focus().selectAll().updateAttributes("paragraph", { lineHeight: value }).run();
                      }}
                      className={cn(lineHeight === value && "bg-accent")}
                    >
                      <span className="text-xs">{label}</span>
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Divider />

            {/* Insert */}
            <ToolBtn
              active={editor.isActive("link")}
              onClick={() => {
                const previousUrl = editor.getAttributes("link").href;
                const url = window.prompt("Enter URL", previousUrl || "https://");
                if (url === null) return;
                if (url === "") { editor.chain().focus().unsetLink().run(); return; }
                editor.chain().focus().setLink({ href: url }).run();
              }}
              title="Insert link"
            >
              <Link2 className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn onClick={() => imageInputRef.current?.click()} title="Upload image">
              <ImagePlus className="h-4 w-4" />
            </ToolBtn>

            {/* Paragraph background color */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 items-center gap-1 rounded-md px-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="Paragraph background"
                >
                  <PaintBucket className="h-4 w-4" />
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-black/10"
                    style={{ backgroundColor: paragraphBg === "transparent" ? "transparent" : paragraphBg }}
                  />
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-auto p-2">
                <div className="mb-2 flex gap-1.5">
                  {[
                    { color: "transparent", label: "None" },
                    { color: "#fef9c3", label: "Yellow" },
                    { color: "#dcfce7", label: "Green" },
                    { color: "#dbeafe", label: "Blue" },
                    { color: "#fce7f3", label: "Pink" },
                    { color: "#f3e8ff", label: "Purple" },
                    { color: "#ffedd5", label: "Orange" },
                    { color: "#f1f5f9", label: "Gray" },
                  ].map((h) => (
                    <button
                      key={h.color}
                      title={h.label}
                      onClick={() => {
                        setParagraphBg(h.color);
                        editor
                          .chain()
                          .focus()
                          .updateAttributes(
                            editor.isActive("heading") ? "heading" : "paragraph",
                            { backgroundColor: h.color === "transparent" ? null : h.color }
                          )
                          .run();
                      }}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                        paragraphBg === h.color ? "border-foreground" : "border-transparent",
                        h.color === "transparent" && "bg-background"
                      )}
                      style={h.color !== "transparent" ? { backgroundColor: h.color } : undefined}
                    >
                      {h.color === "transparent" && (
                        <span className="flex h-full items-center justify-center text-xs text-muted-foreground">∅</span>
                      )}
                    </button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Divider />

            {/* Margin selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="Page margins"
                >
                  <Ruler className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {([[96, "Narrow", "0.5 in"], [72, "Normal", "1 in"], [48, "Wide", "1.5 in"], [24, "Compact", "0.25 in"]] as [number, string, string][]).map(
                  ([px, label, desc]) => (
                    <DropdownMenuItem
                      key={px}
                      onClick={() => setDocMargin(px)}
                      className={cn(docMargin === px && "bg-accent")}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-sm">{label}</span>
                        <span className="text-xs text-muted-foreground">{desc}</span>
                      </div>
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Layout & clear */}
            <ToolBtn
              active={isTwoColumn}
              onClick={() => setIsTwoColumn((v) => !v)}
              title="Two column layout"
            >
              {isTwoColumn ? <Columns2 className="h-4 w-4" /> : <Columns className="h-4 w-4" />}
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
              title="Clear formatting"
            >
              <Eraser className="h-4 w-4" />
            </ToolBtn>
          </div>
        </div>

        {/* ── Editor document ── */}
        <div
          ref={editorContainerRef}
          className="note-pages relative mx-auto w-full max-w-[816px]"
          style={pageContainerStyle}
          data-two-column={isTwoColumn || undefined}
          onMouseDownCapture={handlePageGapMouseDown}
        >
          <EditorContent editor={editor} />

          {/* Floating image toolbar */}
          {isImageSelected && imageToolbarPos && (
            <div
              className="absolute z-30 flex items-center gap-1 rounded-lg border border-border bg-popover px-2 py-1.5 shadow-lg"
              style={{
                top: Math.max(0, imageToolbarPos.top),
                left: imageToolbarPos.left,
                transform: "translateX(-50%)",
              }}
            >
              {(["25%", "50%", "75%", "100%"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => resizeSelectedImage(size)}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                    editor.getAttributes("image").width === size
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {size}
                </button>
              ))}
              <div className="mx-0.5 h-5 w-px bg-border" />
              <button type="button" onClick={openCropForSelectedImage} title="Crop image" className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <Crop className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => { const cw = editor.getAttributes("image").width as string; resizeSelectedImage(cw === "100%" ? "50%" : "100%"); }} title="Toggle size" className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <RectangleHorizontal className="h-3.5 w-3.5" />
              </button>
              <div className="mx-0.5 h-5 w-px bg-border" />
              <button type="button" onClick={() => editor.chain().focus().deleteSelection().run()} title="Delete image" className="flex h-7 w-7 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <span>
            {plainTextLength} characters • {pageCount} {pageCount === 1 ? "page" : "pages"}
          </span>
          <span>
            {updateNote.isPending
              ? "Saving..."
              : lastSavedAt
              ? `Last saved at ${lastSavedAt}`
              : "Autosave enabled"}
          </span>
        </div>
      </div>
    </>
  );
}
