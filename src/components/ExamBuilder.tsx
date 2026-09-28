import React, { useState } from 'react';
import { DisciplineCategory, Exam, ExamQuestion, QuestionType } from '../types';
import { Plus, Trash2, Check } from 'lucide-react';

interface ExamBuilderProps {
  onSaveExam: (exam: Exam) => void;
  onCancel: () => void;
  initialExam?: Exam | null;
}

const DISCIPLINES: DisciplineCategory[] = [
  'Computer Science',
  'Distributed Systems',
  'Applied Mathematics',
  'Data Science'
];

export const ExamBuilder: React.FC<ExamBuilderProps> = ({
  onSaveExam,
  onCancel,
  initialExam
}) => {
  const [courseCode, setCourseCode] = useState(initialExam?.courseCode || 'CS-415');
  const [title, setTitle] = useState(initialExam?.title || '');
  const [discipline, setDiscipline] = useState<DisciplineCategory>(
    initialExam?.discipline || 'Computer Science'
  );
  const [instructor, setInstructor] = useState(initialExam?.instructor || 'Prof. Elena Vance');
  const [durationMinutes, setDurationMinutes] = useState(initialExam?.durationMinutes || 30);
  const [passingPercentage, setPassingPercentage] = useState(initialExam?.passingPercentage || 70);
  const [proctored, setProctored] = useState(initialExam?.proctored ?? true);
  const [allowCalculator, setAllowCalculator] = useState(initialExam?.allowCalculator ?? true);
  const [description, setDescription] = useState(initialExam?.description || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [questions, setQuestions] = useState<ExamQuestion[]>(
    initialExam?.questions || [
      {
        id: `q-${Date.now()}-1`,
        type: 'single_choice',
        topic: 'Core Concepts',
        points: 25,
        prompt: 'What is the worst-case time complexity of searching for an element in a balanced Binary Search Tree (AVL Tree) with n nodes?',
        options: [
          { id: 'opt-a', label: 'A', text: 'Θ(1)' },
          { id: 'opt-b', label: 'B', text: 'Θ(log n)' },
          { id: 'opt-c', label: 'C', text: 'Θ(n)' },
          { id: 'opt-d', label: 'D', text: 'Θ(n log n)' }
        ],
        correctOptionIds: ['opt-b'],
        explanation: 'An AVL tree maintains height balance such that h = Θ(log n), bounding search path length to Θ(log n).'
      }
    ]
  );

  const handleAddQuestion = (type: QuestionType) => {
    const newId = `q-${Date.now()}-${questions.length + 1}`;
    if (type === 'short_answer') {
      setQuestions([
        ...questions,
        {
          id: newId,
          type: 'short_answer',
          topic: 'Quantitative Problem',
          points: 25,
          prompt: '',
          correctTextAnswer: '',
          acceptableUnits: 'value',
          explanation: ''
        }
      ]);
    } else {
      setQuestions([
        ...questions,
        {
          id: newId,
          type,
          topic: 'Conceptual Analysis',
          points: 25,
          prompt: '',
          options: [
            { id: 'opt-a', label: 'A', text: '' },
            { id: 'opt-b', label: 'B', text: '' },
            { id: 'opt-c', label: 'C', text: '' },
            { id: 'opt-d', label: 'D', text: '' }
          ],
          correctOptionIds: ['opt-a'],
          explanation: ''
        }
      ]);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const updateQuestion = (index: number, patch: Partial<ExamQuestion>) => {
    setQuestions(
      questions.map((q, idx) => (idx === index ? { ...q, ...patch } : q))
    );
  };

  const toggleCorrectOption = (qIndex: number, optionId: string) => {
    const q = questions[qIndex];
    if (!q.options) return;
    if (q.type === 'single_choice') {
      updateQuestion(qIndex, { correctOptionIds: [optionId] });
    } else if (q.type === 'multiple_select') {
      const current = q.correctOptionIds || [];
      const exists = current.includes(optionId);
      const next = exists
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      if (next.length > 0) {
        updateQuestion(qIndex, { correctOptionIds: next });
      }
    }
  };

  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    const q = questions[qIndex];
    if (!q.options) return;
    const nextOptions = q.options.map((opt, idx) =>
      idx === optIndex ? { ...opt, text } : opt
    );
    updateQuestion(qIndex, { options: nextOptions });
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || !courseCode.trim()) {
      setErrorMessage('Please provide both a Course Code and Assessment Title.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        setErrorMessage(`Question ${i + 1} is missing a problem statement.`);
        return;
      }
      if (q.type === 'short_answer' && !q.correctTextAnswer?.trim()) {
        setErrorMessage(`Question ${i + 1} requires an exact expected answer.`);
        return;
      }
      if (q.type !== 'short_answer' && q.options) {
        const emptyOpt = q.options.some((o) => !o.text.trim());
        if (emptyOpt) {
          setErrorMessage(`All answer options in Question ${i + 1} must have text.`);
          return;
        }
      }
    }

    const constructedExam: Exam = {
      id: initialExam?.id || `exam-custom-${Date.now()}`,
      courseCode: courseCode.trim().toUpperCase(),
      title: title.trim(),
      discipline,
      instructor: instructor.trim() || 'Faculty Examiner',
      durationMinutes: Math.max(5, Math.min(240, Number(durationMinutes) || 30)),
      passingPercentage: Math.max(10, Math.min(100, Number(passingPercentage) || 70)),
      proctored,
      allowCalculator,
      description:
        description.trim() ||
        'Faculty-authored examination evaluating conceptual mastery and quantitative problem solving.',
      instructions: [
        'Read each question carefully and verify your answer before advancing.',
        'Multiple-select items require all valid choices to be marked for full credit.',
        'All responses are automatically saved to your active session state.'
      ],
      createdAt: initialExam?.createdAt || new Date().toISOString().slice(0, 10),
      questions
    };

    onSaveExam(constructedExam);
  };

  const totalPoints = questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);

  return (
    <div className="max-w-[1160px] mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">
            Faculty Authoring Studio · Curriculum & Rubric Configuration
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
            {initialExam ? `Edit ${initialExam.courseCode} Specification` : 'Author New Examination'}
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-600">
          <span>{questions.length} Questions</span>
          <span aria-hidden="true">·</span>
          <span>{totalPoints} Total Points</span>
          <span aria-hidden="true">·</span>
          <span>{durationMinutes} Min Allocation</span>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-6 p-4 border border-red-300 bg-red-50 text-red-900 text-sm rounded-lg flex items-center justify-between">
          <span>■ Validation Error: {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-medium underline ml-4 whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handlePublish} className="mt-8 space-y-10">
        {/* Section 1: Metadata */}
        <section className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            01. Examination Parameters & Governance
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Define course classification, time constraints, passing thresholds, and proctoring rules.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Course Code
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CS-415"
                className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Assessment Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Operating Systems & Kernel Concurrency Midterm"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Academic Discipline
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as DisciplineCategory)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
              >
                {DISCIPLINES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Examiner / Instructor
              </label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Duration (Minutes): <span className="font-mono">{durationMinutes}m</span>
              </label>
              <input
                type="number"
                min={5}
                max={240}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Passing Score (%): <span className="font-mono">{passingPercentage}%</span>
              </label>
              <input
                type="number"
                min={10}
                max={100}
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
              />
            </div>

            <div className="flex flex-col justify-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={proctored}
                  onChange={(e) => setProctored(e.target.checked)}
                  className="rounded border-slate-300 text-sky-700 focus:ring-sky-700"
                />
                <span>Enable Tab Focus Guard</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowCalculator}
                  onChange={(e) => setAllowCalculator(e.target.checked)}
                  className="rounded border-slate-300 text-sky-700 focus:ring-sky-700"
                />
                <span>Permit Scientific Calculator</span>
              </label>
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Syllabus Scope & Assessment Synopsis
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summarize the core topics, theorems, or competencies evaluated in this examination..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Question Bank */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                02. Question Bank & Scoring Key
              </h2>
              <p className="text-xs text-slate-500">
                Configure single-choice, multiple-select, or exact numerical/short-answer items with diagnostic rationales.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddQuestion('single_choice')}
                className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 text-slate-800 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Single Choice</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('multiple_select')}
                className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 text-slate-800 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Multiple Select</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('short_answer')}
                className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 text-slate-800 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Numerical / Short</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-lg p-6 space-y-5"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-900">
                      Item {String(qIdx + 1).padStart(2, '0')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {q.type === 'single_choice'
                        ? 'Single-Choice Question'
                        : q.type === 'multiple_select'
                        ? 'Multiple-Select Question'
                        : 'Numerical / Short Response'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    disabled={questions.length <= 1}
                    className="text-xs text-slate-500 hover:text-red-600 disabled:opacity-40 inline-flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Item</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Topic / Sub-Competency
                    </label>
                    <input
                      type="text"
                      value={q.topic}
                      onChange={(e) => updateQuestion(qIdx, { topic: e.target.value })}
                      placeholder="e.g. Dynamic Programming"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Point Weight
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={q.points}
                      onChange={(e) => updateQuestion(qIdx, { points: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Problem Statement / Stem
                  </label>
                  <textarea
                    rows={2}
                    value={q.prompt}
                    onChange={(e) => updateQuestion(qIdx, { prompt: e.target.value })}
                    placeholder="Enter the question prompt clearly..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Optional Code Block or Mathematical Expression (Monospace)
                  </label>
                  <textarea
                    rows={2}
                    value={q.codeSnippet || ''}
                    onChange={(e) => updateQuestion(qIdx, { codeSnippet: e.target.value })}
                    placeholder="Optional recurrence relation, pseudocode, or matrix specification..."
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-900 text-slate-100 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {q.type === 'short_answer' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Canonical Correct Answer (Exact Match, Case-Insensitive)
                      </label>
                      <input
                        type="text"
                        value={q.correctTextAnswer || ''}
                        onChange={(e) =>
                          updateQuestion(qIdx, { correctTextAnswer: e.target.value })
                        }
                        placeholder="e.g. 0.75 or 13"
                        className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Unit Label Shown to Candidate
                      </label>
                      <input
                        type="text"
                        value={q.acceptableUnits || ''}
                        onChange={(e) =>
                          updateQuestion(qIdx, { acceptableUnits: e.target.value })
                        }
                        placeholder="e.g. replicas, ratio, ms"
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Response Options (Click the left key button to mark as Correct Answer)
                    </label>
                    {q.options?.map((opt, optIdx) => {
                      const isCorrect = q.correctOptionIds?.includes(opt.id);
                      return (
                        <div key={opt.id} className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => toggleCorrectOption(qIdx, opt.id)}
                            className={`w-9 h-9 rounded-md font-mono text-xs font-semibold flex items-center justify-center border transition-colors shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                            }`}
                            title={isCorrect ? 'Marked as Correct' : 'Click to mark as Correct'}
                          >
                            {isCorrect ? <Check className="w-4 h-4" /> : opt.label}
                          </button>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${opt.label} statement...`}
                            className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Post-Submission Diagnostic Explanation
                  </label>
                  <input
                    type="text"
                    value={q.explanation}
                    onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                    placeholder="Explain why the correct answer holds so candidates can review their reasoning..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors whitespace-nowrap"
          >
            Publish Examination to Catalog
          </button>
        </div>
      </form>
    </div>
  );
};
