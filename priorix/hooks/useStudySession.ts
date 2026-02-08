import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";

interface SessionMetrics {
  cardsReviewed: number;
  cardsAgain: number;
  cardsHard: number;
  cardsGood: number;
  cardsEasy: number;
  totalResponseTime: number;
  sessionStart: Date;
}

interface UseStudySessionProps {
  deckId: string;
  enabled?: boolean;
  studyMode?: "flashcards" | "srs" | "quiz";
}

export function useStudySession({ deckId, enabled = true, studyMode = "srs" }: UseStudySessionProps) {
  const { data: session } = useSession();
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    cardsReviewed: 0,
    cardsAgain: 0,
    cardsHard: 0,
    cardsGood: 0,
    cardsEasy: 0,
    totalResponseTime: 0,
    sessionStart: new Date(),
  });
  
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionQuality, setSessionQuality] = useState(0);
  const sessionStartedRef = useRef(false);

  // Start session automatically when enabled
  useEffect(() => {
    if (enabled && !sessionStartedRef.current) {
      startSession();
      sessionStartedRef.current = true;
    }
  }, [enabled]);

  const startSession = useCallback(() => {
    setSessionMetrics({
      cardsReviewed: 0,
      cardsAgain: 0,
      cardsHard: 0,
      cardsGood: 0,
      cardsEasy: 0,
      totalResponseTime: 0,
      sessionStart: new Date(),
    });
    setIsSessionActive(true);
  }, []);

  const recordCardReview = useCallback(
    (rating: "again" | "hard" | "good" | "easy", responseTime: number) => {
      setSessionMetrics((prev) => {
        const updated = {
          ...prev,
          cardsReviewed: prev.cardsReviewed + 1,
          cardsAgain: rating === "again" ? prev.cardsAgain + 1 : prev.cardsAgain,
          cardsHard: rating === "hard" ? prev.cardsHard + 1 : prev.cardsHard,
          cardsGood: rating === "good" ? prev.cardsGood + 1 : prev.cardsGood,
          cardsEasy: rating === "easy" ? prev.cardsEasy + 1 : prev.cardsEasy,
          totalResponseTime: prev.totalResponseTime + responseTime,
        };

        // Calculate session quality in real-time
        const totalReviewed = updated.cardsReviewed;
        if (totalReviewed > 0) {
          const successRate =
            ((updated.cardsGood + updated.cardsEasy) / totalReviewed) * 100;
          const avgResponseTime =
            updated.totalResponseTime / updated.cardsReviewed;

          // Quality score: 70% based on success rate, 30% on response time efficiency
          // Good response time benchmark: ~5 seconds
          const timeEfficiency = Math.max(
            0,
            Math.min(100, 100 - (avgResponseTime - 5000) / 100)
          );
          const quality = successRate * 0.7 + timeEfficiency * 0.3;

          setSessionQuality(Math.round(Math.max(0, Math.min(100, quality))));
        }

        return updated;
      });
    },
    []
  );

  const endSession = useCallback(
    async (wasCompleted: boolean = true, additionalData?: { quizScore?: number; quizType?: string }) => {
      if (!isSessionActive || !session?.user?.id) {
        return { success: false, error: "No active session" };
      }

      const sessionEnd = new Date();
      const timeOfDay = sessionEnd.getHours();
      const averageAccuracy =
        sessionMetrics.cardsReviewed > 0
          ? ((sessionMetrics.cardsGood + sessionMetrics.cardsEasy) /
              sessionMetrics.cardsReviewed) *
            100
          : 0;
      const averageResponseTime =
        sessionMetrics.cardsReviewed > 0
          ? sessionMetrics.totalResponseTime / sessionMetrics.cardsReviewed
          : 0;

      try {
        const response = await fetch("/api/study-session/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            deckId,
            sessionStart: sessionMetrics.sessionStart,
            sessionEnd,
            cardsReviewed: sessionMetrics.cardsReviewed,
            cardsAgain: sessionMetrics.cardsAgain,
            cardsHard: sessionMetrics.cardsHard,
            cardsGood: sessionMetrics.cardsGood,
            cardsEasy: sessionMetrics.cardsEasy,
            averageAccuracy,
            averageResponseTime,
            timeOfDay,
            sessionQuality,
            wasCompleted,
            studyMode,
            quizScore: additionalData?.quizScore,
            quizType: additionalData?.quizType,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save session");
        }

        setIsSessionActive(false);
        return { success: true };
      } catch (error) {
        console.error("Error saving study session:", error);
        return { success: false, error: "Failed to save session" };
      }
    },
    [
      isSessionActive,
      session,
      deckId,
      sessionMetrics,
      sessionQuality,
      studyMode,
    ]
  );

  // Auto-save session when user leaves page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isSessionActive && sessionMetrics.cardsReviewed > 0) {
        // Use sendBeacon for reliable session save on page unload
        const payload = JSON.stringify({
          userId: session?.user?.id,
          deckId,
          sessionStart: sessionMetrics.sessionStart,
          sessionEnd: new Date(),
          cardsReviewed: sessionMetrics.cardsReviewed,
          cardsAgain: sessionMetrics.cardsAgain,
          cardsHard: sessionMetrics.cardsHard,
          cardsGood: sessionMetrics.cardsGood,
          cardsEasy: sessionMetrics.cardsEasy,
          averageAccuracy:
            ((sessionMetrics.cardsGood + sessionMetrics.cardsEasy) /
              sessionMetrics.cardsReviewed) *
            100,
          averageResponseTime:
            sessionMetrics.totalResponseTime / sessionMetrics.cardsReviewed,
          timeOfDay: new Date().getHours(),
          sessionQuality,
          wasCompleted: false,
        });

        navigator.sendBeacon("/api/study-session/save", payload);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isSessionActive, sessionMetrics, session, deckId, sessionQuality]);

  const getSessionSummary = useCallback(() => {
    const accuracy =
      sessionMetrics.cardsReviewed > 0
        ? ((sessionMetrics.cardsGood + sessionMetrics.cardsEasy) /
            sessionMetrics.cardsReviewed) *
          100
        : 0;

    return {
      cardsReviewed: sessionMetrics.cardsReviewed,
      accuracy: Math.round(accuracy),
      sessionQuality,
      duration: Math.floor(
        (new Date().getTime() - sessionMetrics.sessionStart.getTime()) / 60000
      ),
    };
  }, [sessionMetrics, sessionQuality]);

  return {
    isSessionActive,
    sessionMetrics,
    sessionQuality,
    startSession,
    recordCardReview,
    endSession,
    getSessionSummary,
  };
}
