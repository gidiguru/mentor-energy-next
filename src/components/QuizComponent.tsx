'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Trophy, RotateCcw, Loader2, AlertCircle, HelpCircle } from 'lucide-react';

interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'multiple_select';
  question: string;
  options: string[];
  points: number;
}

interface QuizResult {
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  results: {
    questionId: string;
    correct: boolean;
    userAnswer: number | number[];
    correctAnswer: number | number[];
    explanation?: string;
  }[];
}

interface QuizComponentProps {
  pageId: string;
  title: string;
  onComplete?: (passed: boolean, score: number) => void;
}

export default function QuizComponent({ pageId, title, onComplete }: QuizComponentProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [passingScore, setPassingScore] = useState(70);
  const [previousAttempts, setPreviousAttempts] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | number[]>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch quiz data
  useEffect(() => {
    async function fetchQuiz() {
      try {
        const response = await fetch(`/api/quiz?pageId=${pageId}`);
        if (response.ok) {
          const data = await response.json();
          setQuestions(data.questions || []);
          setPassingScore(data.passingScore || 70);
          setPreviousAttempts(data.previousAttempts || 0);
          setBestScore(data.bestScore);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load quiz');
        }
      } catch (err) {
        setError('Failed to load quiz');
        console.error('Error fetching quiz:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuiz();
  }, [pageId]);

  const handleAnswerChange = (questionId: string, value: number, isMultiSelect: boolean) => {
    setAnswers(prev => {
      if (isMultiSelect) {
        const currentAnswers = (prev[questionId] as number[]) || [];
        if (currentAnswers.includes(value)) {
          return { ...prev, [questionId]: currentAnswers.filter(v => v !== value) };
        } else {
          return { ...prev, [questionId]: [...currentAnswers, value] };
        }
      } else {
        return { ...prev, [questionId]: value };
      }
    });
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unanswered = questions.filter(q => {
      const answer = answers[q.id];
      if (q.type === 'multiple_select') {
        return !answer || (Array.isArray(answer) && answer.length === 0);
      }
      return answer === undefined;
    });

    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, answers }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.result);
        setPreviousAttempts(data.attempts);
        setBestScore(data.bestScore);
        setShowResults(true);
        onComplete?.(data.result.passed, data.result.percentage);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit quiz');
      }
    } catch (err) {
      setError('Failed to submit quiz');
      console.error('Error submitting quiz:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setShowResults(false);
    setError(null);
  };

  const getProgress = () => {
    const answered = questions.filter(q => {
      const answer = answers[q.id];
      if (q.type === 'multiple_select') {
        return answer && Array.isArray(answer) && answer.length > 0;
      }
      return answer !== undefined;
    }).length;
    return { answered, total: questions.length };
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl p-8 border border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-center gap-3 text-surface-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading quiz...</span>
        </div>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl p-8 border border-surface-200 dark:border-surface-700">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl p-8 border border-surface-200 dark:border-surface-700">
        <div className="text-center">
          <HelpCircle className="w-12 h-12 text-surface-400 mx-auto mb-4" />
          <p className="text-surface-500">No quiz questions available yet.</p>
        </div>
      </div>
    );
  }

  // Show results view
  if (showResults && result) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
        {/* Results Header */}
        <div className={`p-8 text-center ${result.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
            {result.passed ? (
              <Trophy className="w-10 h-10 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            )}
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${result.passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {result.passed ? 'Congratulations!' : 'Keep Learning!'}
          </h2>
          <p className="text-surface-600 dark:text-surface-400 mb-4">
            {result.passed
              ? 'You passed the quiz successfully!'
              : `You need ${result.passingScore}% to pass. Try again!`}
          </p>
          <div className="flex items-center justify-center gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-surface-900 dark:text-white">{result.percentage}%</p>
              <p className="text-sm text-surface-500">Your Score</p>
            </div>
            <div className="h-12 w-px bg-surface-300 dark:bg-surface-600" />
            <div>
              <p className="text-4xl font-bold text-surface-900 dark:text-white">{result.score}/{result.totalPoints}</p>
              <p className="text-sm text-surface-500">Points Earned</p>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="p-6">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Question Review</h3>
          <div className="space-y-4">
            {questions.map((question, index) => {
              const questionResult = result.results.find(r => r.questionId === question.id);
              const isCorrect = questionResult?.correct;

              return (
                <div
                  key={question.id}
                  className={`p-4 rounded-lg border ${isCorrect ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                      {isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <XCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-surface-900 dark:text-white mb-2">
                        {index + 1}. {question.question}
                      </p>
                      <div className="text-sm space-y-1">
                        {question.options.map((option, optIndex) => {
                          const isUserAnswer = Array.isArray(questionResult?.userAnswer)
                            ? questionResult?.userAnswer.includes(optIndex)
                            : questionResult?.userAnswer === optIndex;
                          const isCorrectAnswer = Array.isArray(questionResult?.correctAnswer)
                            ? questionResult?.correctAnswer.includes(optIndex)
                            : questionResult?.correctAnswer === optIndex;

                          return (
                            <div
                              key={optIndex}
                              className={`px-3 py-1.5 rounded ${
                                isCorrectAnswer
                                  ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                                  : isUserAnswer
                                  ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                                  : 'text-surface-600 dark:text-surface-400'
                              }`}
                            >
                              {option}
                              {isCorrectAnswer && <span className="ml-2 text-xs">(Correct)</span>}
                              {isUserAnswer && !isCorrectAnswer && <span className="ml-2 text-xs">(Your answer)</span>}
                            </div>
                          );
                        })}
                      </div>
                      {questionResult?.explanation && (
                        <p className="mt-2 text-sm text-surface-600 dark:text-surface-400 italic">
                          {questionResult.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-surface-200 dark:border-surface-700 flex justify-center">
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Quiz taking view
  const progress = getProgress();

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      {/* Quiz Header */}
      <div className="p-6 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-white">{title}</h2>
            <p className="text-sm text-surface-500">
              {questions.length} question{questions.length !== 1 ? 's' : ''} • Pass: {passingScore}%
            </p>
          </div>
          {bestScore !== null && (
            <div className="text-right">
              <p className="text-sm text-surface-500">Best Score</p>
              <p className={`text-lg font-bold ${bestScore >= passingScore ? 'text-green-600' : 'text-surface-900 dark:text-white'}`}>
                {bestScore}%
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${(progress.answered / progress.total) * 100}%` }}
            />
          </div>
          <span className="text-sm text-surface-500">
            {progress.answered}/{progress.total}
          </span>
        </div>
      </div>

      {/* Questions */}
      <div className="p-6 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {questions.map((question, index) => (
          <div key={question.id} className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center text-sm font-medium text-surface-600 dark:text-surface-300">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium text-surface-900 dark:text-white mb-1">
                  {question.question}
                </p>
                {question.type === 'multiple_select' && (
                  <p className="text-xs text-surface-500 mb-3">Select all that apply</p>
                )}
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => {
                    const isSelected = question.type === 'multiple_select'
                      ? ((answers[question.id] as number[]) || []).includes(optIndex)
                      : answers[question.id] === optIndex;

                    return (
                      <label
                        key={optIndex}
                        className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                        }`}
                      >
                        <input
                          type={question.type === 'multiple_select' ? 'checkbox' : 'radio'}
                          name={question.id}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(question.id, optIndex, question.type === 'multiple_select')}
                          className="w-4 h-4 text-primary-600"
                        />
                        <span className="text-surface-700 dark:text-surface-300">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="p-6 border-t border-surface-200 dark:border-surface-700 flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Submit Quiz
            </>
          )}
        </button>
      </div>

      {previousAttempts > 0 && (
        <div className="px-6 pb-6 text-center text-sm text-surface-500">
          Attempt #{previousAttempts + 1}
        </div>
      )}
    </div>
  );
}
