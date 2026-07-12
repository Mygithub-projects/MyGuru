import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, ok, fail } from "@/lib/api";
import { simpanFailDariForm } from "@/lib/upload";

// PATCH /api/pelajar/[id]/aktiviti-luar/[aktivitiId]
// Lampirkan eviden (surat & sijil) pada rekod aktiviti luar sedia ada —
// digunakan apabila guru telah memilih pelajar (rekod Pending tanpa eviden)
// dan pelajar memuat naik dokumen selepas pertandingan.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; aktivitiId: string }> }
) {
  const { id, aktivitiId } = await params;
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;
  if (session.role === "Pelajar" && session.pelajarId !== id) {
    return fail("Anda hanya boleh mengemas kini rekod sendiri", 403);
  }

  const rec = await prisma.aktivitiLuar.findUnique({ where: { id: aktivitiId } });
  if (!rec || rec.pelajarId !== id) return fail("Aktiviti luar tidak dijumpai", 404);
  if (rec.statusPengesahan === "Approved") {
    return fail("Rekod telah disahkan — tidak boleh diubah", 409);
  }

  const form = await request.formData();
  const tarikh = String(form.get("tarikh") ?? "");

  try {
    const surat = await simpanFailDariForm(form, "surat", "surat");
    const sijil = await simpanFailDariForm(form, "sijil", "sijil");
    const updated = await prisma.aktivitiLuar.update({
      where: { id: aktivitiId },
      data: {
        // Kekalkan lampiran sedia ada jika tiada fail baharu dihantar
        lampiranSurat: surat ?? rec.lampiranSurat,
        lampiranSijil: sijil ?? rec.lampiranSijil,
        tarikh: tarikh ? new Date(tarikh) : rec.tarikh,
        // Hantar semula untuk semakan jika sebelum ini dikuiri
        statusPengesahan: rec.statusPengesahan === "Kuiri" ? "Pending" : rec.statusPengesahan,
      },
    });
    return ok(updated, "Eviden dikemas kini — menunggu pengesahan guru");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat", 400);
  }
}
