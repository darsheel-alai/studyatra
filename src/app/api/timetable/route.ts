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

// GET - Get all timetables for a user with optional filters
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

    let query = `SELECT * FROM timetables WHERE user_id = $1`;
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

    query += ` ORDER BY updated_at DESC`;

    const result = await pool.query(query, params);

    return NextResponse.json({
      timetables: result.rows,
    });
  } catch (error: any) {
    console.error("Error fetching timetables:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new timetable
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
    const { class: classValue, board, name, schedule } = body;

    if (!classValue || !board || !name || !schedule) {
      return NextResponse.json(
        { error: "Missing required fields: class, board, name, schedule" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO timetables (user_id, class_value, board, name, schedule, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, classValue, board, name, JSON.stringify(schedule)]
    );

    return NextResponse.json({
      timetable: result.rows[0],
      message: "Timetable created successfully",
    });
  } catch (error: any) {
    console.error("Error creating timetable:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing timetable
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
    const { id, name, schedule } = body;

    if (!id || !name || !schedule) {
      return NextResponse.json(
        { error: "Missing required fields: id, name, schedule" },
        { status: 400 }
      );
    }

    // Verify timetable belongs to user
    const checkResult = await pool.query(
      `SELECT user_id FROM timetables WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Timetable not found" },
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
      `UPDATE timetables 
       SET name = $1, schedule = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [name, JSON.stringify(schedule), id]
    );

    return NextResponse.json({
      timetable: result.rows[0],
      message: "Timetable updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating timetable:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a timetable
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
        { error: "Missing timetable id" },
        { status: 400 }
      );
    }

    // Verify timetable belongs to user
    const checkResult = await pool.query(
      `SELECT user_id FROM timetables WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Timetable not found" },
        { status: 404 }
      );
    }

    if (checkResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    await pool.query(`DELETE FROM timetables WHERE id = $1`, [id]);

    return NextResponse.json({
      message: "Timetable deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting timetable:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
