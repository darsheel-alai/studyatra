import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import pool, { initDatabase } from "@/lib/db";

// Initialize database on first import
let dbInitialized = false;
if (!dbInitialized) {
  initDatabase().catch(console.error);
  dbInitialized = true;
}

// GET - Fetch messages for a specific session
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
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId parameter" },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const sessionCheck = await pool.query(
      `SELECT user_id FROM chat_sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (sessionCheck.rows[0].user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `SELECT id, role, content, image_url as "imageUrl", timestamp
       FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY timestamp ASC`,
      [sessionId]
    );

    console.log(`Found ${result.rows.length} messages for session ${sessionId}`);
    console.log("Raw database rows:", result.rows);

    const messages = result.rows.map((row, index) => {
      const message = {
        id: row.id.toString(),
        role: row.role,
        content: row.content,
        imageUrl: row.imageUrl || undefined,
        timestamp: new Date(row.timestamp),
      };
      console.log(`Processing message ${index}:`, message);
      return message;
    });

    console.log("Returning messages:", messages.length, messages);

    return NextResponse.json({
      messages,
    });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Save messages for a specific session
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
    const { sessionId, messages: messagesToSave } = body;

    console.log("Saving messages - sessionId:", sessionId);
    console.log("Saving messages - count:", messagesToSave?.length || 0);
    console.log("Saving messages - data:", messagesToSave);

    if (!sessionId || !messagesToSave || !Array.isArray(messagesToSave)) {
      console.error("Missing required fields:", { sessionId: !!sessionId, messagesToSave: !!messagesToSave, isArray: Array.isArray(messagesToSave) });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const sessionCheck = await pool.query(
      `SELECT user_id FROM chat_sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (sessionCheck.rows[0].user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Delete existing messages for this session
      await client.query(
        `DELETE FROM chat_messages WHERE session_id = $1`,
        [sessionId]
      );

      // Insert new messages
      console.log(`Inserting ${messagesToSave.length} messages into database`);
      for (let i = 0; i < messagesToSave.length; i++) {
        const message = messagesToSave[i];
        // Ensure timestamp is a Date object
        let timestamp: Date;
        if (message.timestamp) {
          timestamp = message.timestamp instanceof Date 
            ? message.timestamp 
            : new Date(message.timestamp);
        } else {
          timestamp = new Date();
        }
        
        console.log(`Inserting message ${i}:`, {
          sessionId,
          role: message.role,
          content: message.content?.substring(0, 50),
          hasImage: !!message.imageUrl,
          timestamp
        });
        
        await client.query(
          `INSERT INTO chat_messages (session_id, role, content, image_url, timestamp)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            sessionId,
            message.role,
            message.content,
            message.imageUrl || null,
            timestamp,
          ]
        );
      }

      await client.query("COMMIT");
      console.log(`Successfully saved ${messagesToSave.length} messages`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      message: "Messages saved successfully",
    });
  } catch (error: any) {
    console.error("Error saving messages:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete messages for a specific session
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
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId parameter" },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const sessionCheck = await pool.query(
      `SELECT user_id FROM chat_sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (sessionCheck.rows[0].user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    await pool.query(
      `DELETE FROM chat_messages WHERE session_id = $1`,
      [sessionId]
    );

    return NextResponse.json({
      success: true,
      message: "Messages deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting messages:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
