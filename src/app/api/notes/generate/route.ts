import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getSyllabusTopics } from "../../chat/syllabus";

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

    const body = await request.json();
    const { topic, subject, class: studentClass, board } = body;

    if (!topic || !studentClass || !board) {
      return NextResponse.json(
        { error: "Missing required fields: topic, class, board" },
        { status: 400 }
      );
    }

    // Get syllabus information
    const syllabus = getSyllabusTopics(studentClass, board);
    let syllabusInfo = "";
    if (subject && syllabus[subject]) {
      syllabusInfo = `\n\nRelevant syllabus topics for ${subject}:\n${syllabus[subject].join("\n")}`;
    }

    const prompt = `You are an expert educational content creator. Create comprehensive, well-structured study notes for a ${studentClass}th grade student studying ${board} board curriculum.

Topic: ${topic}
${subject ? `Subject: ${subject}` : ""}${syllabusInfo}

Please create detailed notes that include:
1. Key concepts and definitions
2. Important formulas/theorems (if applicable)
3. Examples and explanations
4. Summary points
5. Important points to remember

Format the notes in a clear, easy-to-read structure. Use headings, bullet points, and numbered lists where appropriate. Make the content engaging and easy to understand for a ${studentClass}th grade student.

Generate comprehensive notes now:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator specializing in creating clear, comprehensive study notes for students.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const generatedContent = completion.choices[0]?.message?.content || "";

    if (!generatedContent) {
      return NextResponse.json(
        { error: "Failed to generate notes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content: generatedContent,
      message: "Notes generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating notes:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
