import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, CheckSquare, FileText } from "lucide-react";

interface QuickActionsProps {
  onOpenAddDeckModal: () => void;
}

const quickActions = [
  {
    title: "New Flashcard Set",
    description: "Create a new set of flashcards",
    icon: BookOpen,
    color: "bg-pink",
    borderColor: "border-black dark:border-pink",
    hover:
      "hover:shadow-lg hover:-translate-y-0.5 hover:border-pink-300 dark:hover:border-pink",
  },
  {
    title: "Add Todo",
    description: "Add a new task to your list",
    icon: CheckSquare,
    color: "bg-green",
    borderColor: "border-black dark:border-green",
    hover:
      "hover:shadow-lg hover:-translate-y-0.5 hover:border-green dark:hover:green",
  },
  {
    title: "Create Note",
    description: "Start writing a new note",
    icon: FileText,
    color: "bg-yellow",
    borderColor: "border-black dark:border-yellow",
    hover:
      "hover:shadow-lg hover:-translate-y-0.5 hover:border-amber-300 dark:hover:border-yellow",
  },
];

export default function QuickActions({
  onOpenAddDeckModal,
}: QuickActionsProps) {
  const handleActionClick = (title: string) => {
    if (title === "New Flashcard Set") {
      onOpenAddDeckModal();
    }
    // Add handlers for other actions if needed
  };

  return (
    <Card className="bg-card border-2 border-black shadow-sm overflow-hidden h-full gap-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-card-foreground flex items-center gap-2 text-lg">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action) => (
          <Button
            key={action.title}
            variant="outline"
            className={`w-full justify-between h-auto p-2 rounded-lg transition-all duration-200 border-2 ${action.color} ${action.borderColor} ${action.hover} group`}
            onClick={() => handleActionClick(action.title)}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-md text-primary bg-white/50 dark:bg-black/20 group-hover:scale-110 transition-transform duration-200`}
              >
                <action.icon className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-muted-foreground">
                  {action.description}
                </div>
              </div>
            </div>
            <div
              className={`p-1 rounded-full text-primary bg-white/70 dark:bg-black/20 group-hover:scale-110 transition-transform duration-200`}
            >
              <Plus className="h-3 w-3" />
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
