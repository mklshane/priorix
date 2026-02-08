"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, X, Clock, Trophy, RotateCcw } from "lucide-react";

import LoadingState from "@/components/DeckDetails/LoadingState";
import QuizConfigModal from "@/components/DeckDetails/QuizConfigModal";
import QuizResultsModal from "@/components/DeckDetails/QuizResultsModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDeck } from "@/hooks/useDeck";
import { useToast } from "@/hooks/useToast";
import { useStudySession } from "@/hooks/useStudySession";
import { QuizQuestion, QuizAnswer, QuizType } from "@/types/quiz";
import { cn } from "@/lib/utils";

const QuizPage = () => {
  const params = useParams();
  const deckId = params.deckId as string;
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const { deck, isLoading: isDeckLoading } = useDeck(deckId);

  // Quiz state
  const [showConfigModal, setShowConfigModal] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [quizConfig, setQuizConfig] = useState<{ questionCount: number; quizTypes: QuizType[] } | null>(null);

  // Session tracking
  const { recordCardReview, endSession, sessionQuality } = useStudySession({
    deckId,
    enabled: !showConfigModal && questions.length > 0,
    studyMode: "quiz",
  });

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // Generate questions
  const handleStartQuiz = async (config: { questionCount: number; quizTypes: QuizType[] }) => {
    try {
      setIsLoadingQuestions(true);
      setQuizConfig(config); // Store config for retaking
      
      const response = await fetch("/api/quiz/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckId,
          questionCount: config.questionCount,
          quizTypes: config.quizTypes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate questions");
      }

      const data = await response.json();
      setQuestions(data.questions);
      setQuestionStartTime(Date.now());
      setShowConfigModal(false);
    } catch (error) {
      console.error("Error generating questions:", error);
      showToast("Failed to generate quiz questions", "error");
      router.push(`/decks/${deckId}`);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Handle answer selection
  const handleSelectAnswer = (answer: string) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
  };

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion || showFeedback) return;

    setIsSubmitting(true);
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const responseTime = Date.now() - questionStartTime;

    // Record answer
    const answer: QuizAnswer = {
      cardId: currentQuestion.cardId,
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      responseTime,
      type: currentQuestion.type,
    };

    setAnswers((prev) => [...prev, answer]);
    setShowFeedback(true);

    // Record in session tracker (correct = "good", incorrect = "again")
    const rating = isCorrect ? "good" : "again";
    recordCardReview(rating, responseTime);

    // Update flashcard review via API
    try {
      await fetch("/api/flashcard/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: currentQuestion.cardId,
          rating,
          responseTimeMs: responseTime,
          userId: session?.user?.id,
        }),
      });
    } catch (error) {
      console.error("Error recording review:", error);
    }

    setIsSubmitting(false);
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (isLastQuestion) {
      handleFinishQuiz();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setQuestionStartTime(Date.now());
    }
  };

  // Finish quiz
  const handleFinishQuiz = async () => {
    try {
      const correctCount = answers.filter((a) => a.isCorrect).length;
      const quizScore = Math.round((correctCount / answers.length) * 100);
      const quizTypes = [...new Set(answers.map((a) => a.type))];
      const quizType = quizTypes.length > 1 ? "mixed" : quizTypes[0];

      await endSession(true, { quizScore, quizType });
      setShowResults(true);
    } catch (error) {
      console.error("Error ending session:", error);
      showToast("Failed to save quiz results", "error");
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showConfigModal || showResults || !currentQuestion) return;

      // Option selection: 1-4 for MCQ, T/F for True/False
      if (currentQuestion.type === "mcq" && !showFeedback) {
        const numKey = parseInt(e.key);
        if (numKey >= 1 && numKey <= currentQuestion.options.length) {
          handleSelectAnswer(currentQuestion.options[numKey - 1]);
        }
      } else if (currentQuestion.type === "true-false" && !showFeedback) {
        if (e.key.toLowerCase() === "t") {
          handleSelectAnswer("True");
        } else if (e.key.toLowerCase() === "f") {
          handleSelectAnswer("False");
        }
      }

      // Submit: Enter
      if (e.key === "Enter" && selectedAnswer && !showFeedback) {
        handleSubmitAnswer();
      }

      // Next: Space or Enter (after feedback)
      if ((e.key === " " || e.key === "Enter") && showFeedback) {
        e.preventDefault();
        handleNextQuestion();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentQuestion, selectedAnswer, showFeedback, showConfigModal, showResults]);

  if (isDeckLoading || isLoadingQuestions) {
    return <LoadingState message={isLoadingQuestions ? "Generating questions..." : "Loading deck..."} />;
  }

  if (!deck) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Deck not found</p>
      </div>
    );
  }

  const totalCards = Array.isArray(deck.flashcards) ? deck.flashcards.length : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Config Modal */}
      <QuizConfigModal
        isOpen={showConfigModal}
        onClose={() => !isLoadingQuestions && router.push(`/decks/${deckId}`)}
        onStartQuiz={handleStartQuiz}
        totalCards={totalCards}
        deckId={deckId}
        isLoading={isLoadingQuestions}
      />

      {/* Results Modal */}
      {showResults && (
        <QuizResultsModal
          isOpen={showResults}
          onClose={() => router.push(`/decks/${deckId}`)}
          answers={answers}
          questions={questions}
          sessionQuality={sessionQuality}
          deckId={deckId}
          quizConfig={quizConfig}
          onQuizAgain={quizConfig ? () => {
            setShowResults(false);
            setAnswers([]);
            setCurrentIndex(0);
            setSelectedAnswer(null);
            setShowFeedback(false);
            handleStartQuiz(quizConfig);
          } : undefined}
        />
      )}

      {/* Quiz Interface */}
      {!showConfigModal && !showResults && questions.length > 0 && (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.push(`/decks/${deckId}`)}
              className="mb-4 border-2 border-black dark:border-darkborder"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Exit Quiz
            </Button>

            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold font-sora">{deck.title}</h1>
              <div className="text-sm font-semibold">
                Question {currentIndex + 1} / {questions.length}
              </div>
            </div>

            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2 border-black dark:border-darkborder mb-6">
                <CardContent className="p-8">
                  {/* Question Type Badge */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-yellow/20 border-2 border-black dark:border-darkborder">
                      {currentQuestion.type === "mcq" ? "Multiple Choice" : "True or False"}
                    </span>
                  </div>

                  {/* Question Text */}
                  <h2 className="text-2xl font-bold mb-6">{currentQuestion.questionText}</h2>

                  {/* Options */}
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedAnswer === option;
                      const isCorrect = option === currentQuestion.correctAnswer;
                      const showCorrect = showFeedback && isCorrect;
                      const showIncorrect = showFeedback && isSelected && !isCorrect;

                      return (
                        <button
                          key={index}
                          onClick={() => handleSelectAnswer(option)}
                          disabled={showFeedback}
                          className={cn(
                            "w-full p-4 text-left rounded-lg border-2 transition-all font-medium",
                            "hover:scale-102 active:scale-98",
                            !showFeedback && !isSelected &&
                              "border-gray-300 dark:border-darkborder bg-white dark:bg-card hover:border-black dark:hover:border-white",
                            !showFeedback && isSelected &&
                              "border-black dark:border-white bg-yellow/20 dark:bg-yellow/10",
                            showCorrect &&
                              "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100",
                            showIncorrect &&
                              "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100",
                            showFeedback && "cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-3">
                              <span className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-bold">
                                {currentQuestion.type === "mcq" ? index + 1 : option[0]}
                              </span>
                              <span>{option}</span>
                            </span>
                            {showCorrect && <Check className="h-5 w-5" />}
                            {showIncorrect && <X className="h-5 w-5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback */}
                  {showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "mt-6 p-4 rounded-lg border-2",
                        selectedAnswer === currentQuestion.correctAnswer
                          ? "bg-green-50 dark:bg-green-950/30 border-green-500"
                          : "bg-red-50 dark:bg-red-950/30 border-red-500"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {selectedAnswer === currentQuestion.correctAnswer ? (
                          <>
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="font-bold text-green-900 dark:text-green-100">Correct!</span>
                          </>
                        ) : (
                          <>
                            <X className="h-5 w-5 text-red-600" />
                            <span className="font-bold text-red-900 dark:text-red-100">Incorrect</span>
                          </>
                        )}
                      </div>
                      {currentQuestion.explanation && (
                        <p className="text-sm">{currentQuestion.explanation}</p>
                      )}
                    </motion.div>
                  )}

                  {/* Action Button */}
                  <div className="mt-6">
                    {!showFeedback ? (
                      <Button
                        onClick={handleSubmitAnswer}
                        disabled={!selectedAnswer || isSubmitting}
                        className="w-full bg-yellow hover:bg-yellow/90 text-black font-bold border-2 border-black dark:border-darkborder"
                      >
                        Submit Answer
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNextQuestion}
                        className="w-full bg-yellow hover:bg-yellow/90 text-black font-bold border-2 border-black dark:border-darkborder"
                      >
                        {isLastQuestion ? (
                          <>
                            <Trophy className="h-4 w-4 mr-2" />
                            Finish Quiz
                          </>
                        ) : (
                          <>
                            Next Question
                            <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Keyboard Hints */}
                  <div className="mt-4 text-xs text-muted-foreground text-center space-x-4">
                    {!showFeedback && (
                      <>
                        <span>
                          {currentQuestion.type === "mcq" ? "Press 1-4" : "Press T/F"} to select
                        </span>
                        <span>•</span>
                      </>
                    )}
                    <span>Press Enter to {showFeedback ? "continue" : "submit"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-2 border-black dark:border-darkborder">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{answers.filter((a) => a.isCorrect).length}</div>
                    <div className="text-sm text-muted-foreground">Correct</div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-black dark:border-darkborder">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{answers.filter((a) => !a.isCorrect).length}</div>
                    <div className="text-sm text-muted-foreground">Incorrect</div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-black dark:border-darkborder">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{sessionQuality}%</div>
                    <div className="text-sm text-muted-foreground">Quality</div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
