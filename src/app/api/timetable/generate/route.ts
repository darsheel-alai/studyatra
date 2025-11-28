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
    const { subjects, class: studentClass, board, preferences } = body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0 || !studentClass || !board) {
      return NextResponse.json(
        { error: "Missing required fields: subjects (array), class, board" },
        { status: 400 }
      );
    }

    // Get syllabus information
    const syllabus = getSyllabusTopics(studentClass, board);
    let syllabusInfo = "";
    subjects.forEach((subject: string) => {
      if (syllabus[subject]) {
        syllabusInfo += `\n${subject}: ${syllabus[subject].join(", ")}`;
      }
    });

    const preferencesText = preferences
      ? `\n\nStudent Preferences:\n${JSON.stringify(preferences, null, 2)}`
      : "";

    const prompt = `You are an expert educational planner. Create a comprehensive weekly study timetable for a ${studentClass}th grade student studying ${board} board curriculum.

Subjects to include: ${subjects.join(", ")}${syllabusInfo}${preferencesText}

Create a balanced weekly timetable (Monday to Sunday) with:
1. Time slots from 6:00 AM to 10:00 PM
2. Appropriate breaks between study sessions
3. Balanced distribution of subjects throughout the week
4. Time for meals, breaks, and relaxation
5. Consider optimal learning times (morning for difficult subjects, etc.)

IMPORTANT: Return ONLY valid JSON. Do not include any markdown formatting, explanations, or text outside the JSON object.

Return the timetable as a JSON object with this EXACT structure (no trailing commas, all keys and string values must be in double quotes):
{
  "monday": [
    {"time": "06:00-07:00", "subject": "Subject Name", "type": "study"},
    {"time": "07:00-08:00", "subject": "Breakfast", "type": "break"}
  ],
  "tuesday": [
    {"time": "06:00-07:00", "subject": "Subject Name", "type": "study"}
  ],
  "wednesday": [
    {"time": "06:00-07:00", "subject": "Subject Name", "type": "study"}
  ],
  "thursday": [
    {"time": "06:00-07:00", "subject": "Subject Name", "type": "study"}
  ],
  "friday": [
    {"time": "06:00-07:00", "subject": "Subject Name", "type": "study"}
  ],
  "saturday": [
    {"time": "06:00-07:00", "subject": "Subject Name", "type": "study"}
  ],
  "sunday": [
    {"time": "06:00-07:00", "subject": "Subject Name", "type": "study"}
  ]
}

Each day must be an array of objects. Each object must have:
- "time": string in format "HH:MM-HH:MM"
- "subject": string with the subject name or activity
- "type": string, one of "study", "break", or "revision"

Return ONLY the JSON object, nothing else:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert educational planner specializing in creating balanced, effective study timetables for students. You MUST return ONLY valid JSON without any markdown formatting, code blocks, or explanatory text. The response must be parseable JSON that can be directly parsed with JSON.parse().",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const generatedContent = completion.choices[0]?.message?.content || "";

    if (!generatedContent) {
      return NextResponse.json(
        { error: "Failed to generate timetable" },
        { status: 500 }
      );
    }

    // Try to parse JSON from the response
    let schedule;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonString = generatedContent;
      
      // Try to extract JSON from code blocks
      const codeBlockMatch = generatedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
      } else {
        // Try to find JSON object in the text
        const jsonMatch = generatedContent.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        }
      }

      // Clean up common JSON issues
      jsonString = jsonString
        .replace(/,\s*}/g, '}')  // Remove trailing commas before }
        .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Add quotes to unquoted keys
        .replace(/:\s*([^",\[\]{}]+)([,}\]])/g, ': "$1"$2')  // Add quotes to unquoted string values
        .replace(/:\s*([^",\[\]{}]+)([,}\]])/g, ': "$1"$2'); // Run twice for nested values

      // Try to parse
      schedule = JSON.parse(jsonString);
      
      // Validate structure
      if (!schedule || typeof schedule !== 'object') {
        throw new Error("Invalid schedule structure");
      }

      // Ensure all days are present and are arrays
      const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of requiredDays) {
        if (!Array.isArray(schedule[day])) {
          schedule[day] = [];
        }
      }
    } catch (error) {
      console.error("Error parsing generated timetable:", error);
      console.error("Generated content:", generatedContent.substring(0, 500));
      
      // Try to create a fallback schedule structure
      try {
        schedule = {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        };
        
        // Try to extract time slots from the text even if JSON is malformed
        const timePattern = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/gi;
        const subjectPattern = /(?:subject|class|topic)[:\s]+([^\n,]+)/gi;
        
        // This is a fallback - we'll return an error but log the content for debugging
        return NextResponse.json(
          { 
            error: "Failed to parse generated timetable. The AI response format was invalid. Please try again.",
            debug: process.env.NODE_ENV === 'development' ? generatedContent.substring(0, 1000) : undefined
          },
          { status: 500 }
        );
      } catch (fallbackError) {
        return NextResponse.json(
          { error: "Failed to generate timetable. Please try again." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      schedule,
      message: "Timetable generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating timetable:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
