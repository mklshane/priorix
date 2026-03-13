import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Sparkles, FolderGit2 } from "lucide-react";
import { CreateDeckRequest, Folder } from "@/types/deck";
import { useSession } from "next-auth/react";

interface AddDeckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDeck: (deck: CreateDeckRequest) => void;
  folders?: Folder[];
  defaultFolderId?: string | null;
}

const AddDeckModal: React.FC<AddDeckModalProps> = ({
  open,
  onOpenChange,
  onAddDeck,
  folders = [],
  defaultFolderId = null,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | "" | null>(
    defaultFolderId ?? ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();

  const fieldStyles =
    "min-h-[48px] rounded-xl border-2 border-border bg-background px-4 py-2 font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:border-foreground disabled:opacity-60 transition-colors";

  useEffect(() => {
    setSelectedFolderId(defaultFolderId ?? "");
  }, [defaultFolderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const userId = session?.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      onAddDeck({
        title: title.trim(),
        description: description.trim(),
        isPublic: isPublic,
        folderId:
          selectedFolderId === "" || selectedFolderId === undefined
            ? null
            : selectedFolderId,
      });

      // Reset form and close modal
      setTitle("");
      setDescription("");
      setIsPublic(true);
      setSelectedFolderId(defaultFolderId ?? "");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating deck:", error);
      setError("Failed to create deck. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-2 border-border shadow-bento !rounded-[2rem] bg-card max-h-[95dvh] flex flex-col">
        <DialogHeader className="flex flex-col items-center justify-center gap-2 border-b-2 border-border bg-mint px-6 py-6 shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-border bg-white shadow-bento-sm">
            <Sparkles className="h-6 w-6 text-foreground" />
          </div>
          <div className="space-y-1 text-center">
            <DialogTitle className="font-editorial text-3xl text-foreground">Create Deck</DialogTitle>
            <DialogDescription className="text-foreground/70 font-medium text-xs">
              Craft a fresh deck for your study sessions.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              placeholder="e.g. Advanced Biology"
              required
              disabled={isLoading}
              className={fieldStyles}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="What makes this deck special?"
              rows={3}
              disabled={isLoading}
              className={fieldStyles}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Folder (optional)</Label>
            <div className="relative">
              <FolderGit2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <select
                id="folder"
                className="w-full min-h-[48px] rounded-xl border-2 border-border bg-background px-4 py-2 pl-11 font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:border-foreground disabled:opacity-60 transition-colors"
                value={selectedFolderId ?? ""}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                disabled={isLoading}
              >
                <option value="">No folder</option>
                {folders.map((folder) => (
                  <option key={folder._id} value={folder._id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 transition-colors">
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isLoading}
              className="data-[state=checked]:bg-foreground"
            />
            <div>
              <Label htmlFor="isPublic" className="font-bold cursor-pointer text-base">
                Public Deck
              </Label>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Let others discover and study this deck.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border-2 border-red-500 bg-red-100 px-4 py-3 text-sm font-bold text-red-900">
              {error}
            </div>
          )}

          <DialogFooter className="pt-2">
            <div className="flex w-full items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="h-12 px-6 rounded-xl font-bold hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 px-8 rounded-xl border-2 border-border bg-foreground text-background font-bold hover:bg-foreground/90 hover:-translate-y-0.5 transition-transform"
              >
                {isLoading ? "Creating..." : "Create Deck"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDeckModal;
