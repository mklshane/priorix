"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Brain, FileText, Lock } from "lucide-react";

type StudyMode = "flashcards" | "srs" | "quiz";

interface StudyModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: StudyMode) => void;
  hasCards: boolean;
}

const StudyModeModal = ({ isOpen, onClose, onSelectMode, hasCards }: StudyModeModalProps) => {
  const modes = [
    {
      id: "flashcards" as StudyMode,
      title: "Flashcards",
      emoji: "🎴",
      description: "Classic flip and review",
      color: "bg-blue dark:bg-blue/40",
      borderColor: "border-black dark:border-darkborder",
      hoverScale: true,
      icon: BookOpen,
      disabled: false,
    },
    {
      id: "srs" as StudyMode,
      title: "Spaced Repetition",
      emoji: "🧠",
      description: "Optimized for long-term retention",
      color: "bg-green dark:bg-green/40",
      borderColor: "border-black dark:border-darkborder",
      hoverScale: true,
      icon: Brain,
      disabled: false,
    },
    {
      id: "quiz" as StudyMode,
      title: "Quiz Mode",
      emoji: "📝",
      description: "Test your knowledge",
      color: "bg-yellow/50 dark:bg-yellow/20",
      borderColor: "border-black/30 dark:border-darkborder/30",
      hoverScale: false,
      icon: FileText,
      disabled: true,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl border-2 border-black dark:border-darkborder rounded-xl bg-white dark:bg-card">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl md:text-3xl font-bold font-sora text-center">
            Choose Your Study Mode
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Pick the best way to master your flashcards
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 py-6">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isClickable = !mode.disabled && hasCards;

            return (
              <Card
                key={mode.id}
                className={`relative border-2 ${mode.borderColor} rounded-xl overflow-hidden transition-all duration-200 ${mode.color} ${
                  mode.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : isClickable
                    ? `cursor-pointer hover:shadow-xl ${mode.hoverScale ? "hover:scale-102" : ""} hover:border-black dark:hover:border-white`
                    : "cursor-not-allowed"
                }`}
                onClick={() => isClickable && onSelectMode(mode.id)}
              >
                <CardContent className="p-6 flex flex-col items-center text-center h-full min-h-[250px] justify-between">
                  {/* Top section */}
                  <div className="w-full space-y-2">
                    {mode.disabled && (
                      <div className="flex justify-end mb-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border-2 border-black dark:border-darkborder text-xs font-bold">
                          <Lock className="h-3 w-3" />
                          COMING SOON
                        </div>
                      </div>
                    )}

                    {/* Emoji */}
                    <div className="text-7xl mb-2">{mode.emoji}</div>

                    {/* Title */}
                    <h3 className="text-xl font-bold font-sora text-foreground">
                      {mode.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-foreground/70 font-medium">
                      {mode.description}
                    </p>
                  </div>

                  {/* Bottom section */}
                  <div className="w-full mt-6">
                    

                    {/* Action hint */}
                    {!mode.disabled && hasCards && (
                      <div className="text-xs font-bold text-foreground/80 mt-3 uppercase tracking-wide">
                        Click to Start
                      </div>
                    )}

                    {!hasCards && !mode.disabled && (
                      <div className="text-xs text-muted-foreground mt-3">
                        Add cards first
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!hasCards && (
          <div className="text-center pb-2">
            <p className="text-sm text-muted-foreground">
              💡 Add some flashcards to this deck before studying
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudyModeModal;
