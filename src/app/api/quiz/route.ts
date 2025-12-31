import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, sectionPages, userPageProgress, eq, and } from '@/lib/db';

// Quiz question types
export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'multiple_select';
  question: string;
  options: string[];
  correctAnswer: number | number[]; // Index(es) of correct option(s)
  explanation?: string;
  points?: number;
}

export interface QuizSubmission {
  pageId: string;
  answers: Record<string, number | number[]>; // questionId -> selected answer(s)
}

export interface QuizResult {
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

// GET /api/quiz?pageId=xxx - Get quiz questions for a page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    const database = db();

    // Get the page with quiz questions
    const page = await database.query.sectionPages.findFirst({
      where: eq(sectionPages.id, pageId),
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (page.pageType !== 'quiz') {
      return NextResponse.json({ error: 'This page is not a quiz' }, { status: 400 });
    }

    const questions = (page.quizQuestions as QuizQuestion[]) || [];

    // Strip correct answers from the response (don't send to client before submission)
    const clientQuestions = questions.map(q => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
      points: q.points || 1,
    }));

    // Get user's previous attempts if authenticated
    let previousAttempts = 0;
    let bestScore: number | null = null;

    const { userId: clerkId } = await auth();
    if (clerkId) {
      const user = await database.query.users.findFirst({
        where: eq(users.clerkId, clerkId),
      });

      if (user) {
        const progress = await database.query.userPageProgress.findFirst({
          where: and(
            eq(userPageProgress.userId, user.id),
            eq(userPageProgress.pageId, pageId),
          ),
        });

        if (progress) {
          previousAttempts = progress.quizAttempts;
          bestScore = progress.quizScore;
        }
      }
    }

    return NextResponse.json({
      questions: clientQuestions,
      passingScore: page.passingScore || 70,
      previousAttempts,
      bestScore,
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
  }
}

// POST /api/quiz - Submit quiz answers
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, answers } = body as QuizSubmission;

    if (!pageId || !answers) {
      return NextResponse.json({ error: 'pageId and answers are required' }, { status: 400 });
    }

    const database = db();

    // Get user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the quiz page
    const page = await database.query.sectionPages.findFirst({
      where: eq(sectionPages.id, pageId),
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (page.pageType !== 'quiz') {
      return NextResponse.json({ error: 'This page is not a quiz' }, { status: 400 });
    }

    const questions = (page.quizQuestions as QuizQuestion[]) || [];
    const passingScore = page.passingScore || 70;

    // Grade the quiz
    let earnedPoints = 0;
    let totalPoints = 0;
    const results: QuizResult['results'] = [];

    for (const question of questions) {
      const points = question.points || 1;
      totalPoints += points;

      const userAnswer = answers[question.id];
      let correct = false;

      if (question.type === 'multiple_select') {
        // For multiple select, check if arrays match
        const correctArr = Array.isArray(question.correctAnswer)
          ? question.correctAnswer.sort()
          : [question.correctAnswer];
        const userArr = Array.isArray(userAnswer)
          ? userAnswer.sort()
          : userAnswer !== undefined ? [userAnswer] : [];

        correct = correctArr.length === userArr.length &&
          correctArr.every((val, idx) => val === userArr[idx]);
      } else {
        // For single answer questions
        const correctVal = Array.isArray(question.correctAnswer)
          ? question.correctAnswer[0]
          : question.correctAnswer;
        correct = userAnswer === correctVal;
      }

      if (correct) {
        earnedPoints += points;
      }

      results.push({
        questionId: question.id,
        correct,
        userAnswer: userAnswer !== undefined ? userAnswer : -1,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });
    }

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = percentage >= passingScore;

    // Get existing progress
    const existingProgress = await database.query.userPageProgress.findFirst({
      where: and(
        eq(userPageProgress.userId, user.id),
        eq(userPageProgress.pageId, pageId),
      ),
    });

    const newAttempts = (existingProgress?.quizAttempts || 0) + 1;
    // Keep the best score
    const newScore = existingProgress?.quizScore
      ? Math.max(existingProgress.quizScore, percentage)
      : percentage;

    // Update or create progress
    if (existingProgress) {
      await database
        .update(userPageProgress)
        .set({
          quizScore: newScore,
          quizAttempts: newAttempts,
          quizAnswers: answers,
          isCompleted: passed || existingProgress.isCompleted,
          isViewed: true,
          completedAt: passed ? new Date() : existingProgress.completedAt,
          updatedAt: new Date(),
        })
        .where(eq(userPageProgress.id, existingProgress.id));
    } else {
      await database.insert(userPageProgress).values({
        userId: user.id,
        pageId: pageId,
        quizScore: newScore,
        quizAttempts: newAttempts,
        quizAnswers: answers,
        isCompleted: passed,
        isViewed: true,
        completedAt: passed ? new Date() : null,
      });
    }

    const result: QuizResult = {
      score: earnedPoints,
      totalPoints,
      percentage,
      passed,
      passingScore,
      results,
    };

    return NextResponse.json({ result, attempts: newAttempts, bestScore: newScore });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}
