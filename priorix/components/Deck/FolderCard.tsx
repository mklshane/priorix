"use client";

import {
  Folder as FolderIcon,
  MoreVertical,
  Pencil,
  Trash2,
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

interface FolderCardProps {
  folder?: Folder;
  label?: string;
  isActive?: boolean;
  onClick?: () => void;
  deckCount?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  label,
  isActive = false,
  onClick,
  deckCount,
  onEdit,
  onDelete,
}) => {
  const displayName = label || folder?.name || "Untitled";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer transition-all rounded-t-md flex flex-col h-full",
        "hover:-translate-y-1 hover:shadow-lg",
        isActive && "ring-2 ring-blue-400/60",
      )}
    >
      {/* Folder tab */}
      <div
        className={cn(
          "relative z-10 h-7 w-28 rounded-t-md",
          "bg-blue-500/80 border border-b-0 border-blue-600/60",
          "flex items-center px-3 text-xs font-medium text-white",
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
          "p-4 flex gap-3 min-h-[180px] text-white",
        )}
      >
        {/* Content */}
        <div className="flex flex-1 min-w-0 justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-lg line-clamp-1">{displayName}</p>
            <p className="text-xs text-blue-100">
              {deckCount !== undefined
                ? `${deckCount} deck${deckCount === 1 ? "" : "s"}`
                : "Folder"}
            </p>
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
  );
};

export default FolderCard;
