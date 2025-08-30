import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, CheckSquare, FileText } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "flashcard",
    title: "Completed Spanish Vocabulary Set",
    time: "2 hours ago",
    icon: BookOpen,
    badge: "Flashcards",
    badgeColor: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  },
  {
    id: 2,
    type: "todo",
    title: "Finished project presentation slides",
    time: "4 hours ago",
    icon: CheckSquare,
    badge: "Todo",
    badgeColor: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
  {
    id: 3,
    type: "note",
    title: "Added meeting notes from client call",
    time: "6 hours ago",
    icon: FileText,
    badge: "Notes",
    badgeColor: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  },
  {
    id: 4,
    type: "flashcard",
    title: "Reviewed JavaScript concepts",
    time: "1 day ago",
    icon: BookOpen,
    badge: "Flashcards",
    badgeColor: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  },
];

export default function RecentActivity() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <activity.icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground">
                {activity.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={activity.badgeColor}>
                  {activity.badge}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {activity.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
