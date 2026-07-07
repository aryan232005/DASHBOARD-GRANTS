import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma, hasDatabase } from "@/lib/db";
import { signSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!hasDatabase || !prisma) {
    // Demo mode: accept any email/password so the dashboard is explorable pre-DB setup.
    const token = signSession({ userId: "demo", email, name: "Demo User", role: "admin" });
    const res = NextResponse.json({ ok: true, mode: "demo" });
    res.cookies.set("smalblu_session", token, { httpOnly: true, sameSite: "lax", path: "/" });
    return res;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signSession({ userId: user.id, email: user.email, name: user.name, role: user.role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("smalblu_session", token, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
