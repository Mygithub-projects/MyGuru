// src/app/api/admin/pelajar/[id]/route.ts
// Kemas kini (PATCH) & padam (DELETE) pelajar — Admin sahaja.
// PATCH: medan profil sahaja (No. IC tidak boleh diubah kerana ia username akaun).
// DELETE: padam Pelajar + akaun User + laporan; relasi lain cascade.

import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { JANTINA, KAUM, AGAMA, SUB_ROLES } from "@/lib/enums";

const schema = z.object({
  nama: z.string().trim().min(2, "Nama terlalu pendek").max(120).optional(),
  kelasT6: z.string().max(60).nullish(),
  jantina: z.enum(JANTINA).or(z.literal("")).nullish(),
  kaum: z.enum(KAUM).or(z.literal("")).nullish(),
  agama: z.enum(AGAMA).or(z.literal("")).nullish(),
  email: z.string().trim().email("Email tidak sah").max(160).or(z.literal("")).nullish(),
  noTel: z.string().max(30).nullish(),
  subRole: z.enum(SUB_ROLES).optional(),
  statusAktif: z.boolean().optional(),
});

const bersih = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const exists = await prisma.pelajar.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return fail("Pelajar tidak dijumpai", 404);

  const d = parsed.data;
  const updated = await prisma.pelajar.update({
    where: { id },
    data: {
      nama: d.nama ?? undefined,
      kelasT6: "kelasT6" in d ? bersih(d.kelasT6) : undefined,
      jantina: "jantina" in d ? bersih(d.jantina) : undefined,
      kaum: "kaum" in d ? bersih(d.kaum) : undefined,
      agama: "agama" in d ? bersih(d.agama) : undefined,
      email: "email" in d ? bersih(d.email) : undefined,
      noTel: "noTel" in d ? bersih(d.noTel) : undefined,
      subRole: d.subRole ?? undefined,
      statusAktif: d.statusAktif ?? undefined,
    },
  });

  // Selaraskan status akaun log masuk dengan status pelajar.
  if (typeof d.statusAktif === "boolean") {
    await prisma.user.updateMany({ where: { pelajarId: id }, data: { statusAktif: d.statusAktif } });
  }

  return ok({ id: updated.id }, "Maklumat pelajar dikemas kini");
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  const pelajar = await prisma.pelajar.findUnique({
    where: { id },
    select: { id: true, nama: true },
  });
  if (!pelajar) return fail("Pelajar tidak dijumpai", 404);

  try {
    await prisma.$transaction([
      prisma.user.deleteMany({ where: { pelajarId: id } }),
      prisma.laporanMingguan.deleteMany({ where: { setiausahaId: id } }),
      prisma.laporanProjek.deleteMany({ where: { setiausahaId: id } }),
      prisma.pelajar.delete({ where: { id } }),
    ]);
    return ok({ id }, `Pelajar "${pelajar.nama}" dan akaun berkaitan telah dipadam.`);
  } catch {
    return fail("Ralat memadam pelajar", 500);
  }
}
