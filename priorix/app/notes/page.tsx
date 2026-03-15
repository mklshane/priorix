"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/useToast";
import { useNoteFolders } from "@/hooks/useNoteFolders";
import { useNoteMutations, useNotes } from "@/hooks/useNotes";
import NoteCard from "@/components/Notes/NoteCard";
import { Note } from "@/types/note";
import {
  Plus,
  Search,
  FolderOpen,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  StickyNote,
  X,
  ArrowUpDown,
  FolderPlus,
} from "lucide-react";

/* ── colour palette cycling ── */
const NOTE_COLORS = [
  "bg-blush dark:bg-blush text-foreground",
  "bg-citrus dark:bg-citrus text-foreground",
  "bg-sky dark:bg-sky text-foreground",
  "bg-lilac dark:bg-lilac text-foreground",
  "bg-mint dark:bg-mint text-foreground",
  "bg-tangerine dark:bg-tangerine text-foreground",
];

const FOLDER_COLORS = [
  { bg: "bg-lilac dark:bg-lilac", icon: "text-foreground" },
  { bg: "bg-citrus dark:bg-citrus", icon: "text-foreground" },
  { bg: "bg-sky dark:bg-sky", icon: "text-foreground" },
  { bg: "bg-blush dark:bg-blush", icon: "text-foreground" },
  { bg: "bg-mint dark:bg-mint", icon: "text-foreground" },
];

