"use client";

import {
  Folder as FolderIcon,
  MoreVertical,
  Pencil,
  Trash2,
  Move,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Folder } from "@/types/deck";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, type FC } from "react";
import { motion } from "framer-motion";

interface FolderCardProps {
  folder?: Folder;
  label?: string;
  isActive?: boolean;
  onClick?: () => void;
  deckCount?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  isDropTarget?: boolean;
  onDrop?: () => void;
}

const FolderCard: FC<FolderCardProps> = ({
  folder,
  label,
  isActive = false,
  onClick,
  deckCount,
  onEdit,
  onDelete,
  isDropTarget = false,
  onDrop,
}) => {
  const displayName = label || folder?.name || "Untitled";
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isDropTarget) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (onDrop) {
      onDrop();
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative cursor-pointer transition-all rounded-t-md flex flex-col h-full",
          "hover:-translate-y-1 hover:shadow-lg",
          isActive && "ring-2 ring-blue-400/60 ring-offset-2",
          isDragOver && "ring-2 ring-yellow-400/80 ring-offset-2",
          isDropTarget && isDragOver && "bg-yellow-50/20",
        )}
      >
        {/* Folder tab */}
        <div
          className={cn(
            "relative z-10 w-32 h-6 ml-0 rounded-t-md flex items-center px-4",
            "bg-sky/75 border-2 border-b-0 border-border",
            isDragOver && "bg-mint",
            "-mb-[2px]"
          )}
          style={{ paddingBottom: "2px" }}
        >
        </div>

        <div
          className={cn(
            "px-4 py-10 relative z-0 flex flex-col flex-1 gap-3 bg-sky border-2 border-border overflow-hidden rounded-b-md rounded-tr-md rounded-tl-none shadow-none",
            "group-hover:shadow-[6px_6px_0px_0px_var(--border)] active:shadow-[0px_0px_0px_0px_var(--border)] transition-shadow duration-200",
            isDragOver &&
              "ring-4 ring-mint ring-offset-4 ring-offset-background bg-mint border-mint",
          )}
        >
          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-b-md rounded-tr-md">
              <div className="flex flex-col items-center gap-2">
                <Move className="h-8 w-8 animate-bounce text-white" />
                <p className="text-sm font-medium">Drop to move here</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 flex flex-col justify-between gap-2 z-10 px-2 pt-1 pb-2">
            <div className="flex flex-1 min-w-0 justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-xl line-clamp-1 text-foreground">
                  {displayName}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">
                  {deckCount !== undefined
                  ? `${deckCount} deck${deckCount === 1 ? "" : "s"}`
                  : "Folder"}
              </p>

              {/* Drop hint */}
              {isDropTarget && !isDragOver && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 5 }}
                  className="mt-3 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 inline-block px-2 py-1 rounded-md"
                >
                  Drag decks here
                </motion.div>
              )}
            </div>

            {/* Menu */}
            {folder && (onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-foreground/70 hover:text-foreground rounded-xl hover:bg-background/50 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                  className="border-2 border-border shadow-bento-sm rounded-xl"
                >
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit} className="font-medium cursor-pointer">
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                  )}

                  {onEdit && onDelete && <DropdownMenuSeparator className="bg-border/50" />}

                  {onDelete && (
                    <DropdownMenuItem
                      disabled={deckCount !== 0}
                      onClick={() => deckCount === 0 && onDelete()}
                      className={cn(
                        "font-medium cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50",
                        deckCount !== 0 && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
      </div>
    </motion.div>
  );
};

export default FolderCard;
