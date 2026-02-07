"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";
import { motion } from "framer-motion";

const QuizPage = () => {
  const params = useParams();
  const deckId = params.deckId as string;
  const router = useRouter();

  const handleBackToDeck = () => {
    router.push(`/decks/${deckId}`);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 flex items-center justify-center bg-gradient-to-br from-background via-background to-yellow/10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 border-black dark:border-darkborder rounded-xl bg-yellow/20 dark:bg-card">
          <CardContent className="p-12 text-center space-y-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-yellow/30 dark:bg-yellow/20 flex items-center justify-center">
                <Construction className="h-12 w-12 text-foreground" />
              </div>
            </div>

            {/* Emoji */}
            <div className="text-8xl">📝</div>

            {/* Title */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold font-sora">
                Quiz Mode
              </h1>
              <p className="text-xl text-muted-foreground">
                Coming Soon
              </p>
            </div>

            {/* Description */}
            <div className="max-w-md mx-auto space-y-4">
              <p className="text-muted-foreground">
                We're working on an exciting quiz feature that will test your knowledge with multiple-choice questions, true/false, and more!
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="font-medium">In Development</span>
              </div>
            </div>

            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-sm font-semibold">Multiple Choice</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-2xl mb-2">⏱️</div>
                <p className="text-sm font-semibold">Timed Challenges</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-2xl mb-2">🏆</div>
                <p className="text-sm font-semibold">Score Tracking</p>
              </div>
            </div>

            {/* Back Button */}
            <div className="pt-4">
              <Button
                onClick={handleBackToDeck}
                className="gap-2 bg-pink text-primary border-2 border-primary hover:bg-pink/70"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Deck
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default QuizPage;
