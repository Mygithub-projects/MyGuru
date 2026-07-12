import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, ok, fail } from "@/lib/api";
import {
  verifyPassword,
  hashPassword,
  signSession,
  setSessionCookie,
} from "@/lib/auth";
import type { Role, SubRole } from "@/lib/enums";

const schema = z.object({
  lama: z.string().min(1, "Masukkan kata laluan semasa"),
  baru: z.string().min(6, "Kata laluan baru sekurang-kurangnya 6 aksara"),
});

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { pelajar: true, guru: true },
  });
  if (!user) return fail("Pengguna tidak dijumpai", 404);

  const valid = await verifyPassword(parsed.data.lama, user.passwordHash);
  if (!valid) return fail("Kata laluan semasa salah", 401);
  if (parsed.data.lama === parsed.data.baru) return fail("Kata laluan baru mesti berbeza", 422);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.baru), mustChangePw: false },
  });

  // Terbitkan semula sesi tanpa flag mustChangePw
  const token = await signSession({
    userId: user.id,
    role: user.role as Role,
    subRole: (user.pelajar?.subRole as SubRole) ?? undefined,
    nama: user.pelajar?.nama ?? user.guru?.nama ?? "Admin",
    pelajarId: user.pelajarId,
    guruId: user.guruId,
    jawatanGuru: user.guru?.jawatanKoko ?? null,
    mustChangePw: false,
  });
  await setSessionCookie(token);

  const redirect = user.role === "Admin" ? "/admin" : user.role === "Guru" ? "/guru" : "/pelajar";
  return ok({ redirect }, "Kata laluan berjaya ditukar");
}
