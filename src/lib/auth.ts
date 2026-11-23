// ===========================================================================
//  Auth (runtime Node sahaja) — bcrypt + cookie helpers.
//  Untuk proxy/edge gunakan "./auth-core" sahaja.
// ===========================================================================
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./prisma";
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

/**
 * Patutkah cookie sesi ditanda `Secure`?
 *
 * Lalai: ya dalam produksi. Tetapi pelayar MEMBUANG cookie `Secure` yang
 * datang dari origin bukan-HTTPS (secara senyap, tiada ralat) — jadi bina
 * produksi yang dilayan atas `http://` biasa, mis. self-host pada IP tanpa
 * TLS, akan sentiasa terpelanting balik ke /login walaupun kata laluan betul.
 *
 * Set `COOKIE_SECURE="false"` pada pemasangan sedemikian. Ambil perhatian ini
 * bermakna token sesi bergerak sebagai teks jelas — hanya sesuai untuk LAN
 * tertutup atau ujian, bukan produksi yang terdedah ke Internet.
 */
function cookieSecure(): boolean {
  const flag = process.env.COOKIE_SECURE;
  if (flag !== undefined) return flag === "true";
  return process.env.NODE_ENV === "production";
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Baca sesi semasa dari cookie (Server Components / Route Handlers).
 *
 * Bagi pelajar, status pengesahan butiran dibaca TERUS dari DB setiap
 * permintaan (bukan dari JWT) supaya pengesahan guru berkuat kuasa serta-merta
 * tanpa log masuk semula. Selagi butiran belum disahkan Ketua GP/Penolong Ketua GP,
 * SU/NSU diturunkan ke "Pelajar" — tiada akses menu/API Setiausaha.
 */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "Pelajar" || !session.pelajarId) return session;

  const p = await prisma.pelajar.findUnique({
    where: { id: session.pelajarId },
    select: { statusButiran: true },
  });
  const disahkan = p?.statusButiran === "Approved";
  const out: SessionPayload = { ...session, butiranDisahkan: disahkan };
  if (!disahkan && (session.subRole === "SU" || session.subRole === "NSU")) {
    out.subRoleTertangguh = session.subRole;
    out.subRole = "Pelajar";
  }
  return out;
});
