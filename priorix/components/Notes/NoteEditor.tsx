"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Extension } from "@tiptap/core";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
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
  ImagePlus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  MoreHorizontal,
  FileDown,
  FileText,
  Sparkles,
  Strikethrough,
  Quote,
  Code2,
  Minus,
  Trash2,
  Type,
  ChevronUp,
  Palette,
  Highlighter,
  TextSelect,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useNote, useNoteMutations } from "@/hooks/useNotes";

interface NoteEditorProps {
  noteId: string;
}

// Custom extension to clean up legacy paginated HTML
const cleanLegacyHtml = (html: string) => {
  if (!html.includes('data-page-node="true"')) return html;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const pages = doc.querySelectorAll('[data-page-node="true"]');
    if (pages.length > 0) {
      let combinedHtml = "";
      pages.forEach((p) => (combinedHtml += p.innerHTML));
      return combinedHtml;
    }
  } catch (e) {
    console.error("Failed to parse legacy HTML", e);
  }
  return html;
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
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
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
                style: `background-color: ${attributes.backgroundColor}; padding: 2px 4px; border-radius: 4px;`,
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
        parseHTML: (element) =>
          element.getAttribute("data-width") || element.style.width || "100%",
        renderHTML: (attributes) => ({
          "data-width": attributes.width,
          style: `width: ${attributes.width}; height: auto; border-radius: 12px; margin-top: 1rem; margin-bottom: 1rem;`,
        }),
      },
    };
  },
});

const createImageElement = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Failed to load image")),
    );
    image.src = url;
  });

