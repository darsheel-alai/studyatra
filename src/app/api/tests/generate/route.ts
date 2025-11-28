import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getSyllabusTopics } from "@/app/api/chat/syllabus";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { classValue, board, subject, topic, testType, numQuestions } = body;

    if (!classValue || !board || !subject || !testType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get syllabus information
    const syllabus = getSyllabusTopics(classValue, board);
    let syllabusInfo = "";
    if (syllabus && typeof syllabus === 'object') {
      const syllabusObj = syllabus as any;
      
      // Try to find subject-specific topics
      const subjectKey = subject.toLowerCase().replace(/\s+/g, '');
      if (syllabusObj[subjectKey] && Array.isArray(syllabusObj[subjectKey])) {
        syllabusInfo = `${subject} Topics: ${syllabusObj[subjectKey].join(", ")}\n\n`;
      } else if (syllabusObj.math && subject.toLowerCase().includes('math')) {
        syllabusInfo = `Mathematics Topics: ${syllabusObj.math.join(", ")}\n\n`;
      } else if (syllabusObj.science && subject.toLowerCase().includes('science')) {
        syllabusInfo = `Science Topics: ${syllabusObj.science.join(", ")}\n\n`;
      } else if (syllabusObj.physics && subject.toLowerCase().includes('physics')) {
        syllabusInfo = `Physics Topics: ${syllabusObj.physics.join(", ")}\n\n`;
      } else if (syllabusObj.chemistry && subject.toLowerCase().includes('chemistry')) {
        syllabusInfo = `Chemistry Topics: ${syllabusObj.chemistry.join(", ")}\n\n`;
      } else if (syllabusObj.biology && subject.toLowerCase().includes('biology')) {
        syllabusInfo = `Biology Topics: ${syllabusObj.biology.join(", ")}\n\n`;
      } else if (syllabusObj.subjects) {
        syllabusInfo = `Available Subjects: ${syllabusObj.subjects.join(", ")}\n\n`;
      }
    }

    const questionsCount = numQuestions || (testType === 'quiz' ? 10 : 20);

    const prompt = `You are an expert ${board} Class ${classValue} ${subject} teacher. Generate exactly ${questionsCount} high-quality ${testType === 'quiz' ? 'quiz' : 'test'} questions.

Context:
- Board: ${board}
- Class: ${classValue}
- Subject: ${subject}
${topic ? `- Specific Topic: ${topic}` : ''}

${syllabusInfo ? `Syllabus Information:\n${syllabusInfo}` : ''}

CRITICAL REQUIREMENTS:
1. All questions MUST be strictly from ${board} Class ${classValue} ${subject} curriculum
${topic ? `2. ALL questions must focus on the topic: "${topic}"` : '2. Questions should cover various topics from the syllabus'}
3. Questions must be appropriate for Class ${classValue} level - not too easy, not too advanced
4. Include a mix of difficulty: 30% easy, 50% medium, 20% hard
5. Each question must have exactly 4 multiple choice options
6. Make options plausible - include common mistakes as wrong answers
7. Questions should test understanding, not just memorization
8. Use clear, concise language appropriate for Class ${classValue} students

Return ONLY a valid JSON array. No explanations, no markdown, just pure JSON:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation of why this answer is correct"
  }
]

Generate exactly ${questionsCount} questions. Return only the JSON array.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert ${board} Class ${classValue} ${subject} teacher. Generate high-quality educational questions strictly within the syllabus.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const response = completion.choices[0]?.message?.content || "";
    
    // Parse JSON from response
    let questions;
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(response);
      }
    } catch (error) {
      console.error("Failed to parse questions:", error);
      return NextResponse.json(
        { error: "Failed to generate questions. Please try again." },
        { status: 500 }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Invalid questions format" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      questions: questions.slice(0, questionsCount),
      metadata: {
        classValue,
        board,
        subject,
        topic: topic || null,
        testType,
        numQuestions: questions.length,
      },
    });
  } catch (error: any) {
    console.error("Test generation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
