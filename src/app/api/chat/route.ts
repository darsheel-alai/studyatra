import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getSyllabusTopics, isOutOfSyllabus } from "./syllabus";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.error("Chat API: Unauthorized - no userId");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("Chat API: OpenAI API key not configured");
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, class: studentClass, board, conversationHistory } = body;

    console.log("Chat API: Received request", { 
      hasMessage: !!message, 
      studentClass, 
      board,
      messageLength: message?.length 
    });

    if (!message || !studentClass || !board) {
      console.error("Chat API: Missing required fields", { message: !!message, studentClass, board });
      return NextResponse.json(
        { error: `Missing required fields: ${!message ? "message" : ""} ${!studentClass ? "class" : ""} ${!board ? "board" : ""}`.trim() },
        { status: 400 }
      );
    }

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
      if (syllabusObj.note) {
        syllabusInfo += `Note: ${syllabusObj.note}\n\n`;
      }
    } else {
      syllabusInfo = `Standard ${board} Class ${studentClass} curriculum covering Mathematics, Science, and other core subjects.`;
    }

    // Build strict system prompt based on curriculum
    const systemPrompt = `You are Studyatra, an AI-powered study companion designed specifically for Indian students. You are an expert tutor trained EXCLUSIVELY on ${board} curriculum for Class ${studentClass}.

CRITICAL RULES - YOU MUST FOLLOW THESE STRICTLY:

1. SYLLABUS BOUNDARIES - YOU ARE STRICTLY LIMITED TO:
   - ONLY topics covered in ${board} Class ${studentClass} textbooks
   - ONLY concepts, formulas, and methods taught in ${board} Class ${studentClass} curriculum
   - ONLY subjects and chapters listed in the ${board} Class ${studentClass} syllabus

2. SYLLABUS TOPICS FOR ${board} CLASS ${studentClass}:
${syllabusInfo}

3. OUT-OF-SYLLABUS RESPONSE:
   - If a question is about topics NOT in the ${board} Class ${studentClass} syllabus, you MUST respond with: "I don't know. This topic is not part of the ${board} Class ${studentClass} syllabus."
   - DO NOT attempt to answer questions outside the syllabus
   - DO NOT provide explanations for topics beyond Class ${studentClass} level
   - DO NOT reference concepts from higher classes or advanced topics
   - Examples of out-of-syllabus: topics from Class ${parseInt(studentClass) + 1} or higher, advanced university-level concepts, topics not in the ${board} curriculum

4. WITHIN-SYLLABUS RESPONSES:
   - Provide clear, step-by-step explanations matching ${board} curriculum standards
   - Use language appropriate for Class ${studentClass} students
   - Reference specific ${board} textbook chapters when relevant
   - Break down complex topics into digestible parts
   - Provide real-world examples that Indian students can relate to
   - Encourage learning and understanding, not just giving answers
   - Use only formulas and methods taught in ${board} Class ${studentClass} textbooks

5. SUBJECTS COVERED (ONLY THESE):
   ${syllabus && typeof syllabus === 'object' && 'subjects' in syllabus ? (syllabus as any).subjects.join(", ") : "Mathematics, Science (Physics, Chemistry, Biology), Social Science, English"}

Remember: Your knowledge is STRICTLY LIMITED to ${board} Class ${studentClass} syllabus. If unsure whether a topic is in syllabus, respond with "I don't know. This topic is not part of the ${board} Class ${studentClass} syllabus."`;

    // Build conversation messages
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history (last 10 messages for context)
    const recentHistory = conversationHistory?.slice(-10) || [];
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }

    // Add current message
    messages.push({
      role: "user",
      content: message,
    });

    // Call OpenAI API
    console.log("Chat API: Calling OpenAI with", { model: "gpt-4o-mini", messageCount: messages.length });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

    console.log("Chat API: Successfully got response from OpenAI");
    
    return NextResponse.json({
      message: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    console.error("Error details:", {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
    });
    
    // Handle OpenAI-specific errors
    if (error?.status === 401 || error?.code === "invalid_api_key") {
      return NextResponse.json(
        { error: "Invalid OpenAI API key. Please check your API key configuration." },
        { status: 500 }
      );
    }
    
    if (error?.status === 429 || error?.code === "rate_limit_exceeded") {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    if (error?.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error. Please check the server logs for details." },
      { status: 500 }
    );
  }
}
