import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const prevMonthDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    prevMonthDays.push(daysInPrevMonth - i);
  }
  prevMonthDays.reverse();

  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const totalDaysDisplayed = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDays = Array.from(
    { length: 42 - totalDaysDisplayed },
    (_, i) => i + 1
  );

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <Card className="bg-green/60 border-2 border-black shadow-sm h-full gap-0 dark:bg-darkcard dark:border-darkborder">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground flex items-center gap-2 text-lg">
            <CalendarIcon className="h-5 w-5" />
            Calendar
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs h-8"
          >
            Today
          </Button>
        </div>

        {/* Month/Year navigation */}
        <div className="flex items-center justify-between mt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-lg font-semibold">
            {monthNames[currentMonth]} {currentYear}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Day headers */}
          {days.map((day) => (
            <div
              key={day}
              className="text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}

          {/* Previous month days */}
          {prevMonthDays.map((day) => (
            <div
              key={`prev-${day}`}
              className="p-1 rounded-full text-sm text-muted-foreground opacity-50"
            >
              {day}
            </div>
          ))}

          {/* Current month days */}
          {currentMonthDays.map((day) => {
            const isToday =
              day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();

            return (
              <div
                key={`current-${day}`}
                className={`p-1 rounded-full text-sm flex items-center justify-center h-8 w-8 mx-auto ${
                  isToday
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-card-foreground"
                }`}
              >
                {day}
              </div>
            );
          })}

          {/* Next month days */}
          {nextMonthDays.map((day) => (
            <div
              key={`next-${day}`}
              className="p-1 rounded-full text-sm text-muted-foreground opacity-50"
            >
              {day}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
