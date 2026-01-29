"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  MoreVertical,
  Trash2,
  Edit,
  Star,
  Share,
  Copy,
  X,
  MessageSquare,
  Twitter,
  Linkedin,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Deck, Folder } from "@/types/deck";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import EditDeckDialog from "./Deck/EditDeckDialog";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";

const recordDeckAccess = async (deckId: string, userId: string) => {
  try {
    const response = await fetch("/api/user-deck-activity/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deckId, userId }),
    });

    if (!response.ok) {
      console.error("Failed to record deck access:", response.statusText);
    }
  } catch (err) {
    console.error("Failed to record deck access:", err);
  }
};

const addFavorite = async (deckId: string, userId: string) => {
  const res = await fetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, deckId }),
  });
  return res.json();
};

const removeFavorite = async (deckId: string, userId: string) => {
  const res = await fetch("/api/favorites", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, deckId }),
  });
  return res.json();
};

interface DeckCardProps {
  deck: Deck & {
    length?: number;
    lastStudied?: string;
  };
  className?: string;
  onClick?: (deckId: string) => void;
  onDeleteClick?: (deckId: string) => void;
  onEditClick?: (
    deckId: string,
    title: string,
    description: string,
    isPublic: boolean,
    folderId: string | null
  ) => void;
  index?: number;
  showMenu?: boolean;
  queryClient?: ReturnType<typeof useQueryClient>;
  folders?: Folder[];
}

const colors = ["bg-pink", "bg-green", "bg-yellow", "bg-purple"];

