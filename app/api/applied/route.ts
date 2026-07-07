import { NextRequest, NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/db";
import { demoApplied, demoGrants } from "@/lib/grants-data";

export async function GET() {
  if (hasDatabase && prisma) {
    const applications = await prisma.appliedGrant.findMany({
      include: { grant: true },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ applications, source: "db" });
  }

  // Demo mode: join in-memory applications with grant details
  const applications = demoApplied.map((a) => ({
    ...a,
    grant: demoGrants.find((g) => g.id === a.grantId) ?? null,
  }));
  return NextResponse.json({ applications, source: "demo-data" });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { grantId, status, notes } = body;

  if (!grantId) {
    return NextResponse.json({ error: "grantId is required" }, { status: 400 });
  }

  if (hasDatabase && prisma) {
    // NOTE: in production this should use the authenticated user's id (see lib/auth.ts)
    const demoUser = await prisma.user.findFirst();
    if (!demoUser) {
      return NextResponse.json({ error: "No user found - seed the database first." }, { status: 400 });
    }
    const application = await prisma.appliedGrant.create({
      data: { grantId, userId: demoUser.id, status: status ?? "drafting", notes },
    });
    return NextResponse.json({ application }, { status: 201 });
  }

  const newApp = {
    id: `a${demoApplied.length + 1}`,
    grantId,
    status: status ?? "drafting",
    notes: notes ?? "",
    submittedAt: status === "submitted" ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  };
  demoApplied.push(newApp as any);
  return NextResponse.json({ application: newApp }, { status: 201 });
}
