import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { sahkanSesi } from "@/lib/kehadiran";
import { bolehGuruUrusPelajar, unitUrus } from "@/lib/workflow";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;

  const sesi = await prisma.sesiKehadiran.findUnique({ where: { id } });
  if (!sesi) return fail("Sesi tidak dijumpai", 404);

  // Guru: sesi mesti untuk unit seliaan
  if (guru) {
    const units = await unitUrus(guru);
    const seluruh = await bolehGuruUrusPelajar(guru, sesi.dibuatOlehId ?? "");
    if (!units.includes(sesi.namaUnit) && !seluruh) {
      return fail("Sesi ini di luar unit seliaan anda", 403);
    }
  }

  const updated = await sahkanSesi(id, guru?.id ?? null);
  return ok(updated, "Sesi kehadiran disahkan");
}
