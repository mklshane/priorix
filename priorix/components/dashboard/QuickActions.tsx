"use client";

import { Plus, BookOpen, CheckSquare, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuickActions({
  onOpenAddDeckModal,
}: {
  onOpenAddDeckModal: () => void;
}) {
  const router = useRouter();

  const actions = [
    {
      title: "New Flashcard Set",
      icon: BookOpen,
      color: "bg-blush",
      enabled: true,
      onClick: onOpenAddDeckModal,
    },
    { 
      title: "Add Todo", 
      icon: CheckSquare, 
      color: "bg-mint", 
      enabled: true,
      onClick: () => router.push("/todo?add=true"),
    },
    {
      title: "Create Note",
      icon: FileText,
      color: "bg-citrus",
      enabled: true,
      onClick: () => router.push("/notes?add=true"),
    },
  ];

  return (
    <div className="bento-card bg-card flex flex-col p-6">
      <h2 className="text-2xl font-editorial italic mb-5 text-foreground">
        Quick Actions
      </h2>
      <div className="flex flex-col gap-3">
        {actions.map((action) => (
          <button
            key={action.title}
            disabled={!action.enabled}
            onClick={action.onClick}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 border-border transition-all text-left ${action.enabled ? `${action.color} hover:-translate-y-1 hover:shadow-bento-sm` : "bg-muted/50 border-dashed opacity-60 cursor-not-allowed grayscale"}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-background border-2 border-border shadow-sm">
                <action.icon className="h-4 w-4" />
              </div>
              <div className="font-bold text-sm">{action.title}</div>
            </div>
            {action.enabled && (
              <div className="p-1 rounded-full bg-background border-2 border-border">
                <Plus className="h-3 w-3" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
