import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyC1Y4S_BfH869GTxf4_-AF87bJk3UnWnXQ";

if (!GEMINI_API_KEY) {
  throw new Error("Missing Gemini API key. Set GEMINI_API_KEY in your environment.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export function getGeminiModel(model = "gemini-1.5-flash") {
  return genAI.getGenerativeModel({ model });
}
