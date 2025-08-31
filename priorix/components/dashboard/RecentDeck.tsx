"use client";

import DeckCard from "@/components/DeckCard";

// Mock data for recent decks
const recentDecks = [
  {
    id: 1,
    title: "Algorithms",
    totalCards: 50,
    studied: 24,
    lastStudied: "2h ago",
    color: "bg-pink",
    textColor: "text-foreground",
  },
  {
    id: 2,
    title: "Data Structures",
    totalCards: 42,
    studied: 35,
    lastStudied: "1d ago",
    color: "bg-yellow",
    textColor: "text-foreground",
  },
  {
    id: 3,
    title: "Programming",
    totalCards: 30,
    studied: 8,
    lastStudied: "3d ago",
    color: "bg-green",
    textColor: "text-foreground",
  },
  {
    id: 4,
    title: "Calculus",
    totalCards: 60,
    studied: 45,
    lastStudied: "5h ago",
    color: "bg-purple",
    textColor: "text-foreground",
  },
];

export default function RecentDecks() {
  const handleStudyClick = (deckId: number) => {
    console.log(`Studying deck ${deckId}`);
    // Add your study logic here
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
      {recentDecks.map((deck) => (
        <DeckCard key={deck.id} {...deck} onStudyClick={handleStudyClick} />
      ))}
    </div>
  );
}
