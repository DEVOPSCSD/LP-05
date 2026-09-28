import React, { useState, useEffect } from 'react';
import { ActiveSessionState, Exam } from '../types';
import { Flag, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Check } from 'lucide-react';

interface ActiveExamViewProps {
  exam: Exam;
  session: ActiveSessionState;
  onUpdateSession: (updater: (prev: ActiveSessionState) => ActiveSessionState) => void;
  onSubmitExam: () => void;
}

export const ActiveExamView: React.FC<ActiveExamViewProps> = ({
  exam,
  session,
  onUpdateSession,
  onSubmitExam
}) => {
  const [questionFilter, setQuestionFilter] = useState<'all' | 'unanswered' | 'flagged'>('all');
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [calculatorExpr, setCalculatorExpr] = useState('');
  const [calculatorResult, setCalculatorResult] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

  const currentQuestion = exam.questions[session.currentQuestionIndex] || exam.questions[0];

  // Track browser tab visibility / window blur for proctored integrity
  useEffect(() => {
    if (!exam.proctored) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onUpdateSession((prev) => ({
          ...prev,
          focusEvents: [
            ...prev.focusEvents,
            {
              timestamp: new Date().toLocaleTimeString(),
              type: 'tab_hidden',
              questionIndex: prev.currentQuestionIndex + 1
            }
          ]
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [exam.proctored, onUpdateSession]);

  // Mark current question as visited
  useEffect(() => {
    if (!currentQuestion) return;
    if (!session.visitedQuestionIds.includes(currentQuestion.id)) {
      onUpdateSession((prev) => ({
        ...prev,
        visitedQuestionIds: [...prev.visitedQuestionIds, currentQuestion.id]
      }));
    }
  }, [currentQuestion, session.visitedQuestionIds, onUpdateSession]);

  const isQuestionAnswered = (questionId: string): boolean => {
    const ans = session.answers[questionId];
    if (Array.isArray(ans)) return ans.length > 0;
    if (typeof ans === 'string') return ans.trim().length > 0;
    return false;
  };

  const handleSelectOption = (optionId: string) => {
    if (session.isPaused) return;
    const qId = currentQuestion.id;

    if (currentQuestion.type === 'single_choice') {
      onUpdateSession((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [qId]: [optionId]
        }
      }));
    } else if (currentQuestion.type === 'multiple_select') {
      onUpdateSession((prev) => {
        const existing = (prev.answers[qId] as string[]) || [];
        const next = existing.includes(optionId)
          ? existing.filter((id) => id !== optionId)
          : [...existing, optionId];
        return {
          ...prev,
          answers: {
            ...prev.answers,
            [qId]: next
          }
        };
      });
    }
  };

  const handleShortAnswerChange = (text: string) => {
    if (session.isPaused) return;
    onUpdateSession((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: text
      }
    }));
  };

  const handleClearResponse = () => {
    onUpdateSession((prev) => {
      const nextAnswers = { ...prev.answers };
      delete nextAnswers[currentQuestion.id];
      return {
        ...prev,
        answers: nextAnswers
      };
    });
  };

  const handleToggleFlag = () => {
    const qId = currentQuestion.id;
    onUpdateSession((prev) => {
      const isFlagged = prev.flaggedQuestionIds.includes(qId);
      return {
        ...prev,
        flaggedQuestionIds: isFlagged
          ? prev.flaggedQuestionIds.filter((id) => id !== qId)
          : [...prev.flaggedQuestionIds, qId]
      };
    });
  };

  const handleNavigateQuestion = (index: number) => {
    if (index < 0 || index >= exam.questions.length) return;
    onUpdateSession((prev) => ({
      ...prev,
      currentQuestionIndex: index
    }));
  };

  const handleScratchpadChange = (note: string) => {
    onUpdateSession((prev) => ({
      ...prev,
      scratchpadNotes: {
        ...prev.scratchpadNotes,
        [currentQuestion.id]: note
      }
    }));
  };

  const evaluateCalculator = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sanitized = calculatorExpr.replace(/[^0-9+\-*/().^\s]/g, '');
      if (!sanitized.trim()) {
        setCalculatorResult(null);
        return;
      }
      const normalized = sanitized.replace(/\^/g, '**');
      // Safe arithmetic evaluation
      const val = Function(`"use strict"; return (${normalized})`)();
      if (typeof val === 'number' && !Number.isNaN(val)) {
        setCalculatorResult(Number(val.toFixed(6)).toString());
      } else {
        setCalculatorResult('Syntax Error');
      }
    } catch {
      setCalculatorResult('Invalid Expression');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const answeredCount = exam.questions.filter((q) => isQuestionAnswered(q.id)).length;
  const unansweredCount = exam.questions.length - answeredCount;
  const flaggedCount = session.flaggedQuestionIds.length;
  const isCurrentFlagged = session.flaggedQuestionIds.includes(currentQuestion.id);

  // Determine timer status with both text and symbol (no color-only signaling)
  const isUrgent = session.remainingSeconds <= 300 && session.remainingSeconds > 60;
  const isCritical = session.remainingSeconds <= 60;

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-6">
      {/* Top Session Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono font-semibold text-slate-800">{exam.courseCode}</span>
            <span aria-hidden="true">·</span>
            <span>{exam.discipline}</span>
            <span aria-hidden="true">·</span>
            <span>Candidate: {session.candidateName} ({session.candidateId})</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mt-0.5">{exam.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {exam.allowCalculator && (
            <button
              type="button"
              onClick={() => setShowCalculator(!showCalculator)}
              className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                showCalculator
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {showCalculator ? 'Hide Calculator' : 'Scientific Calculator'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowScratchpad(!showScratchpad)}
            className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
              showScratchpad
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {showScratchpad ? 'Hide Scratchpad' : 'Rough Work Scratchpad'}
          </button>
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-md hover:bg-sky-800 transition-colors whitespace-nowrap"
          >
            Review & Submit Exam
          </button>
        </div>
      </div>

      {/* Two-Zone Assessment Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Zone (8 cols ~ 67%): Interactive Question Stage */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 md:p-8">
            {/* Question Metadata Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <span className="font-mono font-semibold text-slate-900 text-sm">
                  Question {String(session.currentQuestionIndex + 1).padStart(2, '0')} of{' '}
                  {String(exam.questions.length).padStart(2, '0')}
                </span>
                <span aria-hidden="true">·</span>
                <span>{currentQuestion.topic}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {currentQuestion.points} pts
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {currentQuestion.type === 'single_choice'
                    ? 'Single Choice'
                    : currentQuestion.type === 'multiple_select'
                    ? 'Select All That Apply'
                    : 'Numerical / Exact Value'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleFlag}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  isCurrentFlagged
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{isCurrentFlagged ? '▲ Flagged for Review' : 'Flag for Review'}</span>
              </button>
            </div>

            {session.isPaused ? (
              <div className="py-16 text-center space-y-3">
                <p className="text-base font-semibold text-slate-900">
                  Session Timer Paused
                </p>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Question contents are masked while the clock is paused. Resume the timer to view and modify your response.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSession((prev) => ({ ...prev, isPaused: false }))
                  }
                  className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-md hover:bg-sky-800 transition-colors inline-flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Examination</span>
                </button>
              </div>
            ) : (
              <div className="pt-6 space-y-6">
                {/* Question Stem */}
                <div className="text-base text-slate-900 leading-relaxed font-normal max-w-[72ch]">
                  {currentQuestion.prompt}
                </div>

                {/* Optional Monospace Code / Formula Block */}
                {currentQuestion.codeSnippet && (
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-md text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                    <code>{currentQuestion.codeSnippet}</code>
                  </pre>
                )}

                {/* Interactive Response Area */}
                <div className="pt-2">
                  {currentQuestion.type === 'short_answer' ? (
                    <div className="max-w-md space-y-2">
                      <label className="block text-xs font-medium text-slate-700">
                        Your Numerical / Exact Response
                        {currentQuestion.acceptableUnits
                          ? ` (${currentQuestion.acceptableUnits})`
                          : ''}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={(session.answers[currentQuestion.id] as string) || ''}
                          onChange={(e) => handleShortAnswerChange(e.target.value)}
                          placeholder="Enter exact value..."
                          className="w-full px-4 py-2.5 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
                        />
                        {currentQuestion.acceptableUnits && (
                          <span className="text-xs font-mono text-slate-500 shrink-0">
                            {currentQuestion.acceptableUnits}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Responses are automatically saved as you type.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-slate-500">
                        {currentQuestion.type === 'multiple_select'
                          ? 'Multiple-Select Question: Choose all options that are mathematically or algorithmically valid.'
                          : 'Single-Choice Question: Select the single best option below.'}
                      </p>
                      {currentQuestion.options?.map((option) => {
                        const selectedList =
                          (session.answers[currentQuestion.id] as string[]) || [];
                        const isSelected = selectedList.includes(option.id);

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelectOption(option.id)}
                            className={`w-full text-left p-4 rounded-lg border transition-colors flex items-start gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 ${
                              isSelected
                                ? 'bg-sky-50/70 border-sky-700 text-slate-900'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/60'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-semibold shrink-0 mt-0.5 border ${
                                isSelected
                                  ? 'bg-sky-700 text-white border-sky-700'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {isSelected ? <Check className="w-3.5 h-3.5" /> : option.label}
                            </span>
                            <span className="text-sm leading-relaxed">{option.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Question Action Footer */}
            <div className="mt-8 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigateQuestion(session.currentQuestionIndex - 1)}
                  disabled={session.currentQuestionIndex === 0}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40 transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearResponse}
                  disabled={!isQuestionAnswered(currentQuestion.id)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Response</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {session.currentQuestionIndex < exam.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => handleNavigateQuestion(session.currentQuestionIndex + 1)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-md hover:bg-sky-800 transition-colors whitespace-nowrap"
                  >
                    Proceed to Final Submission
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Optional Rough Work Scratchpad & Calculator Drawer */}
          {(showScratchpad || showCalculator) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {showScratchpad && (
                <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Candidate Rough Work Scratchpad (Item {session.currentQuestionIndex + 1})
                    </h3>
                    <span className="text-xs text-slate-500">Auto-saved locally</span>
                  </div>
                  <textarea
                    rows={4}
                    value={session.scratchpadNotes[currentQuestion.id] || ''}
                    onChange={(e) => handleScratchpadChange(e.target.value)}
                    placeholder="Derive recurrence steps, matrix traces, or intermediate algebra here..."
                    className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
                  />
                </div>
              )}

              {showCalculator && exam.allowCalculator && (
                <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Arithmetic & Exponent Evaluator
                    </h3>
                    <span className="text-xs font-mono text-slate-500">+ - * / ^ ( )</span>
                  </div>
                  <form onSubmit={evaluateCalculator} className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={calculatorExpr}
                        onChange={(e) => setCalculatorExpr(e.target.value)}
                        placeholder="e.g. (40 / (40 + 10)) or 2^10"
                        className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 whitespace-nowrap"
                      >
                        Compute
                      </button>
                    </div>
                    {calculatorResult !== null && (
                      <div className="p-2.5 bg-slate-100 rounded text-xs font-mono tabular-nums flex items-center justify-between">
                        <span className="text-slate-500">Result:</span>
                        <span className="font-semibold text-slate-900">{calculatorResult}</span>
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Zone (4 cols ~ 33%): Control, Timer & Navigator Deck */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Countdown Clock Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Time Remaining</span>
              <span
                className={`text-xs font-mono font-medium ${
                  isCritical
                    ? 'text-red-700'
                    : isUrgent
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                }`}
              >
                {isCritical
                  ? '■ CRITICAL (< 1 MIN)'
                  : isUrgent
                  ? '▲ ELEVATED (< 5 MIN)'
                  : '● NOMINAL TIME'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-mono font-semibold tabular-nums tracking-tight text-slate-900">
                {formatTimer(session.remainingSeconds)}
              </div>
              {!exam.proctored && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSession((prev) => ({ ...prev, isPaused: !prev.isPaused }))
                  }
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  {session.isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Clock</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-500 font-mono tabular-nums">
                <span>Completion Progress</span>
                <span>
                  {answeredCount} / {exam.questions.length} Answered
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-700 transition-transform duration-150 origin-left"
                  style={{
                    transform: `scaleX(${
                      exam.questions.length > 0
                        ? answeredCount / exam.questions.length
                        : 0
                    })`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Question Navigator Matrix */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Question Matrix</h2>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {unansweredCount} Remaining
              </span>
            </div>

            {/* Interactive Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setQuestionFilter('all')}
                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  questionFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({exam.questions.length})
              </button>
              <button
                type="button"
                onClick={() => setQuestionFilter('unanswered')}
                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  questionFilter === 'unanswered'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Open ({unansweredCount})
              </button>
              <button
                type="button"
                onClick={() => setQuestionFilter('flagged')}
                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  questionFilter === 'flagged'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Flagged ({flaggedCount})
              </button>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-5 gap-2 pt-1">
              {exam.questions.map((q, idx) => {
                const answered = isQuestionAnswered(q.id);
                const flagged = session.flaggedQuestionIds.includes(q.id);
                const isCurrent = idx === session.currentQuestionIndex;

                if (questionFilter === 'unanswered' && answered) return null;
                if (questionFilter === 'flagged' && !flagged) return null;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleNavigateQuestion(idx)}
                    className={`h-10 rounded-md font-mono text-xs tabular-nums font-medium border flex flex-col items-center justify-center relative transition-colors ${
                      isCurrent
                        ? 'border-slate-900 ring-2 ring-slate-900/20 bg-slate-900 text-white'
                        : answered
                        ? 'bg-sky-50 border-sky-300 text-sky-900 hover:bg-sky-100'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    title={`Question ${idx + 1}: ${
                      answered ? 'Answered' : 'Unanswered'
                    }${flagged ? ' (Flagged)' : ''}`}
                  >
                    <span>{String(idx + 1).padStart(2, '0')}</span>
                    {flagged && (
                      <span
                        className={`text-[9px] leading-none ${
                          isCurrent ? 'text-amber-300' : 'text-amber-600'
                        }`}
                      >
                        ▲
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Matrix Legend */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              <span>■ Current</span>
              <span>·</span>
              <span className="text-sky-800">● Answered ({answeredCount})</span>
              <span>·</span>
              <span className="text-amber-700">▲ Flagged ({flaggedCount})</span>
            </div>
          </div>

          {/* Proctoring & Focus Integrity Log */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900">
                Session Focus Monitor
              </h3>
              <span className="text-xs font-mono tabular-nums text-slate-600">
                {exam.proctored ? 'Proctored Mode' : 'Practice Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {exam.proctored
                ? 'Browser tab visibility is monitored. Switching away from this examination window appends a timestamped event to your transcript.'
                : 'Unproctored examination: tab switching and clock pausing are permitted.'}
            </p>
            {exam.proctored && (
              <div className="pt-1 text-xs font-mono tabular-nums">
                {session.focusEvents.length === 0 ? (
                  <span className="text-emerald-700">
                    ● 0 Focus Deviations Recorded
                  </span>
                ) : (
                  <div className="space-y-1 text-amber-800">
                    <p className="font-semibold">
                      ▲ {session.focusEvents.length} Focus Warning(s) Logged:
                    </p>
                    <ul className="space-y-0.5 text-[11px]">
                      {session.focusEvents.slice(-3).map((ev, i) => (
                        <li key={i}>
                          {ev.timestamp} — Tab unfocused on Item {ev.questionIndex}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 space-y-5 shadow-lg">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Confirm Examination Submission
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Once submitted, responses are locked and graded immediately against the canonical rubric.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between">
                <span className="text-slate-600">Answered Questions:</span>
                <span className="font-semibold text-slate-900">
                  {answeredCount} / {exam.questions.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Unanswered Items:</span>
                <span
                  className={`font-semibold ${
                    unansweredCount > 0 ? 'text-amber-700' : 'text-slate-900'
                  }`}
                >
                  {unansweredCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Flagged for Review:</span>
                <span className="font-semibold text-slate-900">{flaggedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Remaining Clock:</span>
                <span className="font-semibold text-slate-900">
                  {formatTimer(session.remainingSeconds)}
                </span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-md">
                ▲ You still have {unansweredCount} unanswered question(s). Unanswered items receive 0 points.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap"
              >
                Return to Exam
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSubmitModal(false);
                  onSubmitExam();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-md hover:bg-sky-800 whitespace-nowrap"
              >
                Finalize & Grade Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
