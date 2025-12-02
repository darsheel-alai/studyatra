import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

type GameType = "quick-5" | "mcq-speedrun" | "concept-blocks" | "word-sprint" | "match-pairs";

type BasePayload = {
  subject?: string;
  classValue?: string;
  board?: string;
};

const cleanJson = (text: string) => {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
};

async function callGemini(prompt: string) {
  // Use Gemini 2.5 Flash for all game generations
  const model = getGeminiModel("gemini-2.5-flash");
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) {
    throw new Error("Gemini returned empty response");
  }
  const cleaned = cleanJson(text);
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Gemini JSON parse error", cleaned);
    throw new Error("Failed to parse Gemini response");
  }
}

const getSubjectContext = (payload: BasePayload) => {
  const subject = payload.subject && payload.subject !== "All" ? payload.subject : "general knowledge";
  const classValue = payload.classValue || "class 9";
  const board = payload.board || "CBSE";
  return { subject, classValue, board };
};

async function generateQuick5(payload: BasePayload) {
  const { subject, classValue, board } = getSubjectContext(payload);
  const prompt = `You are creating a lightning MCQ round for ${subject} aimed at ${classValue} ${board} students. \nReturn JSON with 5 items using schema {"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":1}]}. \nRules: options length exactly 4, exactly one correct answer, keep questions concise, mix conceptual and factual.`;
  return callGemini(prompt);
}

async function generateMCQSpeedRun(payload: BasePayload) {
  const { subject, classValue, board } = getSubjectContext(payload);
  const prompt = `Create a high-energy MCQ speed run for ${subject} (${classValue} ${board}). \nReturn JSON schema {"questions":[{"question":"","options":["","","",""],"correctIndex":0}]} with at least 15 questions. Use varied difficulty, ensure options unique, keep answers factual.`;
  return callGemini(prompt);
}

async function generateWordSprint(payload: BasePayload) {
  const { subject } = getSubjectContext(payload);
  const prompt = `Generate synonym practice for the Word Sprint game focused on ${subject}. \nReturn JSON schema {"entries":[{"word":"","synonym":"","options":["","","",""]}]} with 12 entries. Each options array must contain the synonym exactly once and three plausible distractors. Words should be common academic vocabulary.`;
  return callGemini(prompt);
}

async function generateConceptBlocks(payload: BasePayload) {
  const { subject } = getSubjectContext(payload);
  const prompt = `Design concept categories for a falling-block sorting game about ${subject}. \nReturn JSON schema {"targetCategory":"","concepts":[{"concept":"","category":""}]} where targetCategory is one of the categories present. Provide at least 16 concept objects, each with a short concept (1-3 words) and a category name. At least half of the concepts must belong to targetCategory, the rest should be from 2-3 other categories to act as decoys.`;
  return callGemini(prompt);
}

async function generateMatchPairs(payload: BasePayload) {
  const { subject } = getSubjectContext(payload);
  const prompt = `Generate term-definition pairs for a Match the Pairs game about ${subject}.
Return JSON with schema:
{"pairs":[{"term":"...","definition":"..."}]}
Rules:
- Return 6-10 pairs
- Terms should be concise (2-5 words)
- Definitions should be 1 short sentence
- Use syllabus-aligned terminology for Indian school students.`;
  return callGemini(prompt);
}

const handlers: Record<GameType, (payload: BasePayload) => Promise<any>> = {
  "quick-5": generateQuick5,
  "mcq-speedrun": generateMCQSpeedRun,
  "concept-blocks": generateConceptBlocks,
  "word-sprint": generateWordSprint,
  "match-pairs": generateMatchPairs,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameType, subject, classValue, board } = body;

    if (!gameType) {
      return NextResponse.json({ error: "gameType is required" }, { status: 400 });
    }

    const handler = handlers[gameType as GameType];
    if (!handler) {
      return NextResponse.json({ error: "Unsupported gameType" }, { status: 400 });
    }

    const data = await handler({ subject, classValue, board });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Game generation error", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate game content" },
      { status: 500 }
    );
  }
}
