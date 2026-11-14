import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { bolehUrusProjek } from "@/lib/projek-akses";

const schema = z.object({
  nama: z.string().trim().min(1, "Nama projek diperlukan").max(200),
  units: z.array(z.string().trim().min(1).max(200)).min(1, "Pilih sekurang-kurangnya satu unit").max(40),
});

async function muat(id: string) {
  return prisma.projek.findUnique({ where: { id }, include: { _count: { select: { laporan: true } } } });
}

// PATCH: ubah nama / unit projek.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const projek = await muat(id);
  if (!projek) return fail("Projek tidak dijumpai", 404);
  if (!(await bolehUrusProjek(auth.guru, auth.session.userId, projek))) return fail("Projek ini di luar skop anda", 403);

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const rec = await prisma.projek.update({
    where: { id },
    data: { nama: parsed.data.nama, units: [...new Set(parsed.data.units)] },
  });
  return ok(rec, "Projek dikemas kini");
}

// DELETE: padam projek — hanya jika belum ada laporan dihantar.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const projek = await muat(id);
  if (!projek) return fail("Projek tidak dijumpai", 404);
  if (!(await bolehUrusProjek(auth.guru, auth.session.userId, projek))) return fail("Projek ini di luar skop anda", 403);
  if (projek._count.laporan > 0) return fail("Projek sudah mempunyai laporan dan tidak boleh dipadam", 409);
  await prisma.projek.delete({ where: { id } });
  return ok(null, "Projek dipadam");
}
