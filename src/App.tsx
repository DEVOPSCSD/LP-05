/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ActiveSessionState,
  DisciplineCategory,
  Exam,
  ExamSubmission,
  QuestionEvaluation
} from './types';
import { INITIAL_EXAMS, INITIAL_SUBMISSIONS } from './data/initialExams';
import { ActiveExamView } from './components/ActiveExamView';
import { SubmissionReview } from './components/SubmissionReview';
import { ExamBuilder } from './components/ExamBuilder';
import { Search, Plus, Play, FileText, Edit3 } from 'lucide-react';

type NavigationTab =
  | 'catalog'
  | 'active_session'
  | 'submissions'
  | 'analytics'
  | 'builder';

const STORAGE_KEYS = {
  EXAMS: 'veritas_exams_v1',
  SUBMISSIONS: 'veritas_submissions_v1',
  ACTIVE_SESSION: 'veritas_active_session_v1'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('catalog');

  // Persistent Catalog State
  const [exams, setExams] = useState<Exam[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXAMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to default catalog
    }
    return INITIAL_EXAMS;
  });

  // Persistent Submissions State
  const [submissions, setSubmissions] = useState<ExamSubmission[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_SUBMISSIONS;
  });

  // Persistent Active Session State
  const [activeSession, setActiveSession] = useState<ActiveSessionState | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return null;
  });

  // Catalog Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<
    'All' | DisciplineCategory
  >('All');

  // Pre-exam briefing dialog state
  const [briefingExam, setBriefingExam] = useState<Exam | null>(null);
  const [candidateNameInput, setCandidateNameInput] = useState('Aarav Reddy');
  const [candidateIdInput, setCandidateIdInput] = useState('24P61A67E3');
  const [honorCodeAccepted, setHonorCodeAccepted] = useState(false);

  // Selected submission for detailed transcript view
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(
    null
  );

  // Exam being edited in builder
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    } catch {
      // ignore storage quota errors
    }
  }, [exams]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
    } catch {
      // ignore
    }
  }, [submissions]);

  useEffect(() => {
    try {
      if (activeSession) {
        localStorage.setItem(
          STORAGE_KEYS.ACTIVE_SESSION,
          JSON.stringify(activeSession)
        );
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      }
    } catch {
      // ignore
    }
  }, [activeSession]);

  // Global 1-second countdown timer for active session
  useEffect(() => {
    if (!activeSession || activeSession.isPaused) return;

    const timer = window.setInterval(() => {
      setActiveSession((prev) => {
        if (!prev || prev.isPaused) return prev;
        if (prev.remainingSeconds <= 1) {
          return { ...prev, remainingSeconds: 0 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeSession?.examId, activeSession?.isPaused]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (activeSession && activeSession.remainingSeconds === 0) {
      handleFinalizeSubmission();
    }
  }, [activeSession?.remainingSeconds]);

  const handleOpenBriefing = (exam: Exam) => {
    setBriefingExam(exam);
    setHonorCodeAccepted(false);
  };

  const handleStartExamSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!briefingExam || !honorCodeAccepted) return;

    const newSession: ActiveSessionState = {
      examId: briefingExam.id,
      candidateName: candidateNameInput.trim() || 'Candidate',
      candidateId: candidateIdInput.trim().toUpperCase() || 'CAND-001',
      startedAt: new Date().toISOString(),
      remainingSeconds: briefingExam.durationMinutes * 60,
      isPaused: false,
      currentQuestionIndex: 0,
      answers: {},
      flaggedQuestionIds: [],
      visitedQuestionIds: briefingExam.questions[0]
        ? [briefingExam.questions[0].id]
        : [],
      scratchpadNotes: {},
      focusEvents: []
    };

    setActiveSession(newSession);
    setBriefingExam(null);
    setActiveTab('active_session');
  };

  const handleFinalizeSubmission = () => {
    if (!activeSession) return;
    const exam = exams.find((e) => e.id === activeSession.examId);
    if (!exam) {
      setActiveSession(null);
      setActiveTab('catalog');
      return;
    }

    let earnedPoints = 0;
    let totalPoints = 0;

    const evaluations: QuestionEvaluation[] = exam.questions.map((q) => {
      totalPoints += q.points;
      const userAns = activeSession.answers[q.id];
      let isCorrect = false;

      if (q.type === 'short_answer') {
        const expected = (q.correctTextAnswer || '').trim().toLowerCase();
        const actual = typeof userAns === 'string' ? userAns.trim().toLowerCase() : '';
        // Check numeric equivalence if both parse as numbers
        const expectedNum = Number(expected);
        const actualNum = Number(actual);
        if (
          actual !== '' &&
          !Number.isNaN(expectedNum) &&
          !Number.isNaN(actualNum)
        ) {
          isCorrect = Math.abs(expectedNum - actualNum) < 1e-6;
        } else {
          isCorrect = actual !== '' && actual === expected;
        }
      } else {
        const expectedIds = [...(q.correctOptionIds || [])].sort();
        const actualIds = Array.isArray(userAns) ? [...userAns].sort() : [];
        isCorrect =
          expectedIds.length === actualIds.length &&
          expectedIds.every((val, idx) => val === actualIds[idx]);
      }

      const pts = isCorrect ? q.points : 0;
      earnedPoints += pts;

      return {
        questionId: q.id,
        isCorrect,
        earnedPoints: pts,
        maxPoints: q.points,
        userAnswer: userAns
      };
    });

    const percentageScore =
      totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const allocatedSeconds = exam.durationMinutes * 60;
    const durationTakenSeconds = Math.max(
      1,
      allocatedSeconds - activeSession.remainingSeconds
    );

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newSubmission: ExamSubmission = {
      id: `sub-${Math.floor(1000 + Math.random() * 9000)}`,
      examId: exam.id,
      examTitle: exam.title,
      courseCode: exam.courseCode,
      discipline: exam.discipline,
      candidateName: activeSession.candidateName,
      candidateId: activeSession.candidateId,
      submittedAt: formattedDate,
      durationTakenSeconds,
      earnedPoints,
      totalPoints,
      percentageScore,
      passed: percentageScore >= exam.passingPercentage,
      focusWarningsCount: activeSession.focusEvents.length,
      evaluations,
      answers: activeSession.answers
    };

    setSubmissions((prev) => [newSubmission, ...prev]);
    setActiveSession(null);
    setSelectedSubmissionId(newSubmission.id);
    setActiveTab('submissions');
  };

  const handleSaveExam = (savedExam: Exam) => {
    setExams((prev) => {
      const exists = prev.some((e) => e.id === savedExam.id);
      if (exists) {
        return prev.map((e) => (e.id === savedExam.id ? savedExam : e));
      }
      return [savedExam, ...prev];
    });
    setEditingExam(null);
    setActiveTab('catalog');
  };

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesDiscipline =
        selectedDiscipline === 'All' || exam.discipline === selectedDiscipline;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        exam.title.toLowerCase().includes(q) ||
        exam.courseCode.toLowerCase().includes(q) ||
        exam.description.toLowerCase().includes(q) ||
        exam.instructor.toLowerCase().includes(q);
      return matchesDiscipline && matchesQuery;
    });
  }, [exams, selectedDiscipline, searchQuery]);

  const activeExamObj = useMemo(() => {
    if (!activeSession) return undefined;
    return exams.find((e) => e.id === activeSession.examId);
  }, [exams, activeSession]);

  const selectedSubmissionObj = useMemo(() => {
    if (!selectedSubmissionId) return undefined;
    return submissions.find((s) => s.id === selectedSubmissionId);
  }, [submissions, selectedSubmissionId]);

  // Aggregate Analytics
  const analyticsSummary = useMemo(() => {
    if (submissions.length === 0) {
      return {
        totalAttempts: 0,
        passRate: 0,
        meanScore: 0,
        integrityRate: 100
      };
    }
    const passedCount = submissions.filter((s) => s.passed).length;
    const totalScore = submissions.reduce((acc, s) => acc + s.percentageScore, 0);
    const cleanFocusCount = submissions.filter(
      (s) => s.focusWarningsCount === 0
    ).length;

    return {
      totalAttempts: submissions.length,
      passRate: Math.round((passedCount / submissions.length) * 100),
      meanScore: Math.round(totalScore / submissions.length),
      integrityRate: Math.round((cleanFocusCount / submissions.length) * 100)
    };
  }, [submissions]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 no-print">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#catalog"
            onClick={(e) => {
              e.preventDefault();
              setSelectedSubmissionId(null);
              setActiveTab('catalog');
            }}
            className="text-xl font-semibold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
          >
            Veritas
          </a>

          {/* Zone 2: 5 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => {
                setSelectedSubmissionId(null);
                setActiveTab('catalog');
              }}
              className={`py-1 transition-colors whitespace-nowrap border-b-2 ${
                activeTab === 'catalog'
                  ? 'text-slate-900 border-sky-700 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Catalog
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('active_session')}
              className={`py-1 transition-colors whitespace-nowrap border-b-2 ${
                activeTab === 'active_session'
                  ? 'text-slate-900 border-sky-700 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              {activeSession ? 'Active Session ●' : 'Active Session'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSubmissionId(null);
                setActiveTab('submissions');
              }}
              className={`py-1 transition-colors whitespace-nowrap border-b-2 ${
                activeTab === 'submissions'
                  ? 'text-slate-900 border-sky-700 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Submissions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`py-1 transition-colors whitespace-nowrap border-b-2 ${
                activeTab === 'analytics'
                  ? 'text-slate-900 border-sky-700 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingExam(null);
                setActiveTab('builder');
              }}
              className={`py-1 transition-colors whitespace-nowrap border-b-2 ${
                activeTab === 'builder'
                  ? 'text-slate-900 border-sky-700 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Exam Builder
            </button>
          </nav>

          {/* Zone 3: 1-2 Primary Actions */}
          <div className="flex items-center gap-3">
            {activeSession ? (
              <button
                type="button"
                onClick={() => setActiveTab('active_session')}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors whitespace-nowrap"
              >
                Resume Exam ({Math.ceil(activeSession.remainingSeconds / 60)}m left)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingExam(null);
                  setActiveTab('builder');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                Author Assessment
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Fallback */}
        <div className="flex md:hidden items-center gap-4 pt-3 mt-3 border-t border-slate-100 overflow-x-auto text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`whitespace-nowrap ${
              activeTab === 'catalog' ? 'text-sky-700 font-semibold' : ''
            }`}
          >
            Catalog
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('active_session')}
            className={`whitespace-nowrap ${
              activeTab === 'active_session' ? 'text-sky-700 font-semibold' : ''
            }`}
          >
            Active Session
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedSubmissionId(null);
              setActiveTab('submissions');
            }}
            className={`whitespace-nowrap ${
              activeTab === 'submissions' ? 'text-sky-700 font-semibold' : ''
            }`}
          >
            Submissions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`whitespace-nowrap ${
              activeTab === 'analytics' ? 'text-sky-700 font-semibold' : ''
            }`}
          >
            Analytics
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingExam(null);
              setActiveTab('builder');
            }}
            className={`whitespace-nowrap ${
              activeTab === 'builder' ? 'text-sky-700 font-semibold' : ''
            }`}
          >
            Exam Builder
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1">
        {/* TAB 1: EXAMINATION CATALOG */}
        {activeTab === 'catalog' && (
          <div className="max-w-[1360px] mx-auto px-6 py-8 space-y-8">
            {/* Editorial Header & Institutional Summary */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between pb-6 border-b border-slate-200 gap-6">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-medium text-slate-500">
                  Academic Examination Portal · Proctored & Diagnostic Assessments
                </p>
                <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
                  Qualifying Examinations & Course Assessments
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Select a scheduled examination below to review syllabus rules, verify candidate credentials, and launch a timed assessment environment with immediate rubric grading.
                </p>
              </div>

              {/* Clean Tabular Summary Strip */}
              <div className="grid grid-cols-3 gap-6 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                <div>
                  <div className="text-xs text-slate-500">Active Catalog</div>
                  <div className="text-xl font-mono font-semibold tabular-nums text-slate-900 mt-0.5">
                    {exams.length} Exams
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Graded Transcripts</div>
                  <div className="text-xl font-mono font-semibold tabular-nums text-slate-900 mt-0.5">
                    {submissions.length} Records
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Cohort Pass Rate</div>
                  <div className="text-xl font-mono font-semibold tabular-nums text-emerald-700 mt-0.5">
                    {analyticsSummary.passRate}%
                  </div>
                </div>
              </div>
            </div>

            {/* Active Session Banner if an exam is in progress */}
            {activeSession && activeExamObj && (
              <div className="bg-white border border-sky-700 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-sky-800 font-mono">
                    <span>● SESSION IN PROGRESS</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeExamObj.courseCode}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {Math.floor(activeSession.remainingSeconds / 60)}m{' '}
                      {activeSession.remainingSeconds % 60}s Remaining
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {activeExamObj.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('active_session')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-md hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Return to Active Examination
                </button>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Interactive Segmented Discipline Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto">
                {(
                  [
                    'All',
                    'Computer Science',
                    'Distributed Systems',
                    'Applied Mathematics',
                    'Data Science'
                  ] as const
                ).map((disc) => (
                  <button
                    key={disc}
                    type="button"
                    onClick={() => setSelectedDiscipline(disc)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      selectedDiscipline === disc
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {disc === 'All' ? 'All Disciplines' : disc}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by course code, topic, faculty..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
                />
              </div>
            </div>

            {/* Examination Grid */}
            {filteredExams.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
                <p className="text-base font-semibold text-slate-900">
                  No matching examinations found
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No examinations match your current search filter. Reset the discipline filter or author a new custom examination.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDiscipline('All');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Reset Catalog Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredExams.map((exam) => {
                  const totalPts = exam.questions.reduce(
                    (sum, q) => sum + q.points,
                    0
                  );
                  const latestAttempt = submissions.find(
                    (s) => s.examId === exam.id
                  );

                  return (
                    <article
                      key={exam.id}
                      className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between space-y-6 hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-3">
                        {/* Quiet 1-line unboxed metadata kicker (Zero-Pill Discipline) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-900">
                              {exam.courseCode}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{exam.discipline}</span>
                            <span aria-hidden="true">·</span>
                            <span>{exam.instructor}</span>
                          </div>
                          <span className="font-mono text-slate-600">
                            {exam.proctored ? '● Proctored' : '○ Practice'}
                          </span>
                        </div>

                        <h2 className="text-xl font-semibold text-slate-900 leading-snug">
                          {exam.title}
                        </h2>

                        <p className="text-sm text-slate-600 leading-relaxed">
                          {exam.description}
                        </p>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        {/* Tabular Exam Parameters */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono tabular-nums text-slate-600">
                          <span>{exam.durationMinutes} min</span>
                          <span aria-hidden="true">·</span>
                          <span>{exam.questions.length} Questions</span>
                          <span aria-hidden="true">·</span>
                          <span>{totalPts} Points</span>
                          <span aria-hidden="true">·</span>
                          <span>Pass ≥ {exam.passingPercentage}%</span>
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between gap-3 pt-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingExam(exam);
                                setActiveTab('builder');
                              }}
                              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Rubric</span>
                            </button>
                            {latestAttempt && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSubmissionId(latestAttempt.id);
                                  setActiveTab('submissions');
                                }}
                                className="px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Last Score: {latestAttempt.percentageScore}%</span>
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenBriefing(exam)}
                            className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-md hover:bg-sky-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Begin Examination</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE SESSION */}
        {activeTab === 'active_session' && (
          <>
            {activeSession && activeExamObj ? (
              <ActiveExamView
                exam={activeExamObj}
                session={activeSession}
                onUpdateSession={(updater) =>
                  setActiveSession((prev) => (prev ? updater(prev) : null))
                }
                onSubmitExam={handleFinalizeSubmission}
              />
            ) : (
              <div className="max-w-[960px] mx-auto px-6 py-16">
                <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-4">
                  <p className="text-xs font-mono text-slate-500">
                    NO ACTIVE EXAMINATION SESSION
                  </p>
                  <h1 className="text-2xl font-semibold text-slate-900">
                    Select an Assessment to Begin Testing
                  </h1>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    You do not currently have an examination clock running. Choose an examination from the catalog to verify your candidate details and start the timer.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('catalog')}
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors"
                    >
                      Browse Examination Catalog
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 3: SUBMISSIONS & TRANSCRIPTS */}
        {activeTab === 'submissions' && (
          <>
            {selectedSubmissionObj ? (
              <SubmissionReview
                submission={selectedSubmissionObj}
                exam={exams.find((e) => e.id === selectedSubmissionObj.examId)}
                onBackToList={() => setSelectedSubmissionId(null)}
                onRetakeExam={(exam) => handleOpenBriefing(exam)}
              />
            ) : (
              <div className="max-w-[1360px] mx-auto px-6 py-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-slate-200 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Official Examination Ledger · Automated Rubric Evaluations
                    </p>
                    <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mt-0.5">
                      Submitted Examinations & Diagnostic Transcripts
                    </h1>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('catalog')}
                    className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors whitespace-nowrap self-start sm:self-auto"
                  >
                    Take New Examination
                  </button>
                </div>

                {submissions.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
                    <p className="text-base font-semibold text-slate-900">
                      No examination submissions recorded yet
                    </p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Complete any assessment from the catalog to generate an itemized score report and diagnostic explanation transcript.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                            <th className="py-3 px-4">Record ID</th>
                            <th className="py-3 px-4">Examination</th>
                            <th className="py-3 px-4">Candidate</th>
                            <th className="py-3 px-4">Submitted</th>
                            <th className="py-3 px-4 text-right">Duration</th>
                            <th className="py-3 px-4 text-right">Points</th>
                            <th className="py-3 px-4 text-right">Score</th>
                            <th className="py-3 px-4">Outcome</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                          {submissions.map((sub) => (
                            <tr
                              key={sub.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                                {sub.id}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-900">
                                  {sub.courseCode} — {sub.examTitle}
                                </div>
                                <div className="text-slate-500 mt-0.5">
                                  {sub.discipline}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="font-medium text-slate-900">
                                  {sub.candidateName}
                                </div>
                                <div className="font-mono text-slate-500">
                                  {sub.candidateId}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                                {sub.submittedAt}
                              </td>
                              <td className="py-3.5 px-4 font-mono tabular-nums text-right text-slate-600 whitespace-nowrap">
                                {Math.floor(sub.durationTakenSeconds / 60)}m{' '}
                                {String(sub.durationTakenSeconds % 60).padStart(2, '0')}s
                              </td>
                              <td className="py-3.5 px-4 font-mono tabular-nums text-right text-slate-900 whitespace-nowrap">
                                {sub.earnedPoints} / {sub.totalPoints}
                              </td>
                              <td className="py-3.5 px-4 font-mono tabular-nums text-right font-semibold text-slate-900 whitespace-nowrap">
                                {sub.percentageScore}%
                              </td>
                              <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                                {sub.passed ? (
                                  <span className="text-emerald-700 font-medium">
                                    ● Passed
                                  </span>
                                ) : (
                                  <span className="text-red-700 font-medium">
                                    ■ Below Threshold
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSubmissionId(sub.id)}
                                  className="px-3 py-1.5 text-xs font-medium text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors"
                                >
                                  Inspect Transcript
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* TAB 4: COHORT & ITEM ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="max-w-[1360px] mx-auto px-6 py-8 space-y-8">
            <div className="pb-6 border-b border-slate-200">
              <p className="text-xs font-medium text-slate-500">
                Psychometric & Cohort Performance Telemetry
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mt-0.5">
                Assessment Analytics & Competency Breakdown
              </h1>
            </div>

            {/* Top Metric Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="text-xs text-slate-500">Total Graded Attempts</div>
                <div className="text-2xl font-mono font-semibold tabular-nums text-slate-900 mt-1">
                  {analyticsSummary.totalAttempts}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Across {exams.length} published examinations
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="text-xs text-slate-500">Mean Cohort Score</div>
                <div className="text-2xl font-mono font-semibold tabular-nums text-slate-900 mt-1">
                  {analyticsSummary.meanScore}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Weighted by total examination points
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="text-xs text-slate-500">Qualification Pass Rate</div>
                <div className="text-2xl font-mono font-semibold tabular-nums text-emerald-700 mt-1">
                  {analyticsSummary.passRate}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  ● Meeting course threshold criteria
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="text-xs text-slate-500">Zero-Warning Focus Rate</div>
                <div className="text-2xl font-mono font-semibold tabular-nums text-slate-900 mt-1">
                  {analyticsSummary.integrityRate}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Sessions completed without tab switches
                </div>
              </div>
            </div>

            {/* Per-Examination Performance Table */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Performance Distribution by Examination
                </h2>
                <p className="text-xs text-slate-500">
                  Aggregated accuracy, average completion time, and pass ratio across each curriculum module.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 pr-4">Course Code</th>
                      <th className="py-3 px-4">Examination Title</th>
                      <th className="py-3 px-4">Discipline</th>
                      <th className="py-3 px-4 text-right">Attempts</th>
                      <th className="py-3 px-4 text-right">Pass Threshold</th>
                      <th className="py-3 px-4 text-right">Mean Score</th>
                      <th className="py-3 pl-4 text-right">Qualification Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {exams.map((exam) => {
                      const examSubs = submissions.filter(
                        (s) => s.examId === exam.id
                      );
                      const count = examSubs.length;
                      const avgScore =
                        count > 0
                          ? Math.round(
                              examSubs.reduce((a, b) => a + b.percentageScore, 0) /
                                count
                            )
                          : null;
                      const passRatio =
                        count > 0
                          ? Math.round(
                              (examSubs.filter((s) => s.passed).length / count) *
                                100
                            )
                          : null;

                      return (
                        <tr key={exam.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 pr-4 font-mono font-semibold text-slate-900">
                            {exam.courseCode}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-900">
                            {exam.title}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {exam.discipline}
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-right text-slate-700">
                            {count}
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-right text-slate-600">
                            {exam.passingPercentage}%
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-right font-semibold text-slate-900">
                            {avgScore !== null ? `${avgScore}%` : '—'}
                          </td>
                          <td className="py-3.5 pl-4 font-mono tabular-nums text-right">
                            {passRatio !== null ? (
                              <span
                                className={
                                  passRatio >= 70
                                    ? 'text-emerald-700 font-semibold'
                                    : 'text-amber-700 font-semibold'
                                }
                              >
                                {passRatio}%
                              </span>
                            ) : (
                              <span className="text-slate-400">No attempts</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FACULTY EXAM BUILDER */}
        {activeTab === 'builder' && (
          <ExamBuilder
            initialExam={editingExam}
            onSaveExam={handleSaveExam}
            onCancel={() => {
              setEditingExam(null);
              setActiveTab('catalog');
            }}
          />
        )}
      </main>

      {/* Pre-Exam Briefing & Honor Code Modal */}
      {briefingExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-xl w-full p-6 md:p-8 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="space-y-1.5 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span className="font-semibold text-slate-900">
                  {briefingExam.courseCode}
                </span>
                <span aria-hidden="true">·</span>
                <span>{briefingExam.discipline}</span>
                <span aria-hidden="true">·</span>
                <span>{briefingExam.durationMinutes} Minutes</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                {briefingExam.title}
              </h2>
            </div>

            <form onSubmit={handleStartExamSession} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Candidate Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={candidateNameInput}
                    onChange={(e) => setCandidateNameInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    University / Roll Identifier
                  </label>
                  <input
                    type="text"
                    required
                    value={candidateIdInput}
                    onChange={(e) => setCandidateIdInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2.5">
                <div className="text-xs font-semibold text-slate-900">
                  Examination Protocol & Rubric Rules
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                  {briefingExam.instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                  <li>
                    Passing score requirement:{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      {briefingExam.passingPercentage}%
                    </span>{' '}
                    across {briefingExam.questions.length} graded items.
                  </li>
                </ul>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={honorCodeAccepted}
                  onChange={(e) => setHonorCodeAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-sky-700 focus:ring-sky-700"
                />
                <span>
                  I affirm that I am the registered candidate identified above and agree to abide by the Academic Integrity Honor Code for the duration of this timed assessment.
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setBriefingExam(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!honorCodeAccepted}
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-700 rounded-md hover:bg-sky-800 disabled:opacity-40 transition-colors"
                >
                  Launch Timed Examination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clean Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-5 mt-12 no-print">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Veritas Examination & Assessment Portal · Academic Evaluation System
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className="hover:text-slate-900 transition-colors"
            >
              Assessment Catalog
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('submissions')}
              className="hover:text-slate-900 transition-colors"
            >
              Transcript Ledger
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => {
                setEditingExam(null);
                setActiveTab('builder');
              }}
              className="hover:text-slate-900 transition-colors"
            >
              Faculty Authoring
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