export default function NotesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToast();

  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "date">("recent");

  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateChooserOpen, setIsCreateChooserOpen] = useState(false);
  const [isRenameNoteOpen, setIsRenameNoteOpen] = useState(false);
  const [isRenameFolderOpen, setIsRenameFolderOpen] = useState(false);

  const [noteTitle, setNoteTitle] = useState("");
  const [folderName, setFolderName] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);

  const enabled = status === "authenticated" && !!session?.user?.id;

  const {
    folders,
    createFolder,
    renameFolder,
    deleteFolder,
    isLoading: foldersLoading,
  } = useNoteFolders(enabled);

  /* Always fetch ALL notes — never filter by folder at the API level */
  const { data: allNotes = [], isLoading: notesLoading } = useNotes(enabled, {
    search: searchQuery,
    sortBy,
  });

  const { createNote, updateNote, deleteNote } = useNoteMutations();

  /* Derive the visible notes: if a folder is active, show only its notes */
  const displayedNotes = useMemo(() => {
    if (!activeFolder) return allNotes;
    return allNotes.filter((n) => {
      if (!n.folder) return false;
      if (typeof n.folder === "object") return n.folder._id === activeFolder;
      return n.folder === activeFolder;
    });
  }, [allNotes, activeFolder]);

  const activeFolderObj = useMemo(
    () => (activeFolder ? folders.find((f) => f._id === activeFolder) : null),
    [activeFolder, folders]
  );

  const rootNotesCount = useMemo(
    () => allNotes.filter((n) => !n.folder).length,
    [allNotes]
  );

  const hasFilters = !!activeFolder || !!searchQuery.trim();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("add") === "true") {
        setIsCreateNoteOpen(true);
        // Clean up URL so it doesn't reopen on refresh
        window.history.replaceState({}, "", "/notes");
      }
    }
  }, []);

  /* ── handlers ── */
  const handleCreateNote = async () => {
    if (!noteTitle.trim()) { showToast("Note title is required", "error"); return; }
    try {
      const note = await createNote.mutateAsync({
        title: noteTitle.trim(),
        folderId: activeFolder,
        content: "",
      });
      setNoteTitle("");
      setIsCreateNoteOpen(false);
      showToast("Note created", "success");
      router.push(`/notes/${note._id}`);
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to create note", "error");
    }
  };

  const handleRenameNote = async () => {
    if (!selectedNote || !noteTitle.trim()) { showToast("Note title is required", "error"); return; }
    try {
      await updateNote.mutateAsync({ noteId: selectedNote._id, payload: { title: noteTitle.trim() } });
      setIsRenameNoteOpen(false);
      setSelectedNote(null);
      setNoteTitle("");
      showToast("Note renamed", "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to rename note", "error");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try { await deleteNote.mutateAsync(noteId); showToast("Note deleted", "success"); }
    catch (err: unknown) { showToast((err as Error)?.message || "Failed to delete note", "error"); }
  };

  const handleMoveNote = async (noteId: string, folderId: string | null) => {
    try { await updateNote.mutateAsync({ noteId, payload: { folderId } }); showToast("Note moved", "success"); }
    catch (err: unknown) { showToast((err as Error)?.message || "Failed to move note", "error"); }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) { showToast("Folder name is required", "error"); return; }
    try {
      await createFolder.mutateAsync(folderName.trim());
      setFolderName("");
      setIsCreateFolderOpen(false);
      showToast("Folder created", "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to create folder", "error");
    }
  };

  const handleRenameFolder = async () => {
    if (!renameFolderId || !folderName.trim()) { showToast("Folder name is required", "error"); return; }
    try {
      await renameFolder.mutateAsync({ folderId: renameFolderId, name: folderName.trim() });
      setIsRenameFolderOpen(false);
      setRenameFolderId(null);
      setFolderName("");
      showToast("Folder renamed", "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to rename folder", "error");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await deleteFolder.mutateAsync(folderId);
      if (activeFolder === folderId) setActiveFolder(null);
      showToast("Folder deleted", "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to delete folder", "error");
    }
  };

  const handleClearFilters = () => {
    setActiveFolder(null);
    setSearchQuery("");
  };

  /* ── loading / auth ── */
  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!session?.user?.id) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <FileText className="h-10 w-10" />
        <p>Please sign in to access notes.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
      <section className="bento-card">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-editorial tracking-tight">Notes</h1>
            <p className="text-sm uppercase tracking-widest font-bold text-muted-foreground/50">
              Capture ideas fast, organize with folders.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              className="btn-primary"
              onClick={() => setIsCreateChooserOpen(true)}
            >
              <Plus className="h-4 w-4" />
              ADD NEW
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full h-10 rounded-xl border-2 border-border bg-background pl-9 focus:outline-none focus:ring-0 text-sm font-bold uppercase tracking-widest"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative border-2 border-border bg-card rounded-xl shadow-sm">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="appearance-none bg-transparent pl-4 pr-10 py-2.5 text-xs md:text-sm uppercase tracking-widest font-bold focus:outline-none focus:ring-0 cursor-pointer text-foreground"
              >
                <option value="recent">Most recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="date">Created date</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-foreground/50">
                ▼
              </div>
            </div>

            {hasFilters && (
              <button
                className="btn-base border-2 border-border text-xs uppercase tracking-widest hover:bg-muted"
                onClick={handleClearFilters}
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-editorial italic tracking-tight text-foreground/70">Folders</h2>
          {activeFolderObj && (
            <span className="text-[10px] uppercase font-bold tracking-widest bg-mint text-mint-foreground px-3 py-1 rounded-full border-2 border-border shadow-sm">
              Viewing {activeFolderObj.name}
            </span>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveFolder(null)}
            className={`flex w-44 lg:w-52 shrink-0 flex-col gap-2 rounded-2xl border-2 p-4 text-left transition-all ${
              !activeFolder
                ? "border-border shadow-bento bg-tangerine dark:bg-tangerine"
                : "border-border shadow-sm bg-card hover:-translate-y-1 hover:shadow-bento"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-background border-2 border-border shadow-sm`}>
              <StickyNote className="h-5 w-5 text-foreground" />
            </div>
            <div className="mt-2 min-w-0">
              <p className={`truncate text-sm font-bold uppercase tracking-widest ${!activeFolder ? "text-black" : ""}`}>All Notes</p>
              <p className={`text-xs font-medium ${!activeFolder ? "text-black/70" : "text-muted-foreground"}`}>{allNotes.length} total</p>
            </div>
          </button>

          {foldersLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 w-44 lg:w-52 shrink-0 animate-pulse rounded-2xl bg-muted border-2 border-border shadow-sm" />
              ))
            : folders.map((folder, idx) => {
                const isActive = activeFolder === folder._id;
                // We'll map the legacy colors to our new ones based on index
                const folderStyle = [
                  "bg-lilac dark:bg-lilac",
                  "bg-citrus dark:bg-citrus",
                  "bg-sky dark:bg-sky",
                  "bg-blush dark:bg-blush",
                  "bg-mint dark:bg-mint",
                ][idx % 5];

                return (
                  <div
                    key={folder._id}
                    className={`group relative flex w-44 lg:w-52 shrink-0 cursor-pointer flex-col gap-3 rounded-2xl border-2 p-4 transition-all ${
                      isActive
                        ? `border-border shadow-bento ${folderStyle}`
                        : "border-border bg-card shadow-sm hover:-translate-y-1 hover:shadow-bento"
                    }`}
                    onClick={() => setActiveFolder(isActive ? null : folder._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-background border-2 border-border shadow-sm`}>
                        <FolderOpen className="h-5 w-5 text-foreground" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameFolderId(folder._id);
                              setFolderName(folder.name);
                              setIsRenameFolderOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder._id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="min-w-0">
                      <p className={`truncate text-sm font-bold uppercase tracking-widest ${isActive ? "text-black" : ""}`}>{folder.name}</p>
                      <p className={`mt-0.5 text-xs font-medium ${isActive ? "text-black/70" : "text-muted-foreground"}`}>
                        {folder.noteCount || 0} note{(folder.noteCount || 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}

        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-editorial italic tracking-tight text-foreground/70">
            {activeFolder ? `Notes in ` : "All Notes"} 
            {activeFolder && <span className="text-foreground not-italic font-bold ml-1">"{activeFolderObj?.name}"</span>}
            <span className="ml-2 text-sm font-sans font-bold uppercase tracking-widest text-muted-foreground/50">({displayedNotes.length})</span>
          </h2>

          {searchQuery.trim() && (
            <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              Results for <span className="text-foreground">“{searchQuery.trim()}”</span>
            </p>
          )}
        </div>

        {notesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted border-2 border-border" />
            ))}
          </div>
        ) : displayedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card py-20 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted border-2 border-border">
              <StickyNote className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mt-5 text-lg font-bold uppercase tracking-widest">
              {activeFolder ? "No notes in this folder" : "No notes yet"}
            </h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground font-medium">
              {activeFolder
                ? "Create a note here or move one from another folder."
                : "Create your first note to start writing and organizing ideas."}
            </p>
            <button className="btn-primary mt-6" onClick={() => setIsCreateChooserOpen(true)}>
              <Plus className="h-4 w-4" />
              ADD NOTE
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedNotes.map((note, idx) => (
              <NoteCard
                key={note._id}
                note={note}
                folders={folders}
                colorClass={NOTE_COLORS[idx % NOTE_COLORS.length]}
                onOpen={(noteId) => router.push(`/notes/${noteId}`)}
                onRename={(n) => {
                  setSelectedNote(n);
                  setNoteTitle(n.title);
                  setIsRenameNoteOpen(true);
                }}
                onDelete={handleDeleteNote}
                onMove={handleMoveNote}
              />
            ))}
          </div>
        )}
      </section>

      {/* ═══════ DIALOGS ═══════ */}
      <Dialog open={isCreateChooserOpen} onOpenChange={setIsCreateChooserOpen}>
        <DialogContent className="modal-surface p-0 sm:max-w-[520px]">
          <DialogHeader className="flex flex-row items-start gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 via-muted/40 to-transparent px-6 py-5">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-inner ring-1 ring-primary/20">
              <Plus className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-left">
              <DialogTitle className="text-xl">Add to notes</DialogTitle>
              <DialogDescription>
                Choose what you want to create.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4 px-6 pb-6 pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                variant="default"
                className="h-full justify-between border border-yellow/60 bg-yellow text-foreground shadow-[0_12px_30px_rgba(255,215,0,0.35)] transition-transform hover:scale-[1.01] hover:shadow-[0_16px_36px_rgba(255,215,0,0.4)]"
                onClick={() => {
                  setIsCreateChooserOpen(false);
                  setIsCreateNoteOpen(true);
                }}
              >
                <div className="flex flex-col items-start gap-1 text-left">
                  <span className="font-semibold">New Note</span>
                  <span className="text-xs text-foreground/80">
                    Start writing instantly.
                  </span>
                </div>
                <FileText className="h-4 w-4" />
              </Button>

              <Button
                variant="secondary"
                className="h-full justify-between border border-pink/60 bg-pink text-foreground shadow-[0_12px_30px_rgba(255,182,251,0.35)] transition-transform hover:scale-[1.01] hover:shadow-[0_16px_36px_rgba(255,182,251,0.45)]"
                onClick={() => {
                  setIsCreateChooserOpen(false);
                  setIsCreateFolderOpen(true);
                }}
              >
                <div className="flex flex-col items-start gap-1 text-left">
                  <span className="font-semibold">New Folder</span>
                  <span className="text-xs text-foreground/80">
                    Organize notes by topic.
                  </span>
                </div>
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              You can move notes between folders anytime.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen}>
        <DialogContent className="modal-surface p-0 sm:max-w-[560px]">
          <DialogHeader className="flex flex-row items-start gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 via-muted/40 to-transparent px-6 py-5">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-inner ring-1 ring-primary/20">
              <FileText className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-left">
              <DialogTitle className="text-xl">Create note</DialogTitle>
              <DialogDescription>
                {activeFolder
                  ? `This note will be added to "${activeFolderObj?.name}".`
                  : "Give your note a clear title so it’s easy to find later."}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-3 px-6 pb-5 pt-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Note title
              </p>
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="e.g., Biology - Chapter 3 Summary"
                autoFocus
                className="h-11 rounded-xl border-border bg-background"
                onKeyDown={(e) => e.key === "Enter" && handleCreateNote()}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter to create quickly.
            </p>
          </div>

          <DialogFooter className="border-t border-border/60 bg-background/60 px-6 py-4 sm:justify-between">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsCreateNoteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={handleCreateNote}
              disabled={createNote.isPending}
            >
              {createNote.isPending ? "Creating..." : "Create Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameNoteOpen} onOpenChange={setIsRenameNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename note</DialogTitle>
            <DialogDescription>Update your note title.</DialogDescription>
          </DialogHeader>
          <Input
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Note title"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleRenameNote()}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameNoteOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameNote} disabled={updateNote.isPending}>
              {updateNote.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="modal-surface p-0 sm:max-w-[560px]">
          <DialogHeader className="flex flex-row items-start gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 via-muted/40 to-transparent px-6 py-5">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-inner ring-1 ring-primary/20">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-left">
              <DialogTitle className="text-xl">Create folder</DialogTitle>
              <DialogDescription>
                Group related notes in one place for faster navigation.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-3 px-6 pb-5 pt-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Folder name
              </p>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g., Project Notes"
                autoFocus
                className="h-11 rounded-xl border-border bg-background"
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Keep folder names short and descriptive.
            </p>
          </div>

          <DialogFooter className="border-t border-border/60 bg-background/60 px-6 py-4 sm:justify-between">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsCreateFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={handleCreateFolder}
              disabled={createFolder.isPending}
            >
              {createFolder.isPending ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameFolderOpen} onOpenChange={setIsRenameFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
            <DialogDescription>Update your folder name.</DialogDescription>
          </DialogHeader>
          <Input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameFolder}
              disabled={renameFolder.isPending}
            >
              {renameFolder.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
