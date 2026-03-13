"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      color: "bg-sky",
      icon: BookOpen,
      disabled: false,
    },
    {
      id: "srs" as StudyMode,
      title: "Spaced Repetition",
      emoji: "🧠",
      description: "Optimized for long-term retention",
      color: "bg-mint",
      icon: Brain,
      disabled: false,
    },
    {
      id: "quiz" as StudyMode,
      title: "Quiz Mode",
      emoji: "📝",
      description: "MCQ & True/False questions",
      color: "bg-blush",
      icon: FileText,
      disabled: false,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-2 border-border shadow-bento !rounded-[2rem] bg-card max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-2 border-b-2 border-border bg-lilac/30 px-6 py-8">
          <DialogTitle className="text-3xl md:text-5xl font-editorial text-center text-foreground">
            Choose Your Study Mode
          </DialogTitle>
          <DialogDescription className="text-center font-medium text-sm md:text-base text-foreground/70">
            Pick the best way to master your flashcards
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-6">
          {modes.map((mode) => {
            const isClickable = !mode.disabled && hasCards;

            return (
              <div
                key={mode.id}
                className={`relative border-2 border-border rounded-3xl overflow-hidden transition-all duration-300 ${mode.color} ${
                  mode.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : isClickable
                    ? "cursor-pointer hover:shadow-bento-sm hover:-translate-y-2"
                    : "cursor-not-allowed opacity-80 grayscale"
                }`}
                onClick={() => isClickable && onSelectMode(mode.id)}
              >
                <div className="p-6 md:p-8 flex flex-col items-center text-center h-full min-h-[220px] md:min-h-[300px] justify-between">
                  {/* Top section */}
                  <div className="w-full flex-1 flex flex-col items-center justify-center space-y-4">
                    {mode.disabled && (
                      <div className="absolute top-4 right-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border-2 border-border text-[10px] font-bold uppercase tracking-widest">
                          <Lock className="h-3 w-3" />
                          Coming Soon
                        </div>
                      </div>
                    )}

                    {/* Emoji */}
                    <div className="text-6xl md:text-8xl mb-2 filter drop-shadow-sm">{mode.emoji}</div>
                    
                    {/* Title */}
                    <h3 className="text-xl md:text-2xl font-bold text-foreground">
                      {mode.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm font-medium text-foreground/80 leading-snug">
                      {mode.description}
                    </p>
                  </div>

                  {/* Bottom section */}
                  <div className="w-full mt-6 flex justify-center">
                    {!mode.disabled && hasCards ? (
                      <div className="inline-block border-2 border-foreground/10 bg-foreground/5 rounded-full px-4 py-2 text-[10px] md:text-xs font-bold text-foreground uppercase tracking-widest">
                        Click to Start
                      </div>
                    ) : (
                      <div className="inline-block border-2 border-foreground/10 bg-foreground/5 rounded-full px-4 py-2 text-[10px] md:text-xs font-bold text-foreground/60 uppercase tracking-widest">
                        Add cards first
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!hasCards && (
          <div className="text-center px-6 pb-6">
            <p className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border-2 border-border text-xs md:text-sm font-bold text-muted-foreground">
              💡 Add some flashcards to this deck before studying
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudyModeModal;
