import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";

export type SessionPayload = { userId: string; email: string; name: string; role: string };

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, SECRET) as SessionPayload;
  } catch {
    return null;
  }
}
