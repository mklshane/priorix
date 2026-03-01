"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";

/* ── colour palette cycling ── */
const NOTE_COLORS = [
  "bg-rose-50 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100",
  "bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100",
  "bg-sky-50 dark:bg-sky-950/30 text-sky-950 dark:text-sky-100",
  "bg-violet-50 dark:bg-violet-950/30 text-violet-950 dark:text-violet-100",
  "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100",
  "bg-fuchsia-50 dark:bg-fuchsia-950/30 text-fuchsia-950 dark:text-fuchsia-100",
];

const FOLDER_COLORS = [
  { bg: "bg-violet-100 dark:bg-violet-900/50", icon: "text-violet-600 dark:text-violet-300" },
  { bg: "bg-amber-100 dark:bg-amber-900/50", icon: "text-amber-600 dark:text-amber-300" },
  { bg: "bg-sky-100 dark:bg-sky-900/50", icon: "text-sky-600 dark:text-sky-300" },
  { bg: "bg-rose-100 dark:bg-rose-900/50", icon: "text-rose-600 dark:text-rose-300" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/50", icon: "text-emerald-600 dark:text-emerald-300" },
  { bg: "bg-fuchsia-100 dark:bg-fuchsia-900/50", icon: "text-fuchsia-600 dark:text-fuchsia-300" },
];

export default function NotesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToast();

  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
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
    sortBy: "recent",
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
      {/* ═══════ HEADER ═══════ */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {allNotes.length} note{allNotes.length !== 1 ? "s" : ""} &middot;{" "}
            {folders.length} folder{folders.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2  text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="h-10 rounded-xl border-gray-300 bg-primary-foreground pl-9 text-sm shadow-none focus-visible:bg-background"
            />
          </div>
          <Button
            size="sm"
            className="h-10 gap-2 rounded-xl px-4"
            onClick={() => setIsCreateNoteOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Note</span>
          </Button>
        </div>
      </header>

      <hr className="border-border/50" />

      {/* ═══════ FOLDERS ═══════ */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Folders</h2>
          {activeFolder && (
            <button
              onClick={() => setActiveFolder(null)}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              Viewing: {activeFolderObj?.name}
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {foldersLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 w-48 shrink-0 animate-pulse rounded-2xl bg-muted"
                />
              ))
            : folders.map((folder, idx) => {
                const color = FOLDER_COLORS[idx % FOLDER_COLORS.length];
                const isActive = activeFolder === folder._id;
                return (
                  <div
                    key={folder._id}
                    className={`group relative flex w-52 shrink-0 cursor-pointer flex-col gap-3 rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      isActive
                        ? "border-primary/50 bg-primary/5 shadow-md"
                        : "border-border bg-primary-foreground hover:border-border hover:bg-primary-foreground/70 dark:bg-muted/30"
                    }`}
                    onClick={() =>
                      setActiveFolder(isActive ? null : folder._id)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${color.bg}`}
                      >
                        <FolderOpen className={`h-5 w-5 ${color.icon}`} />
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
                      <p className="truncate text-sm font-semibold">
                        {folder.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {folder.noteCount || 0} note
                        {(folder.noteCount || 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}

          {/* New Folder */}
          <button
            onClick={() => setIsCreateFolderOpen(true)}
            className="flex h-31 w-48 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs font-medium">New folder</span>
          </button>
        </div>
      </section>

      <hr className="border-border/50" />

      {/* ═══════ NOTES ═══════ */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            {activeFolder ? `Notes in "${activeFolderObj?.name}"` : "All Notes"}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({displayedNotes.length})
            </span>
          </h2>
        </div>

        {notesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        ) : displayedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/40 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <StickyNote className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">
              {activeFolder ? "No notes in this folder" : "No notes yet"}
            </h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              {activeFolder
                ? "Create a note inside this folder or move existing notes here."
                : "Create your first note to start writing."}
            </p>
            <Button
              className="mt-6 gap-2 rounded-xl"
              onClick={() => setIsCreateNoteOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Note
            </Button>
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

            {/* New Note card */}
            <button
              onClick={() => setIsCreateNoteOpen(true)}
              className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">New Note</span>
            </button>
          </div>
        )}
      </section>

      {/* ═══════ DIALOGS ═══════ */}
      <Dialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create note</DialogTitle>
            <DialogDescription>
              {activeFolder
                ? `This note will be added to "${activeFolderObj?.name}".`
                : "Add a title to create your new note."}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Note title"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreateNote()}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateNoteOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateNote} disabled={createNote.isPending}>
              {createNote.isPending ? "Creating..." : "Create"}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create folder</DialogTitle>
            <DialogDescription>
              Add a folder for organizing notes.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={createFolder.isPending}
            >
              {createFolder.isPending ? "Creating..." : "Create"}
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
