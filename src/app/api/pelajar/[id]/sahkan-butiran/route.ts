import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { bolehGuruSahkanButiran } from "@/lib/workflow";

// Pengesahan butiran pelajar (§ butiran) — HANYA Guru Penasihat/Ketua GP unit
// pelajar itu boleh sahkan (bukan Admin, bukan Penolong Ketua GP).
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;
  if (!guru) {
    return fail("Hanya Guru Penasihat/Ketua GP boleh mengesahkan butiran pelajar", 403);
  }

  const pelajar = await prisma.pelajar.findUnique({ where: { id } });
  if (!pelajar) return fail("Pelajar tidak dijumpai", 404);

  if (!(await bolehGuruSahkanButiran(guru, id))) {
    return fail("Pelajar ini di luar unit seliaan anda, atau jawatan anda tidak dibenarkan mengesahkan butiran", 403);
  }

  const updated = await prisma.pelajar.update({
    where: { id },
    data: { statusButiran: "Approved", disahkanOlehId: guru.id, tarikhSahkan: new Date() },
  });
  return ok(updated, "Butiran pelajar disahkan");
}
