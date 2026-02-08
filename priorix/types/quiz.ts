export type QuizType = "mcq" | "true-false";

export interface QuizQuestion {
  cardId: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  type: QuizType;
  explanation?: string;
}

export interface QuizAnswer {
  cardId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  responseTime: number;
  type: QuizType;
}

export interface QuizConfig {
  questionCount: number;
  quizTypes: QuizType[];
}

export interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: QuizAnswer[];
  startTime: number;
  config: QuizConfig;
}

export interface QuizResult {
  score: number;
  correctCount: number;
  incorrectCount: number;
  totalTime: number;
  averageResponseTime: number;
  answers: QuizAnswer[];
}
