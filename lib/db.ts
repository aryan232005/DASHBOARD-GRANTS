import { PrismaClient } from "@prisma/client";

// Prevent hot-reload from creating many Prisma instances in dev
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const hasDatabase = Boolean(process.env.DATABASE_URL);

export const prisma: PrismaClient | null = hasDatabase
  ? global.__prisma ?? new PrismaClient()
  : null;

if (hasDatabase && process.env.NODE_ENV !== "production") {
  global.__prisma = prisma ?? undefined;
}
