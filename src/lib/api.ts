// Pembantu respons API berstruktur: { success, data, message }
import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./auth";
import { prisma } from "./prisma";
import type { Role } from "./enums";
import type { Guru } from "@prisma/client";

export function ok<T>(data: T, message = "OK", status = 200) {
  return NextResponse.json({ success: true, data, message }, { status });
}

export function fail(message: string, status = 400, data: unknown = null) {
  return NextResponse.json({ success: false, data, message }, { status });
}

/** Pastikan ada sesi sah; jika tidak pulangkan 401. */
export async function requireSession(): Promise<
  { session: SessionPayload } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) return { response: fail("Tidak dibenarkan (sila log masuk)", 401) };
  return { session };
}

/** Pastikan sesi sah DAN peranan dibenarkan. */
export async function requireRole(
  ...roles: Role[]
): Promise<{ session: SessionPayload } | { response: NextResponse }> {
  const result = await requireSession();
  if ("response" in result) return result;
  if (roles.length && !roles.includes(result.session.role)) {
    return { response: fail("Akses ditolak untuk peranan anda", 403) };
  }
  return result;
}

/**
 * Pastikan pengguna ialah Guru atau Admin.
 * - Guru: pulangkan rekod `guru` (untuk semakan skop seliaan).
 * - Admin: `guru` = null (akses penuh, tiada had skop).
 */
export async function requireGuruOrAdmin(): Promise<
  { session: SessionPayload; guru: Guru | null } | { response: NextResponse }
> {
  const result = await requireRole("Guru", "Admin");
  if ("response" in result) return result;
  const { session } = result;
  let guru: Guru | null = null;
  if (session.role === "Guru") {
    if (!session.guruId) return { response: fail("Profil guru tidak dijumpai", 403) };
    guru = await prisma.guru.findUnique({ where: { id: session.guruId } });
    if (!guru) return { response: fail("Profil guru tidak dijumpai", 403) };
  }
  return { session, guru };
}
