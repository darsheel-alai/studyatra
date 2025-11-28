import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overall"; // overall, tests, quizzes

    let query = "";
    if (type === "tests") {
      query = `
        SELECT 
          us.user_id,
          us.total_xp,
          us.tests_completed,
          us.total_test_score,
          ROW_NUMBER() OVER (ORDER BY us.total_test_score DESC, us.tests_completed DESC) as rank
        FROM user_stats us
        WHERE us.tests_completed > 0
        ORDER BY us.total_test_score DESC, us.tests_completed DESC
        LIMIT 100
      `;
    } else if (type === "quizzes") {
      query = `
        SELECT 
          us.user_id,
          us.total_xp,
          us.quizzes_completed,
          us.total_quiz_score,
          ROW_NUMBER() OVER (ORDER BY us.total_quiz_score DESC, us.quizzes_completed DESC) as rank
        FROM user_stats us
        WHERE us.quizzes_completed > 0
        ORDER BY us.total_quiz_score DESC, us.quizzes_completed DESC
        LIMIT 100
      `;
    } else {
      // Overall leaderboard based on test and quiz points combined
      query = `
        SELECT 
          us.user_id,
          us.total_xp,
          us.current_streak,
          us.longest_streak,
          us.tests_completed,
          us.quizzes_completed,
          us.total_test_score,
          us.total_quiz_score,
          (COALESCE(us.total_test_score, 0) + COALESCE(us.total_quiz_score, 0)) as total_points,
          us.tests_completed + us.quizzes_completed as total_activities,
          ROW_NUMBER() OVER (ORDER BY (COALESCE(us.total_test_score, 0) + COALESCE(us.total_quiz_score, 0)) DESC) as rank
        FROM user_stats us
        WHERE (COALESCE(us.total_test_score, 0) + COALESCE(us.total_quiz_score, 0)) > 0
        ORDER BY (COALESCE(us.total_test_score, 0) + COALESCE(us.total_quiz_score, 0)) DESC
        LIMIT 100
      `;
    }

    const result = await pool.query(query);
    
    // Get current user's rank
    let userRank = null;
    if (type === "tests") {
      const userResult = await pool.query(
        `SELECT COUNT(*) + 1 as rank
         FROM user_stats
         WHERE total_test_score > (SELECT total_test_score FROM user_stats WHERE user_id = $1)
         OR (total_test_score = (SELECT total_test_score FROM user_stats WHERE user_id = $1) 
             AND tests_completed > (SELECT tests_completed FROM user_stats WHERE user_id = $1))`,
        [userId]
      );
      userRank = parseInt(userResult.rows[0]?.rank || "0");
    } else if (type === "quizzes") {
      const userResult = await pool.query(
        `SELECT COUNT(*) + 1 as rank
         FROM user_stats
         WHERE total_quiz_score > (SELECT total_quiz_score FROM user_stats WHERE user_id = $1)
         OR (total_quiz_score = (SELECT total_quiz_score FROM user_stats WHERE user_id = $1) 
             AND quizzes_completed > (SELECT quizzes_completed FROM user_stats WHERE user_id = $1))`,
        [userId]
      );
      userRank = parseInt(userResult.rows[0]?.rank || "0");
    } else {
      // Overall rank based on combined test and quiz points
      const userResult = await pool.query(
        `SELECT COUNT(*) + 1 as rank
         FROM user_stats
         WHERE (COALESCE(total_test_score, 0) + COALESCE(total_quiz_score, 0)) > 
               (SELECT COALESCE(total_test_score, 0) + COALESCE(total_quiz_score, 0) 
                FROM user_stats WHERE user_id = $1)`,
        [userId]
      );
      userRank = parseInt(userResult.rows[0]?.rank || "0");
    }

    return NextResponse.json({
      leaderboard: result.rows,
      userRank,
      type,
    });
  } catch (error: any) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
