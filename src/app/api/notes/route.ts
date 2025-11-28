import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import pool, { initDatabase } from "@/lib/db";

// Initialize database on first import
let dbInitialized = false;
let initPromise: Promise<void> | null = null;

async function ensureDatabaseInitialized() {
  if (!dbInitialized) {
    if (!initPromise) {
      initPromise = initDatabase().catch((error) => {
        console.error("Database initialization error:", error);
        throw error;
      });
    }
    await initPromise;
    dbInitialized = true;
  }
}

// GET - Get all notes for a user with optional filters
export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
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
    const subject = searchParams.get("subject");
    const search = searchParams.get("search");

    let query = `SELECT * FROM notes WHERE user_id = $1`;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (classValue) {
      query += ` AND class_value = $${paramIndex}`;
      params.push(classValue);
      paramIndex++;
    }

    if (board) {
      query += ` AND board = $${paramIndex}`;
      params.push(board);
      paramIndex++;
    }

    if (subject) {
      query += ` AND subject = $${paramIndex}`;
      params.push(subject);
      paramIndex++;
    }

    if (search) {
      query += ` AND (topic ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY updated_at DESC`;

    const result = await pool.query(query, params);

    return NextResponse.json({
      notes: result.rows,
    });
  } catch (error: any) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new note
export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { class: classValue, board, subject, topic, content } = body;

    if (!classValue || !board || !topic || !content) {
      return NextResponse.json(
        { error: "Missing required fields: class, board, topic, content" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO notes (user_id, class_value, board, subject, topic, content, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, classValue, board, subject || null, topic, content]
    );

    return NextResponse.json({
      note: result.rows[0],
      message: "Note created successfully",
    });
  } catch (error: any) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing note
export async function PUT(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, subject, topic, content } = body;

    if (!id || !topic || !content) {
      return NextResponse.json(
        { error: "Missing required fields: id, topic, content" },
        { status: 400 }
      );
    }

    // Verify note belongs to user
    const checkResult = await pool.query(
      `SELECT user_id FROM notes WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    if (checkResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `UPDATE notes 
       SET subject = $1, topic = $2, content = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [subject || null, topic, content, id]
    );

    return NextResponse.json({
      note: result.rows[0],
      message: "Note updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a note
export async function DELETE(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing note id" },
        { status: 400 }
      );
    }

    // Verify note belongs to user
    const checkResult = await pool.query(
      `SELECT user_id FROM notes WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    if (checkResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    await pool.query(`DELETE FROM notes WHERE id = $1`, [id]);

    return NextResponse.json({
      message: "Note deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
