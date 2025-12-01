import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import pool, { initDatabase } from "@/lib/db";

let initPromise: Promise<void> | null = null;
const ensureDatabaseInitialized = async () => {
  if (!initPromise) {
    initPromise = initDatabase();
  }
  await initPromise;
};

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

    const result = await pool.query(
      "SELECT * FROM onboarding WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        onboarding_completed: false,
        invoice_verified: false,
        access_key_verified: false,
      });
    }

    const record = result.rows[0];
    return NextResponse.json({
      onboarding_completed: record.onboarding_completed || false,
      invoice_verified: record.invoice_verified || false,
      access_key_verified: record.access_key_verified || false,
      order_id: record.order_id || null,
    });
  } catch (error: any) {
    console.error("Error fetching onboarding status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch onboarding status" },
      { status: 500 }
    );
  }
}
