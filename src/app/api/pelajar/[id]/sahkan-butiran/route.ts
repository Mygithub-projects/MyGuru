import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { bolehGuruSahkanButiran, kiraSemulaT6 } from "@/lib/workflow";

// Pengesahan butiran pelajar (§ butiran) — HANYA Ketua GP/Penolong Ketua GP unit
// pelajar itu boleh sahkan (bukan Guru Penasihat biasa, bukan Admin).
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;
  if (!guru) {
    return fail("Hanya Ketua GP/Penolong Ketua GP boleh mengesahkan butiran pelajar", 403);
  }

  const pelajar = await prisma.pelajar.findUnique({ where: { id } });
  if (!pelajar) return fail("Pelajar tidak dijumpai", 404);

  if (!(await bolehGuruSahkanButiran(guru, id))) {
    return fail("Hanya Ketua GP/Penolong Ketua GP unit pelajar ini boleh mengesahkan butiran", 403);
  }

  const updated = await prisma.pelajar.update({
    where: { id },
    data: { statusButiran: "Approved", disahkanOlehId: guru.id, tarikhSahkan: new Date() },
  });
  // Markah hanya dikira selepas pengesahan — kira sekarang.
  await kiraSemulaT6(id);
  return ok(updated, "Butiran pelajar disahkan");
}
