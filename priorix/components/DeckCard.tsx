"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Deck } from "@/types/deck";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import EditDeckDialog from "./Deck/EditDeckDialog";
import { useSession } from "next-auth/react";

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
}

const colors = ["bg-pink", "bg-green", "bg-yellow", "bg-purple"];

const DeckCard: React.FC<DeckCardProps> = ({
  deck,
  className,
  onDeleteClick,
  onEditClick,
  index = 0,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

  if (!deck) return null;

  const deckLength =
    deck.length ?? (deck.flashcards ? deck.flashcards.length : 0);

  const handleDeckClick = async (deckId: string) => {
  
    if (typeof window !== "undefined") {
      sessionStorage.setItem("fromDashboardRecent", "true");
      sessionStorage.setItem("lastDashboardPath", window.location.pathname);
    }

    if (session?.user?.id) {
      await recordDeckAccess(deckId, session.user.id);
    }
    router.push(`/decks/${deckId}`);
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
          } shadow-md border-2 border-primary cursor-pointer hover:shadow-lg`,
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mt-1 -mr-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTitle(deck.title);
                    setEditDescription(deck.description || "");
                    setEditIsPublic(deck.isPublic || true);
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
              </DropdownMenuContent>
            </DropdownMenu>
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Deck Dialog */}
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
    </>
  );
};

export default DeckCard;
