import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  signSession,
  setSessionCookie,
  normalizeIC,
} from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { getT } from "@/lib/locale";
import { ROLES, type Role, type SubRole } from "@/lib/enums";

const schema = z.object({
  identifier: z.string().min(3, "Masukkan No. IC atau email"),
  password: z.string().min(1, "Masukkan kata laluan"),
  // Peranan yang dipilih pada halaman log masuk. Opsyenal supaya klien lama
  // (dan panggilan API terus) terus berfungsi tanpa medan ini.
  role: z.enum(ROLES).optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Format permintaan tidak sah", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);
  }

  const raw = parsed.data.identifier.trim();
  // Pelajar log masuk dengan No. IC; guru/admin dengan email/username.
  const asIC = normalizeIC(raw);
  const candidates = [raw, raw.toLowerCase()];
  if (/^\d{12}$/.test(asIC)) candidates.push(asIC);

  const user = await prisma.user.findFirst({
    where: { username: { in: candidates }, statusAktif: true },
    include: { pelajar: true, guru: true },
  });

  if (!user) return fail("Akaun tidak dijumpai atau tidak aktif", 401);

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return fail("Kata laluan salah", 401);

  // Semak peranan hanya SELEPAS kata laluan sah — supaya peranan sesuatu akaun
  // tidak boleh dicungkil tanpa kelayakan yang betul.
  const dipilih = parsed.data.role;
  if (dipilih && user.role !== dipilih) {
    const { t } = await getT();
    const namaPeranan =
      dipilih === "Admin" ? t.login.roleAdmin : dipilih === "Guru" ? t.login.roleGuru : t.login.rolePelajar;
    return fail(t.login.roleMismatch.replace("{role}", namaPeranan), 403);
  }

  const token = await signSession({
    userId: user.id,
    role: user.role as Role,
    subRole: (user.pelajar?.subRole as SubRole) ?? undefined,
    nama: user.pelajar?.nama ?? user.guru?.nama ?? "Admin",
    pelajarId: user.pelajarId,
    guruId: user.guruId,
    jawatanGuru: user.guru?.jawatanKoko ?? null,
    mustChangePw: user.mustChangePw,
  });
  await setSessionCookie(token);

  const redirect =
    user.role === "Admin" ? "/admin" : user.role === "Guru" ? "/guru" : "/pelajar";

  return ok(
    {
      role: user.role,
      nama: user.pelajar?.nama ?? user.guru?.nama ?? "Admin",
      mustChangePw: user.mustChangePw,
      redirect,
    },
    "Berjaya log masuk"
  );
}
