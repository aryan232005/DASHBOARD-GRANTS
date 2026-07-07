import { NextRequest, NextResponse } from "next/server";
import { askGemini, rankGrantsWithGemini } from "@/lib/gemini";
import { demoGrants } from "@/lib/grants-data";
import { prisma, hasDatabase } from "@/lib/db";

// This route runs only on the server (Vercel serverless function).
// GEMINI_API_KEY is read inside lib/gemini.ts from process.env and is
// never sent to, or readable by, the browser.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body.mode ?? "chat";

   
      if (mode === "chat") {
      const { message } = body;
      if (!message) {
        return NextResponse.json({ error: "message is required" }, { status: 400 });
      }

      // Fetch real grants from your own DB and from Grants.gov,
      // so Gemini answers using actual data instead of guessing.
      const ownGrants = hasDatabase && prisma ? await prisma.grant.findMany() : demoGrants;

      const origin = req.nextUrl.origin;
      let globalGrants: any[] = [];
      try {
        const globalRes = await fetch(`${origin}/api/grants/global`);
        const globalData = await globalRes.json();
        globalGrants = globalData.grants ?? [];
      } catch {
        globalGrants = [];
      }

      const combined = [...ownGrants, ...globalGrants].map((g: any) => ({
        id: g.id,
        title: g.title,
        organization: g.organization,
        country: g.country,
        category: g.category,
        amount: g.amount,
        deadline: typeof g.deadline === "string" ? g.deadline : g.deadline?.toISOString?.() ?? "",
      }));

      const reply = await askGemini(message, undefined, combined);
      return NextResponse.json({ reply });
    }

    if (mode === "rank") {
      const { profile } = body;
      const grants = hasDatabase && prisma ? await prisma.grant.findMany() : demoGrants;
      const simplified = grants.map((g: any) => ({
        id: g.id,
        title: g.title,
        category: g.category,
        country: g.country,
        amount: g.amount,
        deadline: typeof g.deadline === "string" ? g.deadline : g.deadline.toISOString(),
      }));
      const ranked = await rankGrantsWithGemini(profile ?? "Early-stage AI SaaS startup called SmalBlu.", simplified);
      return NextResponse.json({ ranked });
    }

    return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
  } catch (err: any) {
    // Never leak the key or stack trace to the client
    console.error("Gemini route error:", err?.message);
    return NextResponse.json(
      { error: "Gemini request failed. Check GEMINI_API_KEY is configured on the server." },
      { status: 500 }
    );
  }
}
