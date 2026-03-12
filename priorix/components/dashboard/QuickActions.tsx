"use client";

import { Plus, BookOpen, CheckSquare, FileText } from "lucide-react";

interface QuickActionsProps {
  onOpenAddDeckModal: () => void;
}

// Mapped original colors to our new variables
const quickActions = [
  {
    title: "New Flashcard Set",
    description: "Create a new set of flashcards",
    icon: BookOpen,
    color: "bg-blush",
    enabled: true,
  },
  {
    title: "Add Todo",
    description: "Add a new task to your list",
    icon: CheckSquare,
    color: "bg-mint",
    enabled: false,
  },
  {
    title: "Create Note",
    description: "Start writing a new note",
    icon: FileText,
    color: "bg-citrus",
    enabled: false,
  },
];

export default function QuickActions({
  onOpenAddDeckModal,
}: QuickActionsProps) {
  const handleActionClick = (title: string, enabled: boolean) => {
    if (!enabled) return;
    if (title === "New Flashcard Set") {
      onOpenAddDeckModal();
    }
  };

  return (
    <div className="bento-card bg-card h-full flex flex-col p-6">
      <h2 className="text-2xl font-editorial italic mb-4 text-foreground">
        Quick Actions
      </h2>
      <div className="flex flex-col gap-3 flex-1 justify-center">
        {quickActions.map((action) => (
          <button
            key={action.title}
            disabled={!action.enabled}
            onClick={() => handleActionClick(action.title, action.enabled)}
            className={`
              w-full flex items-center justify-between p-3 rounded-2xl border-2 border-border transition-all duration-200 text-left
              ${
                action.enabled
                  ? `${action.color} hover:-translate-y-1 hover:shadow-bento-sm cursor-pointer`
                  : "bg-muted/50 border-dashed opacity-60 cursor-not-allowed grayscale"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-background border-2 border-border shadow-sm shrink-0">
                <action.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="font-bold text-sm">{action.title}</div>
                <div className="text-xs font-medium text-foreground/70">
                  {action.description}
                </div>
              </div>
            </div>
            {action.enabled && (
              <div className="p-1 rounded-full bg-background border-2 border-border shrink-0">
                <Plus className="h-3 w-3" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
