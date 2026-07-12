// ===========================================================================
//  Auth core — SELAMAT untuk runtime edge (proxy.ts).
//  Hanya `jose` (JWT) + util IC. TIADA bcrypt / next/headers di sini.
// ===========================================================================
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { Role, SubRole } from "./enums";

export const SESSION_COOKIE = "ekoko_session";

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET tidak ditetapkan / terlalu pendek. Sila set dalam .env");
  }
  return new TextEncoder().encode(s);
}

export interface SessionPayload extends JWTPayload {
  userId: string;
  role: Role;
  subRole?: SubRole;
  nama: string;
  pelajarId?: string | null;
  guruId?: string | null;
  jawatanGuru?: string | null;
  mustChangePw?: boolean;
}

export async function signSession(
  payload: Omit<SessionPayload, keyof JWTPayload>
): Promise<string> {
  const expires = process.env.JWT_EXPIRES_IN || "8h";
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(secret());
}

export async function verifySession(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

// --- No. IC ---
export function normalizeIC(ic: string): string {
  return String(ic).replace(/[^0-9]/g, "");
}
export function isValidIC(ic: string): boolean {
  return /^\d{12}$/.test(normalizeIC(ic));
}
