import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT * FROM user_stats WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Initialize user stats
      await pool.query(
        `INSERT INTO user_stats (user_id) VALUES ($1)`,
        [userId]
      );
    return NextResponse.json({
      current_streak: 0,
      longest_streak: 0,
      games_played_today: 0,
      tests_completed: 0,
      quizzes_completed: 0,
      total_xp: 0, // XP from tests/quizzes only
    });
    }

    const stats = result.rows[0];
    const today = new Date().toISOString().split('T')[0];
    const lastGameDate = stats.last_game_date ? new Date(stats.last_game_date).toISOString().split('T')[0] : null;

    // Reset daily games if it's a new day
    if (lastGameDate !== today) {
      await pool.query(
        `UPDATE user_stats SET games_played_today = 0, last_game_date = $1 WHERE user_id = $2`,
        [today, userId]
      );
      stats.games_played_today = 0;
    }

    return NextResponse.json({
      current_streak: stats.current_streak || 0,
      longest_streak: stats.longest_streak || 0,
      games_played_today: stats.games_played_today || 0,
      tests_completed: stats.tests_completed || 0,
      quizzes_completed: stats.quizzes_completed || 0,
      total_xp: stats.total_xp || 0, // XP from tests/quizzes only
    });
  } catch (error: any) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { gameId, testResult } = body;

    const today = new Date().toISOString().split('T')[0];

    // Get current stats
    const statsResult = await pool.query(
      `SELECT * FROM user_stats WHERE user_id = $1`,
      [userId]
    );

    if (statsResult.rows.length === 0) {
      await pool.query(
        `INSERT INTO user_stats (user_id, last_activity_date, last_game_date) 
         VALUES ($1, $2, $2)`,
        [userId, today]
      );
    } else {
      const stats = statsResult.rows[0];
      const lastActivityDate = stats.last_activity_date 
        ? new Date(stats.last_activity_date).toISOString().split('T')[0] 
        : null;

      // Calculate streak (only for games, not tests)
      let newStreak = stats.current_streak || 0;
      if (gameId) {
        // Only update streak for games
        if (lastActivityDate === today) {
          // Already played today, keep current streak
          newStreak = stats.current_streak || 0;
        } else if (lastActivityDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastActivityDate === yesterdayStr) {
            // Consecutive day - increase streak
            newStreak = (stats.current_streak || 0) + 1;
          } else {
            // Streak broken - reset to 1
            newStreak = 1;
          }
        } else {
          // First time playing - start streak
          newStreak = 1;
        }
      } else {
        // Keep existing streak if not a game
        newStreak = stats.current_streak || 0;
      }

      const longestStreak = Math.max(newStreak, stats.longest_streak || 0);
      const gamesToday = gameId ? (stats.games_played_today || 0) + 1 : stats.games_played_today || 0;

      await pool.query(
        `UPDATE user_stats 
         SET current_streak = $1, 
             longest_streak = $2,
             last_activity_date = CASE WHEN $3 = true THEN $4 ELSE last_activity_date END,
             games_played_today = $5,
             last_game_date = CASE WHEN $3 = true THEN $4 ELSE last_game_date END,
             tests_completed = CASE WHEN $6 = true THEN tests_completed + 1 ELSE tests_completed END,
             quizzes_completed = CASE WHEN $7 = true THEN quizzes_completed + 1 ELSE quizzes_completed END,
             total_test_score = CASE WHEN $8 IS NOT NULL THEN total_test_score + $8 ELSE total_test_score END,
             total_quiz_score = CASE WHEN $9 IS NOT NULL THEN total_quiz_score + $9 ELSE total_quiz_score END,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $10`,
        [
          newStreak,
          longestStreak,
          !!gameId, // Only update activity date for games
          today,
          gamesToday,
          testResult?.type === 'test',
          testResult?.type === 'quiz',
          testResult?.score || null,
          testResult?.score || null,
          userId
        ]
      );

      // Record game play if gameId provided (no XP tracking)
      if (gameId) {
        await pool.query(
          `INSERT INTO daily_game_plays (user_id, game_id, played_date, xp_earned)
           VALUES ($1, $2, $3, 0)
           ON CONFLICT (user_id, game_id, played_date) DO NOTHING`,
          [userId, gameId, today]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Stats update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
