import React, { useState } from "react";
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
import { CreateDeckRequest } from "@/types/deck";
import { useSession } from "next-auth/react";

interface AddDeckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDeck: (deck: CreateDeckRequest) => void;
}

const AddDeckModal: React.FC<AddDeckModalProps> = ({
  open,
  onOpenChange,
  onAddDeck,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();

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
      });

      // Reset form and close modal
      setTitle("");
      setDescription("");
      setIsPublic(true);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Deck</DialogTitle>
          <DialogDescription>
            Add a new flashcard deck. Click create when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
                placeholder="Enter deck description"
                rows={3}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={isLoading}
              />
              <Label htmlFor="isPublic">Make this deck public</Label>
            </div>
          </div>
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Deck"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDeckModal;
