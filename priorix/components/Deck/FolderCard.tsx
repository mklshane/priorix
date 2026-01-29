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
            "relative z-10 h-7 w-28 rounded-t-md",
            "bg-blue-500/80 border border-b-0 border-blue-600/60",
            "flex items-center px-3 text-xs font-medium text-white",
            isDragOver && "bg-yellow-500/80 border-yellow-600/60",
          )}
        >
          <FolderIcon className="h-3.5 w-3.5 mr-1.5 text-white" />
          Folder
        </div>

        {/* Folder body */}
        <div
          className={cn(
            "relative -mt-[1px] rounded-b-md rounded-tr-md",
            "border border-blue-600/60",
            "bg-gradient-to-b from-blue-400/80 to-blue-500/90",
            "p-4 flex gap-3 min-h-[170px] md:min-h-[130px] text-white",
            isDragOver &&
              "border-yellow-600/60 bg-gradient-to-b from-yellow-400/80 to-yellow-500/90",
          )}
        >
          {/* Drop indicator overlay */}
          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-b-md rounded-tr-md">
              <div className="flex flex-col items-center gap-2">
                <Move className="h-8 w-8 animate-bounce text-white" />
                <p className="text-sm font-medium">Drop to move here</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex flex-1 min-w-0 justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-lg line-clamp-1">
                {displayName}
              </p>
              <p className="text-xs text-blue-100">
                {deckCount !== undefined
                  ? `${deckCount} deck${deckCount === 1 ? "" : "s"}`
                  : "Folder"}
              </p>

              {/* Drop hint */}
              {isDropTarget && !isDragOver && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 5 }}
                  className="mt-3 text-xs text-blue-100/80 border-t border-blue-300/30 pt-2"
                >
                  Drag decks here to move
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
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                  )}

                  {onEdit && onDelete && <DropdownMenuSeparator />}

                  {onDelete && (
                    <DropdownMenuItem
                      disabled={deckCount !== 0}
                      onClick={() => deckCount === 0 && onDelete()}
                      className={cn(
                        deckCount !== 0 && "opacity-60 cursor-not-allowed",
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

      {/* Drag overlay effect */}
      {isDragOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -inset-2 bg-yellow-400/10 rounded-lg -z-10"
        />
      )}
    </motion.div>
  );
};

export default FolderCard;
