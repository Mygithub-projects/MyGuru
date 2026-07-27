// src/app/api/admin/guru/[id]/reset-kata-laluan/route.ts
// Reset kata laluan guru (Admin sahaja) — untuk guru yang lupa kata laluan.
// Kata laluan & username ditetapkan semula kepada No. IC guru dan
// mustChangePw = true, jadi guru log masuk dengan No. IC & dipaksa
// menetapkan kata laluan baharu.

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { hashPassword } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  const guru = await prisma.guru.findUnique({
    where: { id },
    select: { id: true, nama: true, noIc: true, email: true },
  });
  if (!guru) return fail("Guru tidak dijumpai", 404);
  if (!/^\d{12}$/.test(guru.noIc))
    return fail("No. IC guru tidak sah (bukan 12 digit) — tidak boleh reset kepada IC", 422);

  // Elak pertembungan username IC dengan akaun lain.
  const bentrok = await prisma.user.findFirst({
    where: { username: guru.noIc, guruId: { not: id } },
    select: { id: true },
  });
  if (bentrok) return fail(`No. IC ${guru.noIc} sudah digunakan oleh akaun lain`, 409);

  const passwordHash = await hashPassword(guru.noIc);
  const akaun = await prisma.user.findFirst({ where: { guruId: id }, select: { id: true } });
  if (akaun) {
    await prisma.user.update({
      where: { id: akaun.id },
      data: { username: guru.noIc, passwordHash, mustChangePw: true, statusAktif: true },
    });
  } else {
    await prisma.user.create({
      data: { username: guru.noIc, email: guru.email, passwordHash, role: "Guru", guruId: id, mustChangePw: true },
    });
  }

  return ok(
    { username: guru.noIc, kataLaluan: guru.noIc },
    `Kata laluan "${guru.nama}" telah di-reset kepada No. IC (${guru.noIc}). Guru dipaksa tukar semasa log masuk.`
  );
}
