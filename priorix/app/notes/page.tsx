"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FolderPlus,
  Layers,
  ArrowUpDown
} from "lucide-react";

const NOTE_COLORS = [
  "bg-blush dark:bg-blush text-foreground",
  "bg-citrus dark:bg-citrus text-foreground",
  "bg-sky dark:bg-sky text-foreground",
  "bg-lilac dark:bg-lilac text-foreground",
  "bg-mint dark:bg-mint text-foreground",
  "bg-tangerine dark:bg-tangerine text-foreground",
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
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm font-bold uppercase tracking-widest">Loading Workspace</span>
        </div>
      </div>
    );
  }
  if (!session?.user?.id) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
        <div className="p-4 rounded-full bg-muted border-2 border-border">
          <FileText className="h-8 w-8" />
        </div>
        <p className="font-bold uppercase tracking-widest text-sm">Please sign in to access notes.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 md:py-12">
      
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-border bg-lilac/30 shadow-sm text-xs font-bold uppercase tracking-widest text-foreground">
              <Layers className="h-3.5 w-3.5" /> Workspace
            </div>
            <h1 className="text-5xl md:text-6xl font-editorial tracking-tight text-foreground">Notes</h1>
            <p className="text-lg font-sans text-muted-foreground max-w-xl">
              Capture your thoughts, organize with folders, and never lose an idea.
            </p>
          </div>

          <Button
            className="h-12 md:h-14 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-2 border-border shadow-bento-sm hover:-translate-y-1 hover:shadow-bento transition-all active:translate-y-0 text-base"
            onClick={() => setIsCreateChooserOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New
          </Button>
        </div>

        {/* Search & Filters Row */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center p-2 rounded-[1.5rem] bg-card border-2 border-border shadow-bento-sm">
          <div className="relative w-full flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your notes..."
              className="w-full h-12 rounded-2xl border-0 bg-transparent pl-11 text-base font-medium focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
            />
          </div>
          
          <div className="w-px h-8 bg-border hidden md:block" />

          <div className="flex items-center gap-2 px-2 pb-2 md:pb-0">
            <div className="relative min-w-[160px]">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full h-12 appearance-none bg-muted/50 rounded-xl px-4 pr-10 text-xs md:text-sm font-bold uppercase tracking-widest focus:outline-none cursor-pointer text-foreground hover:bg-muted transition-colors border-2 border-transparent hover:border-border"
              >
                <option value="recent">Most recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="date">Created date</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="h-12 rounded-xl text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              >
                <X className="h-4 w-4 mr-1.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ═══════ FOLDERS ═══════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-editorial tracking-tight text-foreground">Collections</h2>
          {activeFolderObj && (
            <span className="text-[10px] uppercase font-bold tracking-widest bg-mint text-mint-foreground px-3 py-1 rounded-full border-2 border-border shadow-sm">
              Viewing {activeFolderObj.name}
            </span>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x">
          {/* "All Notes" Card */}
          <button
            onClick={() => setActiveFolder(null)}
            className={`flex w-48 md:w-56 shrink-0 flex-col gap-3 rounded-[2rem] border-2 p-5 text-left transition-all snap-start ${
              !activeFolder
                ? "border-border shadow-bento bg-tangerine text-black scale-[1.02]"
                : "border-border shadow-sm bg-card hover:-translate-y-1 hover:shadow-bento-sm hover:bg-accent/50"
            }`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-border shadow-sm ${!activeFolder ? "bg-background text-foreground" : "bg-muted text-foreground"}`}>
              <StickyNote className="h-5 w-5" />
            </div>
            <div className="mt-2 min-w-0">
              <p className={`truncate text-base font-bold font-sans ${!activeFolder ? "text-black" : "text-foreground"}`}>All Notes</p>
              <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${!activeFolder ? "text-black/70" : "text-muted-foreground"}`}>{allNotes.length} total</p>
            </div>
          </button>

          {/* Folder Cards */}
          {foldersLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-36 w-48 md:w-56 shrink-0 animate-pulse rounded-[2rem] bg-muted border-2 border-border shadow-sm snap-start" />
              ))
            : folders.map((folder, idx) => {
                const isActive = activeFolder === folder._id;
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
                    className={`group relative flex w-48 md:w-56 shrink-0 cursor-pointer flex-col gap-3 rounded-[2rem] border-2 p-5 transition-all snap-start ${
                      isActive
                        ? `border-border shadow-bento scale-[1.02] ${folderStyle}`
                        : "border-border bg-card shadow-sm hover:-translate-y-1 hover:shadow-bento-sm hover:bg-accent/50"
                    }`}
                    onClick={() => setActiveFolder(isActive ? null : folder._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-border shadow-sm ${isActive ? "bg-background" : "bg-muted"}`}>
                        <FolderOpen className="h-5 w-5 text-foreground" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background/50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-2xl border-2 border-border shadow-bento-sm">
                          <DropdownMenuItem
                            className="rounded-xl cursor-pointer"
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
                          <DropdownMenuSeparator className="bg-border/50" />
                          <DropdownMenuItem
                            variant="destructive"
                            className="rounded-xl cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-500/10"
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

                    <div className="mt-2 min-w-0">
                      <p className={`truncate text-base font-bold font-sans ${isActive ? "text-black" : "text-foreground"}`}>{folder.name}</p>
                      <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${isActive ? "text-black/60" : "text-muted-foreground"}`}>
                        {folder.noteCount || 0} note{(folder.noteCount || 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
        </div>
      </section>

      {/* ═══════ NOTES GRID ═══════ */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b-2 border-border pb-4">
          <h2 className="text-2xl font-editorial tracking-tight text-foreground flex items-baseline gap-2">
            {activeFolder ? `Notes in ` : "Recent Notes"} 
            {activeFolder && <span className="font-bold font-sans text-xl">"{activeFolderObj?.name}"</span>}
          </h2>

          <div className="flex items-center gap-4">
            {searchQuery.trim() && (
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Results for <span className="text-foreground">“{searchQuery.trim()}”</span>
              </p>
            )}
            <span className="text-xs font-bold uppercase tracking-widest bg-muted px-2 py-1 rounded-md border-2 border-border/50">
               {displayedNotes.length} Items
            </span>
          </div>
        </div>

        {notesLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[220px] animate-pulse rounded-3xl bg-muted border-2 border-border" />
            ))}
          </div>
        ) : displayedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-border/60 bg-card/50 py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background border-2 border-border shadow-sm mb-6">
              <StickyNote className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-2xl font-bold font-sans text-foreground mb-2">
              {activeFolder ? "This folder is empty" : "No notes yet"}
            </h3>
            <p className="max-w-md text-base text-muted-foreground font-medium mb-8">
              {activeFolder
                ? "Start adding notes to this collection to keep your thoughts organized."
                : "Create your first note to start writing, planning, and organizing ideas."}
            </p>
            <Button 
              className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-2 border-border shadow-bento-sm hover:-translate-y-1 transition-all" 
              onClick={() => setIsCreateNoteOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Note
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-12">
            {displayedNotes.map((note, idx) => (
              <NoteCard
                key={note._id}
                note={note}
                folders={folders}
                colorClass={`${NOTE_COLORS[idx % NOTE_COLORS.length]} rounded-3xl`}
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
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 border-2 border-border shadow-bento overflow-hidden bg-card">
          <DialogHeader className="p-6 md:p-8 bg-muted/30 border-b-2 border-border text-center">
            <DialogTitle className="text-2xl font-editorial tracking-tight">Create New</DialogTitle>
            <DialogDescription className="text-sm font-medium">
              Choose what you want to add to your workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setIsCreateChooserOpen(false);
                setIsCreateNoteOpen(true);
              }}
              className="group flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-border bg-tangerine/20 hover:bg-tangerine/40 transition-all hover:-translate-y-1 hover:shadow-bento-sm"
            >
              <div className="h-14 w-14 rounded-full bg-tangerine border-2 border-border shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <FileText className="h-6 w-6 text-tangerine-foreground" />
              </div>
              <span className="font-bold font-sans text-lg">New Note</span>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1 text-center">Start writing</span>
            </button>

            <button
              onClick={() => {
                setIsCreateChooserOpen(false);
                setIsCreateFolderOpen(true);
              }}
              className="group flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-border bg-sky/20 hover:bg-sky/40 transition-all hover:-translate-y-1 hover:shadow-bento-sm"
            >
              <div className="h-14 w-14 rounded-full bg-sky border-2 border-border shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <FolderPlus className="h-6 w-6 text-sky-foreground" />
              </div>
              <span className="font-bold font-sans text-lg">New Folder</span>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1 text-center">Organize items</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-0 border-2 border-border shadow-bento overflow-hidden bg-card">
          <DialogHeader className="p-6 md:p-8 pb-0">
            <DialogTitle className="text-2xl font-editorial tracking-tight flex items-center gap-3">
               <div className="h-10 w-10 rounded-full bg-tangerine border-2 border-border flex items-center justify-center shadow-sm">
                 <FileText className="h-5 w-5 text-tangerine-foreground" />
               </div>
               Create Note
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 md:p-8 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Note Title
              </label>
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="e.g., Biology Chapter 3"
                autoFocus
                className="h-14 rounded-2xl border-2 border-border bg-background px-4 font-medium text-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary shadow-inner"
                onKeyDown={(e) => e.key === "Enter" && handleCreateNote()}
              />
            </div>
            
            <Button
              className="w-full h-14 rounded-full bg-foreground text-background font-bold border-2 border-border shadow-bento-sm hover:bg-foreground/90 hover:-translate-y-0.5 transition-all text-base mt-4"
              onClick={handleCreateNote}
              disabled={createNote.isPending || !noteTitle.trim()}
            >
              {createNote.isPending ? "Creating..." : "Create Note"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameNoteOpen} onOpenChange={setIsRenameNoteOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-0 border-2 border-border shadow-bento overflow-hidden bg-card">
          <DialogHeader className="p-6 md:p-8 pb-0">
            <DialogTitle className="text-2xl font-editorial tracking-tight">Rename Note</DialogTitle>
          </DialogHeader>
          <div className="p-6 md:p-8 pt-4 space-y-6">
            <Input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title"
              autoFocus
              className="h-14 rounded-2xl border-2 border-border bg-background px-4 font-medium text-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary shadow-inner"
              onKeyDown={(e) => e.key === "Enter" && handleRenameNote()}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-full border-2 border-border font-bold hover:bg-muted"
                onClick={() => setIsRenameNoteOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 h-12 rounded-full border-2 border-border font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                onClick={handleRenameNote} 
                disabled={updateNote.isPending || !noteTitle.trim()}
              >
                {updateNote.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-0 border-2 border-border shadow-bento overflow-hidden bg-card">
          <DialogHeader className="p-6 md:p-8 pb-0">
            <DialogTitle className="text-2xl font-editorial tracking-tight flex items-center gap-3">
               <div className="h-10 w-10 rounded-full bg-sky border-2 border-border flex items-center justify-center shadow-sm">
                 <FolderPlus className="h-5 w-5 text-sky-foreground" />
               </div>
               Create Folder
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 md:p-8 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Folder Name
              </label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g., Project Ideas"
                autoFocus
                className="h-14 rounded-2xl border-2 border-border bg-background px-4 font-medium text-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary shadow-inner"
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
            </div>
            
            <Button
              className="w-full h-14 rounded-full bg-foreground text-background font-bold border-2 border-border shadow-bento-sm hover:bg-foreground/90 hover:-translate-y-0.5 transition-all text-base mt-4"
              onClick={handleCreateFolder}
              disabled={createFolder.isPending || !folderName.trim()}
            >
              {createFolder.isPending ? "Creating..." : "Create Folder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameFolderOpen} onOpenChange={setIsRenameFolderOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-0 border-2 border-border shadow-bento overflow-hidden bg-card">
          <DialogHeader className="p-6 md:p-8 pb-0">
            <DialogTitle className="text-2xl font-editorial tracking-tight">Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="p-6 md:p-8 pt-4 space-y-6">
            <Input
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name"
              autoFocus
              className="h-14 rounded-2xl border-2 border-border bg-background px-4 font-medium text-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary shadow-inner"
              onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-full border-2 border-border font-bold hover:bg-muted"
                onClick={() => setIsRenameFolderOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 h-12 rounded-full border-2 border-border font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                onClick={handleRenameFolder} 
                disabled={renameFolder.isPending || !folderName.trim()}
              >
                {renameFolder.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}