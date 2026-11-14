import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { kiraSemulaLatar, schemaProgram } from "@/lib/program-kolej";

async function pesertaIds(id: string) {
  return (await prisma.programKolejPeserta.findMany({ where: { programId: id }, select: { pelajarId: true } }))
    .map((x) => x.pelajarId);
}

// PATCH: ubah nama / tarikh / peringkat — markah peserta dikira semula jika peringkat berubah.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const lama = await prisma.programKolej.findUnique({ where: { id } });
  if (!lama) return fail("Program tidak dijumpai", 404);

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schemaProgram.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);
  const t = parsed.data.tarikh ? new Date(parsed.data.tarikh) : null;
  if (t && isNaN(t.getTime())) return fail("Tarikh tidak sah", 422);

  const rec = await prisma.programKolej.update({
    where: { id },
    data: { nama: parsed.data.nama, peringkat: parsed.data.peringkat, tarikh: t },
  });
  if (lama.peringkat !== rec.peringkat || lama.nama !== rec.nama) kiraSemulaLatar(await pesertaIds(id), "ubah program");
  return ok(rec, "Program dikemas kini");
}

// DELETE: padam program — markah peserta dikira semula.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const ids = await pesertaIds(id);
  const n = await prisma.programKolej.deleteMany({ where: { id } });
  if (n.count === 0) return fail("Program tidak dijumpai", 404);
  kiraSemulaLatar(ids, "padam program");
  return ok(null, "Program dipadam");
}
