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
    "rounded-lg border border-border/60 bg-background/80 px-3 py-2 shadow-inner focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60";

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
      <DialogContent className="modal-surface sm:max-w-[520px] p-0">
        <DialogHeader className="flex flex-row items-start gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 via-muted/40 to-transparent px-6 py-5">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-inner ring-1 ring-primary/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-left">
            <DialogTitle className="text-xl">Create New Deck</DialogTitle>
            <DialogDescription>
              Craft a fresh deck with a description, privacy, and folder.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              placeholder="Enter deck title"
              required
              disabled={isLoading}
              className={fieldStyles}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="What makes this deck special?"
              rows={3}
              disabled={isLoading}
              className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 shadow-inner focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="folder">Folder (optional)</Label>
            <div className="relative">
              <FolderGit2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                id="folder"
                className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 pl-9 text-foreground shadow-inner focus:outline-hidden focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
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
          <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 px-4 py-3 shadow-inner">
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isLoading}
            />
            <div>
              <Label htmlFor="isPublic" className="cursor-pointer">
                Make this deck public
              </Label>
              <p className="text-sm text-muted-foreground">
                Let others discover and study this deck.
              </p>
            </div>
          </div>
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <DialogFooter className="border-t border-border/60 bg-background/40 px-1 pt-4">
            <div className="flex w-full items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="shadow-[0_12px_30px_rgba(139,92,246,0.35)]"
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
