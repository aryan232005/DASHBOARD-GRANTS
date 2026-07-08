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

export async function askGemini(
  prompt: string,
  systemInstruction?: string,
  grantsContext?: any[]
) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
   tools: [{ googleSearch: {} }] as any,
    systemInstruction:
      systemInstruction ??
      "You are the SmalBlu Grant Intelligence Assistant. SmalBlu is a startup that discovers and tracks global grant funding opportunities. You have access to live Google Search — use it whenever the user asks about grants, deadlines, or funding in any country or region, so your answer reflects real, current information from the web instead of guessing. Always mention where the information came from. Be concise, cite concrete figures (amounts, deadlines) when known, and format lists with short bullet points.",
  });

  const fullPrompt = grantsContext && grantsContext.length > 0
    ? `Real grants data (JSON):\n${JSON.stringify(grantsContext)}\n\nUser question: ${prompt}`
    : prompt;

  const result = await model.generateContent(fullPrompt);
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

  // Step 1: live grounded search for fresh, real grants worldwide that
  // match this startup profile (plain text — JSON mode isn't allowed
  // together with search tools on Gemini's API).
  const searchModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} }] as any,
  });
  const searchPrompt = `Search the web for 3-5 REAL, currently open grant or funding opportunities anywhere in the world that would genuinely fit this startup profile: "${profile}". For each one, list: title, organization, country, approximate amount if known, deadline if known, and a source URL. Keep it brief.`;
  const searchResult = await searchModel.generateContent(searchPrompt);
  const liveFindings = searchResult.response.text();

  // Step 2: ordinary JSON-mode call that ranks BOTH your tracked grants
  // AND what was just found live on the web, into one unified list.
  const jsonModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });
  const rankPrompt = `Startup profile: ${profile}

Tracked grants (JSON):
${JSON.stringify(grants)}

Additional grants found via live web search just now:
${liveFindings}

Return ONLY a JSON array, sorted best-fit first, of objects:
{ "id": string, "title": string, "organization": string, "country": string, "amount": number, "deadline": string, "fitScore": number (0-100), "reason": string (max 20 words), "source": "tracked" | "live-search" }

For tracked grants, reuse their existing "id". For newly found live-search grants, generate a short id like "live-1", "live-2", etc.`;
  const result = await jsonModel.generateContent(rankPrompt);
  const text = result.response.text();
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}