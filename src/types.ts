export type QuestionType = 'single_choice' | 'multiple_select' | 'short_answer';

export interface QuestionOption {
  id: string;
  label: string;
  text: string;
}

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  topic: string;
  points: number;
  prompt: string;
  codeSnippet?: string;
  options?: QuestionOption[];
  correctOptionIds?: string[]; // used for single_choice and multiple_select
  correctTextAnswer?: string; // used for short_answer / numerical
  acceptableUnits?: string;
  explanation: string;
}

export type DisciplineCategory =
  | 'Computer Science'
  | 'Distributed Systems'
  | 'Applied Mathematics'
  | 'Data Science';

export interface Exam {
  id: string;
  courseCode: string;
  title: string;
  discipline: DisciplineCategory;
  instructor: string;
  durationMinutes: number;
  passingPercentage: number;
  proctored: boolean;
  allowCalculator: boolean;
  description: string;
  instructions: string[];
  questions: ExamQuestion[];
  createdAt: string;
}

export interface FocusEvent {
  timestamp: string;
  type: 'tab_hidden' | 'window_blur';
  questionIndex: number;
}

export interface ActiveSessionState {
  examId: string;
  candidateName: string;
  candidateId: string;
  startedAt: string;
  remainingSeconds: number;
  isPaused: boolean;
  currentQuestionIndex: number;
  answers: Record<string, string[] | string>; // questionId -> selected option IDs or text string
  flaggedQuestionIds: string[];
  visitedQuestionIds: string[];
  scratchpadNotes: Record<string, string>; // questionId -> rough notes
  focusEvents: FocusEvent[];
}

export interface QuestionEvaluation {
  questionId: string;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
  userAnswer: string[] | string | undefined;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  examTitle: string;
  courseCode: string;
  discipline: DisciplineCategory;
  candidateName: string;
  candidateId: string;
  submittedAt: string;
  durationTakenSeconds: number;
  earnedPoints: number;
  totalPoints: number;
  percentageScore: number;
  passed: boolean;
  focusWarningsCount: number;
  evaluations: QuestionEvaluation[];
  answers: Record<string, string[] | string>;
}
