import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { PERINGKAT_PROGRAM, tambahPeserta } from "@/lib/ecert-program";

export async function GET() {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const program = await prisma.programECert.findMany({
    orderBy: { tarikh: "desc" },
    include: { _count: { select: { peserta: true } } },
  });
  return ok(program);
}

const schema = z.object({
  namaProgram: z.string().trim().min(3).max(150),
  tarikh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarikh tidak sah"),
  peringkat: z.enum(PERINGKAT_PROGRAM),
  tempat: z.string().trim().max(150).optional(),
  tahunSiri: z.number().int().min(2020).max(2100),
  noKp: z.array(z.string().min(6).max(20)).min(1, "Pilih sekurang-kurangnya seorang pelajar").max(500),
  peranan: z.string().trim().min(2).max(60).default("Peserta"),
  namaPenandatangan: z.string().trim().max(120).optional(),
  jawatanPenandatangan: z.string().trim().max(120).optional(),
});

// Cipta program + tambah peserta (No. Siri dijana) dalam satu langkah.
export async function POST(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const { namaProgram, tarikh, peringkat, tempat, tahunSiri, noKp, peranan, namaPenandatangan, jawatanPenandatangan } = parsed.data;
  const program = await prisma.programECert.create({
    data: {
      namaProgram,
      tarikh: new Date(`${tarikh}T00:00:00`),
      peringkat,
      tempat: tempat || null,
      tahunSiri,
      namaPenandatangan: namaPenandatangan || null,
      jawatanPenandatangan: jawatanPenandatangan || null,
      dibuatOleh: auth.session.userId,
    },
  });
  try {
    const r = await tambahPeserta(program.id, noKp, peranan);
    return ok({ id: program.id, ...r }, `Program disimpan — ${r.ditambah} e-Cert dijana`, 201);
  } catch (e) {
    await prisma.programECert.delete({ where: { id: program.id } }).catch(() => {});
    return fail(e instanceof Error ? e.message : "Ralat menjana e-Cert", 400);
  }
}
