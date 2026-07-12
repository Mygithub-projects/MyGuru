// src/app/api/agent/cadangan/route.ts
// Senaraikan cadangan agent yang menunggu semakan (status Pending), dalam skop
// pemproses. Guru biasa: cadangan yang dialamatkan kepadanya. Admin / guru
// skop-sekolah: semua cadangan menunggu.

import { requireGuruOrAdmin, ok } from "@/lib/api";
import { guruSeluruhSekolah } from "@/lib/workflow";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { session, guru } = auth;

  const seluruh = guru ? guruSeluruhSekolah(guru) : true; // admin = skop penuh
  const cadangan = await prisma.cadanganAgent.findMany({
    where: seluruh ? { status: "Pending" } : { status: "Pending", untukSemakan: session.userId },
    orderBy: { dicipta: "desc" },
  });

  return ok({ jumlah: cadangan.length, cadangan }, "Cadangan menunggu semakan");
}
