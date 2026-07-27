// src/app/api/admin/pelajar/[id]/reset-kata-laluan/route.ts
// Reset kata laluan pelajar (Admin sahaja) — untuk pelajar yang lupa kata laluan.
// Kata laluan ditetapkan semula kepada No. IC pelajar dan mustChangePw = true,
// jadi pelajar log masuk dengan No. IC & dipaksa menetapkan kata laluan baharu.

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

  const pelajar = await prisma.pelajar.findUnique({
    where: { id },
    select: { id: true, nama: true, noIc: true },
  });
  if (!pelajar) return fail("Pelajar tidak dijumpai", 404);
  if (!/^\d{12}$/.test(pelajar.noIc)) return fail("No. IC pelajar tidak sah (bukan 12 digit)", 422);

  const passwordHash = await hashPassword(pelajar.noIc);

  // Pastikan akaun log masuk wujud; cipta jika tiada, kemas kini jika ada.
  const akaun = await prisma.user.findFirst({ where: { pelajarId: id }, select: { id: true } });
  if (akaun) {
    await prisma.user.update({
      where: { id: akaun.id },
      data: { username: pelajar.noIc, passwordHash, mustChangePw: true, statusAktif: true },
    });
  } else {
    await prisma.user.create({
      data: { username: pelajar.noIc, passwordHash, role: "Pelajar", pelajarId: id, mustChangePw: true },
    });
  }

  return ok(
    { username: pelajar.noIc, kataLaluan: pelajar.noIc },
    `Kata laluan "${pelajar.nama}" telah di-reset kepada No. IC (${pelajar.noIc}). Pelajar dipaksa tukar semasa log masuk.`
  );
}
