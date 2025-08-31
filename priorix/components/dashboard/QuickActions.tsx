import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, CheckSquare, FileText, Zap } from "lucide-react";

const quickActions = [
  {
    title: "New Flashcard Set",
    description: "Create a new set of flashcards",
    icon: BookOpen,
    color:
      "bg-pink ",
    iconColor: "text-pink-500 dark:text-pink",
    borderColor: "border-black dark:border-pink",
    hover:
      "hover:shadow-lg hover:-translate-y-0.5 hover:border-pink-300 dark:hover:border-pink",
  },
  {
    title: "Add Todo",
    description: "Add a new task to your list",
    icon: CheckSquare,
    color:
      "bg-green ",
    iconColor: "text-perry dark:text-blue",
    borderColor: "border-black dark:border-blue",
    hover:
      "hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue",
  },
  {
    title: "Create Note",
    description: "Start writing a new note",
    icon: FileText,
    color:
      "bg-yellow ",
    iconColor: "text-amber-500 dark:text-yellow",
    borderColor: "border-black dark:border-yellow",
    hover:
      "hover:shadow-lg hover:-translate-y-0.5 hover:border-amber-300 dark:hover:border-yellow",
  },
];

export default function QuickActions() {
  return (
    <Card className="bg-card border-2 border-black shadow-sm overflow-hidden gap-0">
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
            className={`w-full justify-between h-auto p-4 rounded-lg transition-all duration-200 border-2 ${action.color} ${action.borderColor} ${action.hover} group`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-md ${action.iconColor} bg-white/50 dark:bg-black/20 group-hover:scale-110 transition-transform duration-200`}
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
              className={`p-1 rounded-full ${action.iconColor} bg-white/70 dark:bg-black/20 group-hover:scale-110 transition-transform duration-200`}
            >
              <Plus className="h-3 w-3" />
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
