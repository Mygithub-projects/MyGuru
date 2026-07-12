// ===========================================================================
//  Auth (runtime Node sahaja) — bcrypt + cookie helpers.
//  Untuk proxy/edge gunakan "./auth-core" sahaja.
// ===========================================================================
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./auth-core";

export * from "./auth-core";

// --- Kata laluan (bcrypt — runtime Node) ---
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// --- Helper cookie (Next 16: cookies() adalah async) ---
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Baca sesi semasa dari cookie (Server Components / Route Handlers). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}
