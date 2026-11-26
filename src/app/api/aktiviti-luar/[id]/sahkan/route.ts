import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { sahkanAktivitiLuar, bolehGuruUrusPelajar, guruSeluruhSekolah, unitUrus } from "@/lib/workflow";

const schema = z.object({
  status: z.enum(["Approved", "Kuiri"]),
  komen: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Format permintaan tidak sah", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const rec = await prisma.aktivitiLuar.findUnique({ where: { id } });
  if (!rec) return fail("Aktiviti luar tidak dijumpai", 404);

  // Rekod baharu: HANYA guru pengiring yang dipilih pelajar boleh mengesahkan.
  if (rec.guruPengiringId) {
    if (!guru || guru.id !== rec.guruPengiringId) {
      return fail("Hanya guru pengiring yang dipilih boleh mengesahkan aktiviti ini", 403);
    }
  } else if (guru && !guruSeluruhSekolah(guru)) {
    // Rekod lama: guru penasihat UNIT berkenaan (atau skop pelajar jika tiada namaUnit).
    const units = await unitUrus(guru);
    const okUnit = rec.namaUnit
      ? units.includes(rec.namaUnit)
      : await bolehGuruUrusPelajar(guru, rec.pelajarId);
    if (!okUnit) return fail("Aktiviti luar ini di luar unit seliaan anda", 403);
  }

  try {
    const result = await sahkanAktivitiLuar({
      aktivitiId: id,
      status: parsed.data.status,
      komen: parsed.data.komen,
    });
    return ok(
      result,
      parsed.data.status === "Approved"
        ? `Disahkan — penglibatan ${result.markahPenglibatan}, pencapaian ${result.markahPencapaian} markah; e-Cert diaktifkan (${result.noSiriECert})`
        : "Kuiri dihantar"
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat memproses", 400);
  }
}
