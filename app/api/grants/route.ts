import { NextRequest, NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/db";
import { demoGrants } from "@/lib/grants-data";
import { cacheGet, cacheSet } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const country = searchParams.get("country");

  const cacheKey = `grants:${category ?? "all"}:${country ?? "all"}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json({ grants: JSON.parse(cached), source: hasDatabase ? "db-cache" : "memory-cache" });
  }

  let grants;
  if (hasDatabase && prisma) {
    grants = await prisma.grant.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(country ? { country } : {}),
      },
      orderBy: { deadline: "asc" },
    });
  } else {
    grants = demoGrants.filter(
      (g) => (!category || g.category === category) && (!country || g.country === country)
    );
  }

  await cacheSet(cacheKey, JSON.stringify(grants), 120);
  return NextResponse.json({ grants, source: hasDatabase ? "db" : "demo-data" });
}

export async function POST(req: NextRequest) {
  if (!hasDatabase || !prisma) {
    return NextResponse.json(
      { error: "Creating grants requires DATABASE_URL to be configured." },
      { status: 501 }
    );
  }
  const body = await req.json();
  const grant = await prisma.grant.create({ data: body });
  return NextResponse.json({ grant }, { status: 201 });
}
