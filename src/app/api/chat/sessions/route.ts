import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import pool, { initDatabase } from "@/lib/db";

// Initialize database on first import
let dbInitialized = false;
if (!dbInitialized) {
  initDatabase().catch(console.error);
  dbInitialized = true;
}

// GET - Fetch all sessions for a user's class/board
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const classValue = searchParams.get("class");
    const board = searchParams.get("board");

    if (!classValue || !board) {
      return NextResponse.json(
        { error: "Missing class or board parameter" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT id, title, last_message as "lastMessage", message_count as "messageCount", 
       created_at as "timestamp", updated_at as "updatedAt"
       FROM chat_sessions 
       WHERE user_id = $1 AND class_value = $2 AND board = $3 
       ORDER BY updated_at DESC`,
      [userId, classValue, board]
    );

    const sessions = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      lastMessage: row.lastMessage || "",
      messageCount: row.messageCount || 0,
      timestamp: new Date(row.timestamp),
    }));

    return NextResponse.json({
      sessions,
    });
  } catch (error: any) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create or update sessions
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { class: classValue, board, sessions: sessionsToSave } = body;

    if (!classValue || !board || !sessionsToSave || !Array.isArray(sessionsToSave)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use transaction to ensure data consistency
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Delete existing sessions for this user/class/board combination
      await client.query(
        `DELETE FROM chat_sessions WHERE user_id = $1 AND class_value = $2 AND board = $3`,
        [userId, classValue, board]
      );

      // Insert new sessions
      for (const session of sessionsToSave) {
        await client.query(
          `INSERT INTO chat_sessions 
           (id, user_id, class_value, board, title, last_message, message_count, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           last_message = EXCLUDED.last_message,
           message_count = EXCLUDED.message_count,
           updated_at = EXCLUDED.updated_at`,
          [
            session.id,
            userId,
            classValue,
            board,
            session.title || "New Chat",
            session.lastMessage || "",
            session.messageCount || 0,
            session.timestamp ? new Date(session.timestamp) : new Date(),
            new Date(),
          ]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      message: "Sessions saved successfully",
    });
  } catch (error: any) {
    console.error("Error saving sessions:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific session
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const classValue = searchParams.get("class");
    const board = searchParams.get("board");
    const sessionId = searchParams.get("sessionId");

    if (!classValue || !board || !sessionId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Check if session exists and belongs to user
    const sessionCheck = await pool.query(
      `SELECT id FROM chat_sessions 
       WHERE id = $1 AND user_id = $2 AND class_value = $3 AND board = $4`,
      [sessionId, userId, classValue, board]
    );

    if (sessionCheck.rows.length === 0) {
      console.error("Session not found for deletion:", { sessionId, userId, classValue, board });
      // Still return success to allow frontend to remove from UI
      // This handles cases where session might not exist in DB but exists in frontend
      return NextResponse.json({
        success: true,
        message: "Session not found in database (may have been already deleted)",
      });
    }

    // Delete messages first (CASCADE should handle this, but being explicit)
    await pool.query(
      `DELETE FROM chat_messages WHERE session_id = $1`,
      [sessionId]
    );

    // Then delete the session
    const result = await pool.query(
      `DELETE FROM chat_sessions WHERE id = $1`,
      [sessionId]
    );

    return NextResponse.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting session:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
    });
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
