import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import pool, { initDatabase } from "@/lib/db";

// The access key that all users will receive (same for everyone)
// You can set this via environment variable or hardcode it
const VALID_ACCESS_KEY = process.env.ONBOARDING_ACCESS_KEY || "A3dF9xQ2LpW7VzY1SrTiC8BkZ0GmXHu4";

let initPromise: Promise<void> | null = null;
const ensureDatabaseInitialized = async () => {
  if (!initPromise) {
    initPromise = initDatabase();
  }
  await initPromise;
};

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
    const { accessKey } = body;

    if (!accessKey) {
      return NextResponse.json(
        { error: "Access key is required" },
        { status: 400 }
      );
    }

    // Check if invoice is verified first
    const onboardingRecord = await pool.query(
      "SELECT invoice_verified FROM onboarding WHERE user_id = $1",
      [userId]
    );

    if (onboardingRecord.rows.length === 0 || !onboardingRecord.rows[0].invoice_verified) {
      return NextResponse.json(
        { error: "Please verify your invoice first" },
        { status: 400 }
      );
    }

    // Verify access key
    if (accessKey.trim() !== VALID_ACCESS_KEY) {
      return NextResponse.json(
        { error: "Invalid access key. Please check the .txt file you received after payment." },
        { status: 400 }
      );
    }

    // Update onboarding record
    await pool.query(
      `UPDATE onboarding 
       SET access_key_verified = TRUE, 
           onboarding_completed = TRUE,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: "Access key verified successfully. Welcome to Studyatra!",
    });
  } catch (error: any) {
    console.error("Error verifying access key:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify access key" },
      { status: 500 }
    );
  }
}
