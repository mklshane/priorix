"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Folder as FolderIcon, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden border-2 transition-all cursor-pointer",
        "bg-card/80",
        "hover:shadow-lg hover:-translate-y-[3px]",
        isActive ? "border-primary/70 shadow-primary/10 shadow-lg" : "border-border/70"
      )}
    >
      {/* Folder tab */}
      <div className="absolute left-0 top-0 h-4 w-16 rounded-br-lg bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
      <div className="absolute left-0 top-0 h-3 w-10 translate-y-[-6px] rounded-t-md bg-primary/30" />

      <CardContent className="p-4 flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/15 text-primary flex items-center justify-center shadow-inner border border-primary/20">
          <FolderIcon className="h-6 w-6" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-foreground line-clamp-1">
                {displayName}
              </span>
              <span className="text-xs text-muted-foreground block">
                {deckCount !== undefined ? `${deckCount} deck${deckCount === 1 ? "" : "s"}` : "Folder"}
              </span>
            </div>
            {folder && (onEdit || onDelete) && (
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
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="h-4 w-4 mr-2" /> Rename
                    </DropdownMenuItem>
                  )}
                  {onEdit && onDelete && <DropdownMenuSeparator />}
                  {onDelete && (
                    <DropdownMenuItem
                      disabled={deckCount !== 0}
                      onClick={() => {
                        if (deckCount === 0) onDelete();
                      }}
                      className={cn(deckCount !== 0 && "opacity-60 cursor-not-allowed")}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FolderCard;
