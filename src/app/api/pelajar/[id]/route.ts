import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, ok, fail } from "@/lib/api";
import { getPelajarProfil } from "@/lib/pelajar";
import { bolehGuruAksesPelajar } from "@/lib/workflow";

// GET /api/pelajar/[id] — profil penuh & pecahan markah PAJSK T6 (live).
// Akses: pelajar sendiri, guru dalam skop seliaan, atau admin.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  if (session.role === "Pelajar") {
    if (session.pelajarId !== id) return fail("Akses ditolak", 403);
  } else if (session.role === "Guru") {
    const guru = session.guruId
      ? await prisma.guru.findUnique({ where: { id: session.guruId } })
      : null;
    if (!guru || !(await bolehGuruAksesPelajar(guru, id))) {
      return fail("Pelajar ini di luar unit seliaan anda", 403);
    }
  } // Admin: akses penuh

  const profil = await getPelajarProfil(id);
  if (!profil) return fail("Pelajar tidak dijumpai", 404);
  return ok(profil, "OK");
}