const DeckCard: React.FC<DeckCardProps> = ({
  deck,
  className,
  onDeleteClick,
  onEditClick,
  index = 0,
  showMenu = true,
  queryClient,
  folders = [],
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editFolderId, setEditFolderId] = useState<string | "" | null>("");
  const [isClicked, setIsClicked] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);

  if (!deck) return null;

  useEffect(() => {
    const checkFavorite = async () => {
      if (!session?.user?.id || !deck._id) return;

      try {
        const res = await fetch(
          `/api/favorites?userId=${session.user.id}&deckId=${deck._id}`
        );
        const data = await res.json();

        if (res.ok) {
          setIsFavorited(data.isFavorited);
        }
      } catch (err) {
        console.error("Failed to fetch favorite status:", err);
      }
    };

    checkFavorite();
  }, [session?.user?.id, deck._id]);

  const deckLength =
    deck.length ?? (deck.flashcards ? deck.flashcards.length : 0);

  const isOwner =
    session?.user?.id === deck.user ||
    (deck.user &&
      typeof deck.user === "object" &&
      deck.user._id === session?.user?.id);

  const handleDeckClick = async (deckId: string) => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 150); // Reset after animation

    if (typeof window !== "undefined") {
      sessionStorage.setItem("fromDashboardRecent", "true");
      sessionStorage.setItem("lastDashboardPath", window.location.pathname);
    }

    if (session?.user?.id) {
      await recordDeckAccess(deckId, session.user.id);
    }
    router.push(`/decks/${deckId}`);
  };

  const handleShareDeck = async (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation();
    setShareDialogOpen(true);
  };

  const resolveFolderId = (folderValue: Deck["folder"]) => {
    if (!folderValue) return "";
    if (typeof folderValue === "string") return folderValue;
    if (typeof folderValue === "object" && "_id" in folderValue) {
      return (folderValue as { _id: string })._id;
    }
    return "";
  };

  const copyToClipboard = async (deckId: string) => {
    try {
      const shareUrl = `${window.location.origin}/decks/${deckId}`;
      const shareText = `Check out this deck "${deck.title}" on Priorix: ${shareUrl}`;

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareText);
        showToast("Deck link copied to clipboard!", "success");
        setShareDialogOpen(false);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showToast("Deck link copied to clipboard!", "success");
        setShareDialogOpen(false);
      }
    } catch (err) {
      console.error("Failed to copy link:", err);
      showToast("Failed to copy link", "error");
    }
  };

  const shareViaPlatform = (platform: string, deckId: string) => {
    const shareUrl = `${window.location.origin}/decks/${deckId}`;
    const shareText = `Check out this deck "${deck.title}" on Priorix`;

    let url = "";

    switch (platform) {
      case "messenger":
        url = `fb-messenger://share?link=${encodeURIComponent(shareUrl)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          shareUrl
        )}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(
          `${shareText}: ${shareUrl}`
        )}`;
        break;
      default:
        return;
    }

    window.open(url, "_blank", "width=600,height=400");
  };

  const handleToggleFavorite = async (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation();

    if (!session?.user?.id) {
      showToast("You must be logged in", "error");
      return;
    }

    try {
      if (isFavorited) {
        const res = await removeFavorite(deckId, session.user.id);
        if (!res.error) {
          showToast("Removed from favorites", "success");
          setIsFavorited(false);
          queryClient?.invalidateQueries({
            queryKey: ["favoriteDecks", session.user.id],
          });
        } else {
          showToast(res.error, "error");
        }
      } else {
        const res = await addFavorite(deckId, session.user.id);
        if (!res.error) {
          showToast("Added to favorites", "success");
          setIsFavorited(true);
          queryClient?.invalidateQueries({
            queryKey: ["favoriteDecks", session.user.id],
          });
        } else {
          showToast(res.error, "error");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Something went wrong", "error");
    }
  };

  const getDisplayName = () => {
    if (deck.user && typeof deck.user === "object" && deck.user.name) {
      return deck.user.name.split(" ")[0];
    }

    if (typeof deck.user === "string") {
      return deck.user;
    }

    return "Unknown";
  };

  return (
    <>
      <Card
        onClick={() => handleDeckClick(deck._id)}
        className={cn(
          `
    relative cursor-pointer overflow-hidden
    ${colors[index % colors.length]}
    border border-black/10 dark:border-white/10
    rounded-xl
    shadow-sm
    transition-all duration-200 ease-out
    hover:-translate-y-1 hover:shadow-lg
    active:translate-y-0
    `,
          isClicked && "translate-y-0",
          className,
        )}
      >
        <div className="absolute inset-x-0 top-0 h-[6px] bg-black/5 dark:bg-white/5" />

        <CardContent className="pt-6 pb-4 px-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-semibold font-sora line-clamp-2">
              {deck.title}
            </h3>

            {showMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mt-1 -mr-2 hover:bg-black/10 dark:hover:bg-white/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  {isOwner && (
                    <>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditTitle(deck.title);
                          setEditDescription(deck.description || "");
                          setEditIsPublic(deck.isPublic || true);
                          setEditFolderId(resolveFolderId(deck.folder));
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick?.(deck._id);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem
                    onClick={(e) => handleToggleFavorite(e, deck._id)}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4 mr-2",
                        isFavorited && "fill-yellow-400 text-yellow-400",
                      )}
                    />
                    {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={(e) => handleShareDeck(e, deck._id)}
                  >
                    <Share className="h-4 w-4 mr-2" /> Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Body */}
          <div className="flex-grow mb-6">
            {deck.description ? (
              <p className="text-xs line-clamp-3">{deck.description}</p>
            ) : (
              <p className="text-xs opacity-60 italic">No description</p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between text-xs">
            <span className="font-semibold">{deckLength} cards</span>

            <span className="opacity-80">
              {getDisplayName()}
              {!isOwner && <span className="ml-1">• Shared</span>}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-0 shadow-xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-xl font-sora text-center flex items-center justify-between">
              <span className="flex-1 text-center">Share Deck</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center space-y-2 mb-4">
              <h3 className="font-medium text-lg text-center line-clamp-2">
                {deck.title}
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Share this deck with others
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <Button
                variant="outline"
                className="flex flex-col items-center h-16 py-2 px-3 bg-background hover:bg-accent"
                onClick={() => copyToClipboard(deck._id)}
              >
                <Link2 className="h-6 w-6 mb-1" />
                <span className="text-xs">Copy Link</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center h-16 py-2 px-3 bg-background hover:bg-accent"
                onClick={() => shareViaPlatform("messenger", deck._id)}
              >
                <MessageSquare className="h-6 w-6 mb-1 text-blue-600" />
                <span className="text-xs">Messenger</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center h-16 py-2 px-3 bg-background hover:bg-accent"
                onClick={() => shareViaPlatform("linkedin", deck._id)}
              >
                <Linkedin className="h-6 w-6 mb-1 text-blue-700" />
                <span className="text-xs">LinkedIn</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center h-16 py-2 px-3 bg-background hover:bg-accent"
                onClick={() => shareViaPlatform("whatsapp", deck._id)}
              >
                <MessageSquare className="h-6 w-6 mb-1 text-green-500" />
                <span className="text-xs">WhatsApp</span>
              </Button>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShareDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => copyToClipboard(deck._id)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Deck Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Deck Dialog - only show for owner */}
      {isOwner && (
        <EditDeckDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onEditSubmit={async (title, description, isPublic, folderId) => {
            if (deck._id) {
              await onEditClick?.(
                deck._id,
                title,
                description,
                isPublic,
                folderId,
              );
            }
          }}
          initialTitle={editTitle}
          initialDescription={editDescription}
          initialIsPublic={editIsPublic}
          initialFolderId={editFolderId || null}
          folders={folders}
        />
      )}
    </>
  );
};

export default DeckCard;
