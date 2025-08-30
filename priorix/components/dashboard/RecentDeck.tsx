"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock data for recent decks
const recentDecks = [
  {
    id: 1,
    title: "Algorithms",
    course: "CMSC 110",
    totalCards: 50,
    studied: 24,
    lastStudied: "2h ago",
    color: "bg-course-blue",
    textColor: "text-white",
  },
  {
    id: 2,
    title: "Data Structures",
    course: "CMSC 124",
    totalCards: 42,
    studied: 35,
    lastStudied: "1d ago",
    color: "bg-course-yellow",
    textColor: "text-foreground",
  },
  {
    id: 3,
    title: "Programming",
    course: "CMSC 128",
    totalCards: 30,
    studied: 8,
    lastStudied: "3d ago",
    color: "bg-course-pink",
    textColor: "text-white",
  },
  {
    id: 4,
    title: "Calculus",
    course: "CMSC 142",
    totalCards: 60,
    studied: 45,
    lastStudied: "5h ago",
    color: "bg-course-green",
    textColor: "text-white",
  },
];

export default function RecentDecks() {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      {recentDecks.map((deck) => (
        <Card
          key={deck.id}
          className={`border-0 overflow-hidden ${deck.color} shadow-md`}
        >
          <CardContent className="p-4 flex flex-col h-full">
            {/* Course badge */}
            <div className="mb-3">
              <span
                className={`inline-block px-2 py-1 rounded-md text-xs font-medium bg-black/10 ${deck.textColor}`}
              >
                {deck.course}
              </span>
            </div>

            {/* Icon and title */}
            <div className="mb-4 flex-grow">
              <div className="flex items-center mb-2">
                <div className="p-2 rounded-lg bg-white/20 mr-2">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold line-clamp-2">
                  {deck.title}
                </h3>
              </div>
            </div>

            {/* Stats and action */}
            <div className="mt-auto">
              <div className="flex justify-between items-center text-sm mb-3">
                <span className="font-semibold">
                  {deck.studied}/{deck.totalCards} cards
                </span>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {deck.lastStudied}
                </div>
              </div>

              <Button className="w-full bg-white hover:bg-gray-100 text-foreground border border-white/20">
                Study Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
