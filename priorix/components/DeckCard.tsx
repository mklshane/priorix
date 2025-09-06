"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical, Trash2, Edit, Star, Share, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Deck } from "@/types/deck";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import EditDeckDialog from "./Deck/EditDeckDialog";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/useToast";

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
    isPublic: boolean
  ) => void;
  index?: number;
  showMenu?: boolean;
}

const colors = ["bg-pink", "bg-green", "bg-yellow", "bg-purple"];

const DeckCard: React.FC<DeckCardProps> = ({
  deck,
  className,
  onDeleteClick,
  onEditClick,
  index = 0,
  showMenu = true,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [isClicked, setIsClicked] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();

  if (!deck) return null;

  const deckLength =
    deck.length ?? (deck.flashcards ? deck.flashcards.length : 0);

  // Check if the current user is the owner of this deck
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

    try {
      const shareUrl = `${window.location.origin}/decks/${deckId}`;

      // Copy to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Link copied to clipboard!", "success");
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showToast("Link copied to clipboard!", "success");
      }
    } catch (err) {
      console.error("Failed to copy link:", err);
      showToast("Failed to copy link", "error");
    }
  };

  // no implementation yet
  const handleAddToFavorites = (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation();
    console.log("Add to favorites:", deckId);
    showToast("Added to favorites!", "success");
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
        className={cn(
          `border-0 overflow-hidden ${
            colors[index % colors.length]
          } shadow-md border-2 border-primary cursor-pointer dark:border-[#D8B4FE]
          transition-all duration-200 ease-out dark:bg-card2
          hover:shadow-lg hover:-translate-y-1.5
          active:translate-y-0 active:shadow-md`,
          isClicked && "translate-y-0",
          className
        )}
        onClick={() => handleDeckClick(deck._id)}
      >
        <CardContent className="py-3 px-7 flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold font-sora line-clamp-2 text-foreground">
              {deck.title}
            </h3>

            {/* Show menu if enabled */}
            {showMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mt-1 -mr-2 transition-all duration-200 hover:bg-white/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Owner-specific options */}
                  {isOwner && (
                    <>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditTitle(deck.title);
                          setEditDescription(deck.description || "");
                          setEditIsPublic(deck.isPublic || true);
                          setEditDialogOpen(true);
                        }}
                        className="transition-colors duration-150 hover:bg-accent"
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick?.(deck._id);
                        }}
                        className="text-red-600 transition-colors duration-150 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* Options for all users (owner and non-owner) */}
                  <DropdownMenuItem
                    onClick={(e) => handleAddToFavorites(e, deck._id)}
                    disabled
                    className="text-muted-foreground opacity-60 cursor-not-allowed transition-colors duration-150"
                  >
                    <Star className="h-4 w-4 mr-2" /> Add to Favorites
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={(e) => handleShareDeck(e, deck._id)}
                    className="transition-colors duration-150 hover:bg-accent"
                  >
                    <Share className="h-4 w-4 mr-2" /> Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Description */}
          <div className="mb-10 flex-grow">
            {deck.description && (
              <p className="text-sm text-foreground line-clamp-2">
                {deck.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="mt-auto">
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="font-semibold font-sora text-foreground">
                {deckLength} cards
              </span>
              <div className="flex items-center text-foreground text-xs">
                {getDisplayName()}
                {!isOwner && (
                  <span className="ml-2 text-muted-foreground">• Shared</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Deck Dialog - only show for owner */}
      {isOwner && (
        <EditDeckDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onEditSubmit={async (title, description, isPublic) => {
            if (deck._id) {
              await onEditClick?.(deck._id, title, description, isPublic);
            }
          }}
          initialTitle={editTitle}
          initialDescription={editDescription}
          initialIsPublic={editIsPublic}
        />
      )}
    </>
  );
};

export default DeckCard;
