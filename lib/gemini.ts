import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Server-only Gemini client.
 * IMPORTANT: this file must never be imported from a "use client" component.
 * It reads process.env.GEMINI_API_KEY, which Next.js only exposes to
 * server-side code (API routes / route handlers / server components) because
 * it is NOT prefixed with NEXT_PUBLIC_. The key never reaches the browser bundle.
 */

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it in .env.local (dev) or Vercel Project Settings (prod)."
    );
  }
  if (!client) client = new GoogleGenerativeAI(key);
  return client;
}

export async function askGemini(prompt: string, systemInstruction?: string) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction:
      systemInstruction ??
      "You are the SmalBlu Grant Intelligence Assistant. SmalBlu is a startup that discovers and tracks global grant funding opportunities. Be concise, cite concrete figures (amounts, deadlines) when known, and format lists with short bullet points.",
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Uses Gemini to summarize / rank a batch of grants against a startup profile,
 * returning structured JSON so the frontend can render it directly.
 */
export async function rankGrantsWithGemini(
  profile: string,
  grants: { id: string; title: string; category: string; country: string; amount: number; deadline: string }[]
) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `Startup profile: ${profile}

Grants (JSON):
${JSON.stringify(grants)}

Return ONLY a JSON array, sorted best-fit first, of objects:
{ "id": string, "fitScore": number (0-100), "reason": string (max 20 words) }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}
