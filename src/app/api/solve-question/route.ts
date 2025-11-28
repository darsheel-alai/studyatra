import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getSyllabusTopics } from "../chat/syllabus";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
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
    const image = formData.get("image") as File;
    const studentClass = formData.get("class") as string;
    const board = formData.get("board") as string;
    const question = formData.get("question") as string | null;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Validate image type
    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image." },
        { status: 400 }
      );
    }

    // Validate image size (max 10MB)
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size too large. Please upload an image smaller than 10MB." },
        { status: 400 }
      );
    }

    // Convert image to base64
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const dataUrl = `data:${image.type};base64,${base64Image}`;

    // Get syllabus information
    const syllabus = getSyllabusTopics(studentClass, board);
    let syllabusInfo = "";
    if (syllabus && typeof syllabus === 'object') {
      const syllabusObj = syllabus as any;
      if (syllabusObj.subjects) {
        syllabusInfo += `Subjects: ${syllabusObj.subjects.join(", ")}\n\n`;
      }
      if (syllabusObj.math) {
        syllabusInfo += `Mathematics Topics: ${syllabusObj.math.join(", ")}\n\n`;
      }
      if (syllabusObj.science) {
        syllabusInfo += `Science Topics: ${syllabusObj.science.join(", ")}\n\n`;
      }
      if (syllabusObj.physics) {
        syllabusInfo += `Physics Topics: ${syllabusObj.physics.join(", ")}\n\n`;
      }
      if (syllabusObj.chemistry) {
        syllabusInfo += `Chemistry Topics: ${syllabusObj.chemistry.join(", ")}\n\n`;
      }
      if (syllabusObj.biology) {
        syllabusInfo += `Biology Topics: ${syllabusObj.biology.join(", ")}\n\n`;
      }
    } else {
      syllabusInfo = `Standard ${board} Class ${studentClass} curriculum covering Mathematics, Science, and other core subjects.`;
    }

    // Build strict system prompt
    const systemPrompt = `You are Studyatra, an AI-powered study companion for Indian students. You are an expert tutor trained EXCLUSIVELY on ${board} curriculum for Class ${studentClass}.

Your task is to analyze images of academic questions and provide detailed, step-by-step solutions.

CRITICAL RULES - YOU MUST FOLLOW THESE STRICTLY:

1. SYLLABUS BOUNDARIES - YOU ARE STRICTLY LIMITED TO:
   - ONLY topics covered in ${board} Class ${studentClass} textbooks
   - ONLY concepts, formulas, and methods taught in ${board} Class ${studentClass} curriculum
   - ONLY subjects and chapters listed in the ${board} Class ${studentClass} syllabus

2. SYLLABUS TOPICS FOR ${board} CLASS ${studentClass}:
${syllabusInfo}

3. OUT-OF-SYLLABUS RESPONSE:
   - If the question in the image is about topics NOT in the ${board} Class ${studentClass} syllabus, you MUST respond with: "I don't know. This question is not part of the ${board} Class ${studentClass} syllabus."
   - DO NOT attempt to solve questions outside the syllabus
   - DO NOT provide solutions for topics beyond Class ${studentClass} level
   - DO NOT use methods or formulas from higher classes

4. WITHIN-SYLLABUS SOLUTIONS:
   - Provide clear, step-by-step solutions matching ${board} curriculum standards
   - Use language appropriate for Class ${studentClass} students
   - Show all working steps, not just the final answer
   - Explain the reasoning behind each step
   - Use ONLY formulas and methods from ${board} Class ${studentClass} textbooks
   - If the image contains a math problem, show calculations clearly
   - If it's a science question, explain concepts thoroughly
   - Format your response with clear step numbers and explanations
   - Be encouraging and educational

Remember: Your knowledge is STRICTLY LIMITED to ${board} Class ${studentClass} syllabus. If unsure whether a question is in syllabus, respond with "I don't know. This question is not part of the ${board} Class ${studentClass} syllabus."`;

    // Build user prompt
    let userPrompt = `Please analyze this image and provide a detailed step-by-step solution following ${board} Class ${studentClass} curriculum standards.`;
    
    if (question) {
      userPrompt += `\n\nAdditional context from the student: "${question}"`;
    }

    userPrompt += `\n\nProvide a complete solution with:\n1. Understanding the problem\n2. Given information\n3. Step-by-step solution\n4. Final answer\n5. Verification (if applicable)`;

    // Call OpenAI Vision API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const solution = completion.choices[0]?.message?.content || "I apologize, but I couldn't analyze the image. Please ensure the image is clear and try again.";

    return NextResponse.json({
      solution: solution,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Solve question API error:", error);
    
    // Handle OpenAI-specific errors
    if (error?.status === 401) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 500 }
      );
    }
    
    if (error?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
