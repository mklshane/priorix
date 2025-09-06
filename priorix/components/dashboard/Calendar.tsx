import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

export default function Calendar() {
  // Simple calendar display for now
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dates = Array.from({ length: 31 }, (_, i) => i + 1);
  const today = new Date().getDate();

  return (
    <Card className="bg-green/60 border-2 border-black shadow-sm h-full gap-0 dark:bg-darkcard dark:border-darkborder">
      <CardHeader className="pb-3">
        <CardTitle className="text-card-foreground flex items-center gap-2 text-lg">
          <CalendarIcon className="h-5 w-5" />
          Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((day) => (
            <div
              key={day}
              className="text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
          {dates.map((date) => (
            <div
              key={date}
              className={`p-1 rounded-full text-sm ${
                date === today
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-card-foreground"
              }`}
            >
              {date}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