const getCroppedImage = async (
  imageSrc: string,
  crop: Area,
): Promise<string> => {
  const image = await createImageElement(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context unavailable");
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
    crop.height,
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

const DEFAULT_FONT_SIZE = "16px";
const FONT_SIZE_OPTIONS = ["12px", "14px", "16px", "18px", "20px", "24px", "30px"];

export default function NoteEditor({ noteId }: NoteEditorProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const { data: note, isLoading } = useNote(true, noteId);
  const { updateNote } = useNoteMutations();

  const [title, setTitle] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string>("");

  // Font Color & Highlight Color State
  const [fontColor, setFontColor] = useState("#ffffff");
  const [highlightColor, setHighlightColor] = useState("#fef08a");
  const [currentFontSize, setCurrentFontSize] = useState(DEFAULT_FONT_SIZE);
  const [, setToolbarRefreshTick] = useState(0);

  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropArea, setCropArea] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const [isReplacingImage, setIsReplacingImage] = useState(false);
  const [imageToolbarPos, setImageToolbarPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const initializedRef = useRef(false);
  const autosaveRef = useRef<NodeJS.Timeout | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const lastTextSelectionRef = useRef<{ from: number; to: number } | null>(
    null,
  );
  const lastSavedSnapshotRef = useRef<{ title: string; html: string }>({
    title: "",
    html: "",
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
          "img.ProseMirror-selectednode",
        ) as HTMLImageElement | null;
        if (imgEl) {
          const containerRect =
            editorContainerRef.current.getBoundingClientRect();
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
    [],
  );

  const syncToolbarState = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      updateImageToolbar(e);

      const selection = e?.state?.selection;
      if (selection) {
        lastTextSelectionRef.current = {
          from: selection.from,
          to: selection.to,
        };
      }

      const activeSize = e?.getAttributes("textStyle")?.fontSize;
      setCurrentFontSize(
        typeof activeSize === "string" && activeSize.trim()
          ? activeSize
          : DEFAULT_FONT_SIZE,
      );

      // Force toolbar buttons to reflect editor active marks immediately.
      setToolbarRefreshTick((tick) => tick + 1);
    },
    [updateImageToolbar],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      TextStyle,
      Color,
      FontSize,
      ParagraphBgColor,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ResizableImage.configure({ allowBase64: true }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "tiptap-editor prose prose-lg dark:prose-invert prose-headings:font-bold max-w-none focus:outline-none min-h-[50vh]",
      },
    },
    onUpdate: ({ editor: e }) => {
      scheduleAutosave();
      syncToolbarState(e);
    },
    onSelectionUpdate: ({ editor: e }) => syncToolbarState(e),
    onTransaction: ({ editor: e }) => syncToolbarState(e),
    immediatelyRender: false,
  });

  const saveNow = async (nextTitle?: string) => {
    if (!editor || !noteId) return;
    const finalTitle = (nextTitle ?? title).trim() || "Untitled Note";
    const html = editor.getHTML();
    const text = editor.getText();

    if (
      finalTitle === lastSavedSnapshotRef.current.title &&
      html === lastSavedSnapshotRef.current.html
    )
      return;

    await updateNote.mutateAsync({
      noteId,
      payload: { title: finalTitle, content: html, contentText: text },
      skipInvalidate: true,
    });

    lastSavedSnapshotRef.current = { title: finalTitle, html };
    setLastSavedAt(new Date().toLocaleTimeString());
  };

  const scheduleAutosave = (nextTitle?: string) => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(async () => {
      try {
        await saveNow(nextTitle);
      } catch {
        showToast("Autosave failed", "error");
      }
    }, 800);
  };

  const applyFontSize = useCallback(
    (size: string) => {
      if (!editor) return;

      const savedSelection = lastTextSelectionRef.current;
      let chain = editor.chain().focus();

      if (savedSelection) {
        const maxPos = editor.state.doc.content.size;
        chain = chain.setTextSelection({
          from: Math.min(savedSelection.from, maxPos),
          to: Math.min(savedSelection.to, maxPos),
        });
      }

      chain
        .setMark("textStyle", {
          ...editor.getAttributes("textStyle"),
          fontSize: size,
        })
        .run();

      setCurrentFontSize(size);
      setToolbarRefreshTick((tick) => tick + 1);
    },
    [editor],
  );

  const toggleList = useCallback(
    (type: "bullet" | "ordered" | "task") => {
      if (!editor) return;

      const savedSelection = lastTextSelectionRef.current;
      let chain = editor.chain().focus();

      if (savedSelection) {
        const maxPos = editor.state.doc.content.size;
        chain = chain.setTextSelection({
          from: Math.min(savedSelection.from, maxPos),
          to: Math.min(savedSelection.to, maxPos),
        });
      }

      if (type === "bullet") {
        chain.toggleBulletList().run();
      } else if (type === "ordered") {
        chain.toggleOrderedList().run();
      } else {
        chain.toggleTaskList().run();
      }

      setToolbarRefreshTick((tick) => tick + 1);
    },
    [editor],
  );

  useEffect(() => {
    initializedRef.current = false;
    lastSavedSnapshotRef.current = { title: "", html: "" };
    setLastSavedAt("");
  }, [noteId]);

  useEffect(() => {
    if (!note || !editor || initializedRef.current) return;

    const initialTitle = note.title || "";
    let initialHtml = "<p></p>";

    if (typeof note.content === "string" && note.content.trim()) {
      initialHtml = cleanLegacyHtml(note.content);
    } else if (
      typeof note.contentText === "string" &&
      note.contentText.trim()
    ) {
      initialHtml = note.contentText
        .split("\n")
        .map((line) => `<p>${line || "<br/>"}</p>`)
        .join("");
    }

    setTitle(initialTitle);
    editor.commands.setContent(initialHtml, { emitUpdate: false });

    lastSavedSnapshotRef.current = {
      title: initialTitle,
      html: editor.getHTML(),
    };
    initializedRef.current = true;
  }, [note, editor]);

  useEffect(() => {
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
  }, []);

  const handleExport = async (format: "pdf" | "docx") => {
    try {
      const response = await fetch("/api/notes/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, format }),
      });

      if (!response.ok) throw new Error("Failed to export note");

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
    } catch (err) {
      showToast("Failed to export note", "error");
    }
  };

  const handlePreview = async () => {
    try {
      const response = await fetch("/api/notes/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId,
          previewOnly: false,
          deckTitle: `${title} Deck`,
        }),
      });
      if (!response.ok) throw new Error("Failed to create deck");
      const data = await response.json();
      showToast("Deck created from note", "success");
      if (data?.deckId) router.push(`/decks/${data.deckId}`);
    } catch (err) {
      showToast("Failed to create deck", "error");
    }
  };

  const handleImageInputChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCropImageSrc(dataUrl);
      setCropArea({ x: 0, y: 0 });
      setZoom(1);
      setCroppedPixels(null);
      setIsReplacingImage(false);
      setIsCropOpen(true);
    } catch {
      showToast("Failed to load image", "error");
    }
    event.target.value = "";
  };

  const handleCropConfirm = async () => {
    if (!editor || !cropImageSrc || !croppedPixels) return;
    try {
      const cropped = await getCroppedImage(cropImageSrc, croppedPixels);
      if (isReplacingImage && editor.isActive("image")) {
        editor
          .chain()
          .focus()
          .updateAttributes("image", { src: cropped })
          .run();
      } else {
        editor.chain().focus().setImage({ src: cropped }).run();
      }
      setIsCropOpen(false);
      setCropImageSrc("");
    } catch {
      showToast("Failed to crop image", "error");
    }
  };

  if (isLoading || !editor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background text-muted-foreground">
        <FileText className="h-10 w-10" />
        <p>Note not found.</p>
      </div>
    );
  }

  const ToolBtn = ({
    active,
    onClick,
    children,
    title: tooltip,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-sm transition-all duration-200",
        active
          ? "bg-foreground text-background shadow-md scale-105"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );

  const Divider = () => (
    <div className="mx-2 h-6 w-[1.5px] rounded-full bg-border/80" />
  );

  const HIGHLIGHT_COLORS = [
    "#fef08a",
    "#bbf7d0",
    "#bfdbfe",
    "#fbcfe8",
    "#fed7aa",
    "#e9d5ff",
  ];
  const TEXT_COLORS = [
    "#ffffff",
    "#000000",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
  ];

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
          </DialogHeader>
          <div className="relative h-[360px] w-full overflow-hidden rounded-xl border bg-muted">
            {cropImageSrc && (
              <Cropper
                image={cropImageSrc}
                crop={cropArea}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCropArea}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) =>
                  setCroppedPixels(croppedAreaPixels)
                }
              />
            )}
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full mt-2"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCropConfirm}>Apply Crop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Immersive Canvas Container */}
      <div className="relative min-h-screen w-full bg-background selection:bg-primary/30">
        {/* Minimalist Top Header */}
        <header className="sticky top-16 z-30 w-full bg-background/80 backdrop-blur-xl border-b border-border/40">
          <div className="mx-auto flex w-full max-w-[850px] items-center justify-between px-6 py-4">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground/80">
                {title || "Untitled"}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {updateNote.isPending
                  ? "Syncing..."
                  : lastSavedAt
                    ? `Saved at ${lastSavedAt}`
                    : "All changes saved locally"}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl p-2 shadow-2xl"
              >
                <DropdownMenuItem
                  onClick={() => handleExport("pdf")}
                  className="rounded-lg py-2.5 cursor-pointer"
                >
                  <FileDown className="mr-2 h-4 w-4" /> Export Document (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExport("docx")}
                  className="rounded-lg py-2.5 cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4" /> Export Document (DOCX)
                </DropdownMenuItem>
                <div className="my-1 border-t border-border/50" />
                <DropdownMenuItem
                  onClick={handlePreview}
                  className="rounded-lg py-2.5 text-primary focus:text-primary focus:bg-primary/10 cursor-pointer"
                >
                  <Sparkles className="mr-2 h-4 w-4" /> Generate Flashcards
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Editor Area */}
        <main className="mx-auto w-full max-w-[850px] px-6 pt-16 pb-48">
          {/* Immersive Title Input */}
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              scheduleAutosave(e.target.value);
            }}
            onBlur={() => saveNow(title)}
            className="mb-8 w-full bg-transparent text-5xl sm:text-6xl font-black tracking-tight text-foreground outline-none placeholder:text-muted-foreground/20 transition-all"
            placeholder="Document Title"
          />

          {/* Tiptap Canvas */}
          <div ref={editorContainerRef} className="relative w-full">
            <EditorContent editor={editor} />

            {/* Floating Image Actions (Appears only when an image is clicked) */}
            {editor.isActive("image") && imageToolbarPos && (
              <div
                className="absolute z-30 flex items-center gap-1 rounded-full border border-border bg-background/90 px-3 py-2 shadow-2xl backdrop-blur-md"
                style={{
                  top: Math.max(0, imageToolbarPos.top),
                  left: imageToolbarPos.left,
                  transform: "translateX(-50%)",
                }}
              >
                {(["50%", "75%", "100%"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .updateAttributes("image", { width: size })
                        .run()
                    }
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      editor.getAttributes("image").width === size
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {size}
                  </button>
                ))}
                <div className="mx-2 h-5 w-px bg-border" />
                <button
                  onClick={() => editor.chain().focus().deleteSelection().run()}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Floating Glass Dock */}
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 w-[95%] sm:w-auto">
          <div className="flex w-full overflow-x-auto sm:overflow-visible no-scrollbar items-center gap-1 rounded-full border border-border/40 bg-background/60 p-2 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] backdrop-blur-2xl dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)]">
            {/* Headers Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors hover:bg-muted hover:text-foreground text-muted-foreground"
                  title="Heading Level"
                >
                  <Type className="h-4 w-4" /> <ChevronUp className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="top"
                sideOffset={16}
                className="w-40 rounded-xl p-2 shadow-2xl"
              >
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().setParagraph().run()}
                  className="rounded-lg py-2"
                >
                  Normal text
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                  }
                  className="rounded-lg py-2 font-bold text-lg"
                >
                  Heading 1
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  className="rounded-lg py-2 font-semibold text-base"
                >
                  Heading 2
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  className="rounded-lg py-2 font-medium"
                >
                  Heading 3
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Font Size Dropdown */}
            <DropdownMenu
              onOpenChange={(open) => {
                if (!open) return;
                const selection = editor.state.selection;
                lastTextSelectionRef.current = {
                  from: selection.from,
                  to: selection.to,
                };
              }}
            >
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors hover:bg-muted hover:text-foreground text-muted-foreground"
                  title="Text Size"
                >
                  <TextSelect className="h-4 w-4" />
                  <span className="text-xs font-semibold">{currentFontSize}</span>
                  <ChevronUp className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                side="top"
                sideOffset={16}
                className="w-24 rounded-xl p-2 shadow-2xl min-w-0"
              >
                {FONT_SIZE_OPTIONS.map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onSelect={() => applyFontSize(size)}
                    className={cn(
                      "rounded-lg py-1.5 justify-center text-xs font-medium cursor-pointer",
                      currentFontSize === size && "bg-muted text-foreground",
                    )}
                  >
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Divider />

            {/* Core Formatting */}
            <ToolBtn
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline"
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </ToolBtn>

            {/* Colors */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Text Color"
                >
                  <Palette
                    className="h-4 w-4"
                    style={{
                      color: fontColor !== "#ffffff" ? fontColor : undefined,
                    }}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                side="top"
                sideOffset={16}
                className="w-auto p-2 rounded-xl shadow-2xl"
              >
                <div className="flex gap-1.5">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setFontColor(c);
                        editor.chain().focus().setColor(c).run();
                      }}
                      className={cn(
                        "h-6 w-6 rounded-full border border-border/50 transition-transform hover:scale-110",
                        fontColor === c &&
                          "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Highlight */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors text-muted-foreground hover:text-foreground hover:bg-muted",
                    editor.isActive("highlight") &&
                      "bg-foreground text-background hover:bg-foreground hover:text-background",
                  )}
                  title="Highlight"
                >
                  <Highlighter className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                side="top"
                sideOffset={16}
                className="w-auto p-2 rounded-xl shadow-2xl"
              >
                <div className="flex gap-1.5">
                  {HIGHLIGHT_COLORS.map((h) => (
                    <button
                      key={h}
                      onClick={() => {
                        setHighlightColor(h);
                        editor
                          .chain()
                          .focus()
                          .toggleHighlight({ color: h })
                          .run();
                      }}
                      className={cn(
                        "h-6 w-6 rounded-full border border-border/50 transition-transform hover:scale-110",
                        highlightColor === h &&
                          "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                      )}
                      style={{ backgroundColor: h }}
                    />
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Divider />

            {/* Bullet & Numbered Lists (Grouped for Prominence) */}
            <ToolBtn
              active={editor.isActive("bulletList")}
              onClick={() => toggleList("bullet")}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              active={editor.isActive("orderedList")}
              onClick={() => toggleList("ordered")}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              active={editor.isActive("taskList")}
              onClick={() => toggleList("task")}
              title="Checklist"
            >
              <Check className="h-4 w-4" />
            </ToolBtn>

            <Divider />

            {/* Alignment Group */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted text-muted-foreground hover:text-foreground">
                  {editor.isActive({ textAlign: "center" }) ? (
                    <AlignCenter className="h-4 w-4" />
                  ) : editor.isActive({ textAlign: "right" }) ? (
                    <AlignRight className="h-4 w-4" />
                  ) : (
                    <AlignLeft className="h-4 w-4" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                side="top"
                sideOffset={16}
                className="flex flex-row gap-1 rounded-full p-1 shadow-2xl min-w-0"
              >
                <ToolBtn
                  active={editor.isActive({ textAlign: "left" })}
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                >
                  <AlignLeft className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                  active={editor.isActive({ textAlign: "center" })}
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                >
                  <AlignCenter className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                  active={editor.isActive({ textAlign: "right" })}
                  onClick={() =>
                    editor.chain().focus().setTextAlign("right").run()
                  }
                >
                  <AlignRight className="h-4 w-4" />
                </ToolBtn>
              </DropdownMenuContent>
            </DropdownMenu>

            <Divider />

            {/* Insert Tools */}
            <ToolBtn
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              active={editor.isActive("codeBlock")}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              title="Code Block"
            >
              <Code2 className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              onClick={() => imageInputRef.current?.click()}
              title="Image"
            >
              <ImagePlus className="h-4 w-4" />
            </ToolBtn>

            <Divider />

            {/* Undo / Redo */}
            <div className="flex gap-1 pr-1">
              <ToolBtn
                onClick={() => editor.chain().focus().undo().run()}
                title="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </ToolBtn>
              <ToolBtn
                onClick={() => editor.chain().focus().redo().run()}
                title="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </ToolBtn>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
