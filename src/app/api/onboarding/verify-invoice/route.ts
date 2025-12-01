import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import pool, { initDatabase } from "@/lib/db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Handle PDF files - for now, we'll convert the first page to an image
    // Note: For production, you might want to use a PDF-to-image library
    if (file.type === "application/pdf") {
      return NextResponse.json(
        { error: "PDF files are not yet supported. Please upload a screenshot or image (PNG/JPG) of your invoice." },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type || "image/png";

    // Use OpenAI Vision API to extract order ID from invoice
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are analyzing an invoice from The Kid Company. Extract the order ID from this invoice. Look for fields labeled as 'Order ID', 'Order Number', 'Order #', 'Transaction ID', 'Invoice Number', or any similar field that contains an order identifier. The order ID is typically a combination of letters, numbers, and possibly hyphens or underscores. Return ONLY the order ID value without any additional text, labels, or explanations. If you cannot find a clear order ID, return exactly 'NOT_FOUND'.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    const extractedOrderId = completion.choices[0]?.message?.content?.trim() || "";

    if (!extractedOrderId || extractedOrderId === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Could not extract order ID from invoice. Please ensure the invoice is clear and from The Kid Company." },
        { status: 400 }
      );
    }

    // Clean the order ID (remove any extra text)
    const orderId = extractedOrderId.replace(/[^a-zA-Z0-9-_]/g, "");

    // Check if order ID already exists (optional: prevent duplicate registrations)
    const existingOrder = await pool.query(
      "SELECT user_id FROM onboarding WHERE order_id = $1 AND invoice_verified = TRUE AND user_id <> $2",
      [orderId, userId]
    );

    if (existingOrder.rows.length > 0) {
      return NextResponse.json(
        { error: "This order ID has already been used. Please contact support if you believe this is an error." },
        { status: 400 }
      );
    }

    // Save or update onboarding record
    await pool.query(
      `INSERT INTO onboarding (user_id, order_id, invoice_verified, updated_at)
       VALUES ($1, $2, TRUE, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET order_id = $2, invoice_verified = TRUE, updated_at = CURRENT_TIMESTAMP`,
      [userId, orderId]
    );

    return NextResponse.json({
      success: true,
      orderId: orderId,
      message: "Invoice verified successfully",
    });
  } catch (error: any) {
    console.error("Error verifying invoice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify invoice" },
      { status: 500 }
    );
  }
}
