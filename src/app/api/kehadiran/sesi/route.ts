import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, ok, fail } from "@/lib/api";
import { ciptaSesi } from "@/lib/kehadiran";
import { JENIS_KOKO } from "@/lib/enums";

const schema = z.object({
  jenisKoko: z.enum(JENIS_KOKO),
  namaUnit: z.string().min(2),
  tarikh: z.string(),
  bilPerjumpaan: z.number().int().min(1).max(40),
});

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const bolehCipta =
    session.role === "Admin" ||
    (session.role === "Pelajar" && (session.subRole === "SU" || session.subRole === "NSU"));
  if (!bolehCipta) return fail("Hanya Setiausaha/Naib SU atau Admin boleh membuka sesi", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Format permintaan tidak sah", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  // SU/NSU hanya untuk unit sendiri
  if (session.role === "Pelajar" && session.pelajarId) {
    const ahli = await prisma.kokurikulum.findFirst({
      where: { pelajarId: session.pelajarId, namaUnitT6: parsed.data.namaUnit },
    });
    if (!ahli) return fail("Anda hanya boleh membuka sesi untuk unit sendiri", 403);
  }

  const sesi = await ciptaSesi({
    jenisKoko: parsed.data.jenisKoko,
    namaUnit: parsed.data.namaUnit,
    tarikh: new Date(parsed.data.tarikh),
    bilPerjumpaan: parsed.data.bilPerjumpaan,
    dibuatOlehId: session.pelajarId ?? undefined,
  });
  return ok(sesi, "Sesi kehadiran dibuka", 201);
}
