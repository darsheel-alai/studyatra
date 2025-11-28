import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      classValue,
      board,
      subject,
      topic,
      testType,
      totalQuestions,
      correctAnswers,
      timeTaken,
    } = body;

    if (!classValue || !board || !subject || !testType || totalQuestions === undefined || correctAnswers === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    // Points for leaderboard = score percentage (0-100)
    // XP for user = score * multiplier
    const xpEarned = Math.round(score * (testType === 'test' ? 2 : 1)); // Tests give more XP
    const pointsForLeaderboard = score; // Points that count towards leaderboard

    // Save test result
    const result = await pool.query(
      `INSERT INTO test_results 
       (user_id, class_value, board, subject, topic, test_type, total_questions, correct_answers, score, xp_earned, time_taken)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        userId,
        classValue,
        board,
        subject,
        topic || null,
        testType,
        totalQuestions,
        correctAnswers,
        score,
        xpEarned,
        timeTaken || null,
      ]
    );

    // Update user stats - XP from tests/quizzes, points for leaderboard
    await pool.query(
      `INSERT INTO user_stats (user_id, total_xp, ${testType === 'test' ? 'tests_completed, total_test_score' : 'quizzes_completed, total_quiz_score'})
       VALUES ($1, $2, 1, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET total_xp = user_stats.total_xp + $2,
           ${testType === 'test' ? 'tests_completed = user_stats.tests_completed + 1, total_test_score = user_stats.total_test_score + $3' : 'quizzes_completed = user_stats.quizzes_completed + 1, total_quiz_score = user_stats.total_quiz_score + $3'},
           updated_at = CURRENT_TIMESTAMP`,
      [userId, xpEarned, pointsForLeaderboard]
    );

    return NextResponse.json({
      success: true,
      resultId: result.rows[0].id,
      score,
      xpEarned,
    });
  } catch (error: any) {
    console.error("Test submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
