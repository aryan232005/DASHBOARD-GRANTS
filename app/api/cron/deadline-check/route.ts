import { NextRequest, NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/db";
import { demoGrants, demoApplied } from "@/lib/grants-data";

// Triggered by Vercel Cron (see vercel.json). Vercel's serverless functions
// are stateless/ephemeral, so traditional node-cron/setInterval schedulers
// don't work reliably in production - Vercel Cron hitting this route on a
// schedule is the supported equivalent.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const grants = hasDatabase && prisma ? await prisma.grant.findMany() : demoGrants;
  const applied = hasDatabase && prisma ? await prisma.appliedGrant.findMany() : demoApplied;

  const appliedGrantIds = new Set(applied.map((a: any) => a.grantId));
  const now = Date.now();
  const soon = 1000 * 60 * 60 * 24 * 7; // 7 days

  const upcoming = grants.filter((g: any) => {
    const deadline = new Date(g.deadline).getTime();
    return deadline - now > 0 && deadline - now < soon && appliedGrantIds.has(g.id);
  });

  // In production: send via SendGrid here using process.env.SENDGRID_API_KEY
  // (kept server-side only, same as the Gemini key).
  console.log(`[SmalBlu cron] ${upcoming.length} application deadline(s) within 7 days.`);

  return NextResponse.json({ checked: grants.length, upcomingDeadlines: upcoming.length });
}
