import React from 'react';
import { Exam, ExamSubmission } from '../types';
import { ArrowLeft, Download, Printer, RotateCcw } from 'lucide-react';

interface SubmissionReviewProps {
  submission: ExamSubmission;
  exam: Exam | undefined;
  onBackToList: () => void;
  onRetakeExam: (exam: Exam) => void;
}

export const SubmissionReview: React.FC<SubmissionReviewProps> = ({
  submission,
  exam,
  onBackToList,
  onRetakeExam
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  };

  const handleExportTranscriptJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(submission, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `veritas_transcript_${submission.courseCode.toLowerCase()}_${submission.id}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formatUserAnswer = (qIndex: number): string => {
    if (!exam) return 'N/A';
    const q = exam.questions[qIndex];
    const evalItem = submission.evaluations.find((e) => e.questionId === q.id);
    const ans = evalItem?.userAnswer;

    if (!ans || (Array.isArray(ans) && ans.length === 0)) {
      return 'No response submitted';
    }
    if (typeof ans === 'string') {
      return ans;
    }
    if (Array.isArray(ans) && q.options) {
      return ans
        .map((optId) => {
          const found = q.options?.find((o) => o.id === optId);
          return found ? `${found.label}. ${found.text}` : optId;
        })
        .join(' | ');
    }
    return String(ans);
  };

  const formatCanonicalAnswer = (qIndex: number): string => {
    if (!exam) return 'N/A';
    const q = exam.questions[qIndex];
    if (q.type === 'short_answer') {
      return `${q.correctTextAnswer}${
        q.acceptableUnits ? ` (${q.acceptableUnits})` : ''
      }`;
    }
    if (q.options && q.correctOptionIds) {
      return q.correctOptionIds
        .map((optId) => {
          const found = q.options?.find((o) => o.id === optId);
          return found ? `${found.label}. ${found.text}` : optId;
        })
        .join(' | ');
    }
    return 'N/A';
  };

  return (
    <div className="max-w-[1160px] mx-auto px-6 py-8 space-y-8">
      {/* Top Action Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <button
          type="button"
          onClick={onBackToList}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Submissions Ledger</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportTranscriptJson}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON Transcript</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Record</span>
          </button>
          {exam && (
            <button
              type="button"
              onClick={() => onRetakeExam(exam)}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-md hover:bg-sky-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Attempt</span>
            </button>
          )}
        </div>
      </div>

      {/* Official Transcript Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-semibold text-slate-800">
                {submission.courseCode}
              </span>
              <span aria-hidden="true">·</span>
              <span>{submission.discipline}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">Record ID: {submission.id}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mt-1">
              {submission.examTitle}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Candidate: <span className="font-semibold">{submission.candidateName}</span> (
              <span className="font-mono">{submission.candidateId}</span>) · Submitted{' '}
              <span className="font-mono">{submission.submittedAt}</span>
            </p>
          </div>

          <div className="text-left md:text-right">
            <div className="text-3xl font-mono font-semibold tabular-nums text-slate-900">
              {submission.percentageScore}%
            </div>
            <div
              className={`text-xs font-mono font-semibold mt-0.5 ${
                submission.passed ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {submission.passed
                ? '● QUALIFIED / PASSED'
                : '■ BELOW PASSING THRESHOLD'}
            </div>
          </div>
        </div>

        {/* Quantitative Breakdown Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-slate-500">Raw Score</div>
            <div className="text-lg font-mono font-semibold tabular-nums text-slate-900 mt-0.5">
              {submission.earnedPoints} / {submission.totalPoints} pts
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Correct Items</div>
            <div className="text-lg font-mono font-semibold tabular-nums text-slate-900 mt-0.5">
              {submission.evaluations.filter((e) => e.isCorrect).length} /{' '}
              {submission.evaluations.length} items
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Elapsed Time</div>
            <div className="text-lg font-mono font-semibold tabular-nums text-slate-900 mt-0.5">
              {formatDuration(submission.durationTakenSeconds)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Focus Integrity Log</div>
            <div
              className={`text-lg font-mono font-semibold tabular-nums mt-0.5 ${
                submission.focusWarningsCount === 0
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}
            >
              {submission.focusWarningsCount === 0
                ? '● 0 Deviations'
                : `▲ ${submission.focusWarningsCount} Warning(s)`}
            </div>
          </div>
        </div>
      </div>

      {/* Item-by-Item Diagnostic Rubric Breakdown */}
      {exam ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Item-by-Item Rubric & Diagnostic Rationale
            </h2>
            <p className="text-xs text-slate-500">
              Review your submitted response alongside the canonical solution and mathematical explanation.
            </p>
          </div>

          <div className="space-y-4">
            {exam.questions.map((q, idx) => {
              const evalItem = submission.evaluations.find(
                (e) => e.questionId === q.id
              );
              const isCorrect = evalItem?.isCorrect ?? false;

              return (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-900">
                        Item {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{q.topic}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          isCorrect ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {isCorrect ? '● CORRECT' : '■ INCORRECT'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-900">
                        {evalItem?.earnedPoints ?? 0} / {q.points} pts
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-900 leading-relaxed">
                    {q.prompt}
                  </p>

                  {q.codeSnippet && (
                    <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-md text-xs font-mono overflow-x-auto">
                      <code>{q.codeSnippet}</code>
                    </pre>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div
                      className={`p-3.5 rounded-md border text-xs space-y-1 ${
                        isCorrect
                          ? 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                          : 'bg-red-50/50 border-red-200 text-slate-900'
                      }`}
                    >
                      <div className="font-medium text-slate-500">
                        Candidate Response:
                      </div>
                      <div className="font-mono font-medium">
                        {formatUserAnswer(idx)}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50 text-xs space-y-1">
                      <div className="font-medium text-slate-500">
                        Canonical Grading Key:
                      </div>
                      <div className="font-mono font-medium text-slate-900">
                        {formatCanonicalAnswer(idx)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    <span className="font-semibold text-slate-800">
                      Examiner Rationale:{' '}
                    </span>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-sm text-slate-600">
          Original examination specification is no longer in the catalog, but summary metrics are preserved above.
        </div>
      )}
    </div>
  );
};
