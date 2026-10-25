// src/app/api/admin/guru/[id]/reset-kata-laluan/route.ts
// Reset kata laluan guru (Admin sahaja) — untuk guru yang lupa kata laluan.
// Kata laluan baharu dijana secara rawak & dipulangkan SEKALI kepada admin
// untuk diserahkan kepada guru. mustChangePw = true, jadi guru dipaksa
// menetapkan kata laluan sendiri selepas log masuk. Username tidak diubah.

import type { NextRequest } from "next/server";
import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { hashPassword } from "@/lib/auth";

// Tiada aksara mengelirukan (0/O, 1/l/I).
const ABJAD = "abcdefghjkmnpqrstuvwxyz23456789";
function janaKataLaluan(panjang = 8): string {
  return Array.from({ length: panjang }, () => ABJAD[randomInt(ABJAD.length)]).join("");
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  const guru = await prisma.guru.findUnique({
    where: { id },
    select: { id: true, nama: true, email: true },
  });
  if (!guru) return fail("Guru tidak dijumpai", 404);

  const kataLaluan = janaKataLaluan();
  const passwordHash = await hashPassword(kataLaluan);
  const akaun = await prisma.user.findFirst({ where: { guruId: id }, select: { id: true, username: true } });
  let username: string;
  if (akaun) {
    await prisma.user.update({
      where: { id: akaun.id },
      data: { passwordHash, mustChangePw: true, statusAktif: true },
    });
    username = akaun.username;
  } else {
    const bentrok = await prisma.user.findFirst({ where: { username: guru.email }, select: { id: true } });
    if (bentrok) return fail(`Email ${guru.email} sudah digunakan oleh akaun lain`, 409);
    await prisma.user.create({
      data: { username: guru.email, email: guru.email, passwordHash, role: "Guru", guruId: id, mustChangePw: true },
    });
    username = guru.email;
  }

  return ok(
    { username, kataLaluan },
    `Kata laluan "${guru.nama}" telah di-reset. Guru dipaksa tukar semasa log masuk.`
  );
}
