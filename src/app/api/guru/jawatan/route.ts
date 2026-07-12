import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { tetapkanJawatanOlehGuru, guruSeluruhSekolah, unitSeliaan } from "@/lib/workflow";
import { JENIS_KOKO, JAWATAN_PELAJAR } from "@/lib/enums";

const schema = z.object({
  pelajarId: z.string(),
  jenisKoko: z.enum(JENIS_KOKO),
  jawatan: z.enum(JAWATAN_PELAJAR),
});

/** Guru penasihat menetapkan terus jawatan pelajar untuk unit seliaannya. */
export async function POST(request: NextRequest) {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const { pelajarId, jenisKoko, jawatan } = parsed.data;

  const koko = await prisma.kokurikulum.findUnique({
    where: { pelajarId_jenisKoko: { pelajarId, jenisKoko } },
    select: { namaUnitT6: true },
  });
  if (!koko?.namaUnitT6) return fail("Pelajar belum berdaftar dalam unit ini untuk T6", 404);

  // Skop: guru unit hanya boleh set jawatan bagi unit yang diselia (per-unit).
  if (guru && !guruSeluruhSekolah(guru)) {
    const units = await unitSeliaan(guru);
    if (!units.includes(koko.namaUnitT6)) {
      return fail("Unit ini di luar unit seliaan anda", 403);
    }
  }

  try {
    const result = await tetapkanJawatanOlehGuru({
      pelajarId,
      jenisKoko,
      jawatan,
      guruId: guru?.id ?? null,
    });
    return ok(result, `Jawatan ditetapkan: ${jawatan} (${result.markah} markah)`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat", 400);
  }
}
