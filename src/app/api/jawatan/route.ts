import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, ok, fail } from "@/lib/api";
import { cadangJawatan } from "@/lib/workflow";
import { JENIS_KOKO, JAWATAN_PILIHAN } from "@/lib/enums";

const schema = z.object({
  pelajarId: z.string(),
  jenisKoko: z.enum(JENIS_KOKO),
  jawatanBaru: z.enum(JAWATAN_PILIHAN),
});

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const boleh =
    session.role === "Admin" ||
    (session.role === "Pelajar" && (session.subRole === "SU" || session.subRole === "NSU"));
  if (!boleh) return fail("Hanya SU/NSU atau Admin boleh mencadang jawatan", 403);

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  // SU hanya untuk ahli dalam unit sendiri
  if (session.role === "Pelajar" && session.pelajarId) {
    const suUnits = await prisma.kokurikulum.findMany({
      where: { pelajarId: session.pelajarId },
      select: { namaUnitT6: true },
    });
    const namaUnits = suUnits.map((u) => u.namaUnitT6).filter(Boolean) as string[];
    const ahli = await prisma.kokurikulum.findFirst({
      where: { pelajarId: parsed.data.pelajarId, jenisKoko: parsed.data.jenisKoko, namaUnitT6: { in: namaUnits } },
    });
    if (!ahli) return fail("Pelajar ini bukan ahli unit seliaan anda", 403);
  }

  try {
    const c = await cadangJawatan({ ...parsed.data, dicadangOlehId: session.pelajarId ?? undefined });
    return ok(c, "Cadangan jawatan dihantar — menunggu kelulusan guru", 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat", 400);
  }
}
