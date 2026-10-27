import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, ok, fail } from "@/lib/api";
import { simpanFailDariForm } from "@/lib/upload";
import { PERINGKAT } from "@/lib/enums";

// POST: laporan projek SU/NSU — templat sama seperti borang aktiviti
// (Nama, Peringkat, Tarikh, Unit, Laporan ringkas, Eviden) + Jawatan dalam
// projek (markah Projek — Jawatan). Eviden disimpan di failLaporanImpak.
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const boleh =
    session.role === "Pelajar" && (session.subRole === "SU" || session.subRole === "NSU");
  if (!boleh) return fail("Hanya SU/NSU boleh menghantar laporan projek", 403);
  if (!session.pelajarId) return fail("Profil pelajar tidak dijumpai", 403);

  const form = await request.formData();
  const namaProjek = String(form.get("namaProjek") ?? "").trim();
  const namaUnit = String(form.get("namaUnit") ?? "");
  const jawatanProjek = String(form.get("jawatanProjek") ?? "") || null;
  const peringkatProjek = String(form.get("peringkatProjek") ?? "");
  const tarikh = String(form.get("tarikh") ?? "");
  const laporan = String(form.get("laporan") ?? "").trim();
  const sesiId = String(form.get("sesiId") ?? "") || null;

  if (!namaProjek) return fail("Nama program/aktiviti diperlukan", 422);
  if (!PERINGKAT.includes(peringkatProjek as (typeof PERINGKAT)[number])) return fail("Peringkat tidak sah", 422);
  if (!tarikh) return fail("Tarikh program/aktiviti diperlukan", 422);
  if (!laporan) return fail("Laporan ringkas diperlukan", 422);

  // Sahkan namaUnit terus dari Kokurikulum pelajar (jangan percaya jenisKoko klien).
  const unit = await prisma.kokurikulum.findFirst({
    where: { pelajarId: session.pelajarId, namaUnitT6: namaUnit },
    select: { jenisKoko: true },
  });
  if (!unit) return fail("Unit berkaitan projek diperlukan/tidak sah", 422);

  try {
    const eviden = await simpanFailDariForm(form, "eviden", "impak");
    if (!eviden) return fail("Eviden diperlukan untuk semakan guru", 422);
    const rec = await prisma.laporanProjek.create({
      data: {
        namaProjek,
        namaUnit,
        jenisKoko: unit.jenisKoko,
        setiausahaId: session.pelajarId,
        jawatanProjek,
        peringkatProjek,
        tarikh: new Date(tarikh),
        laporan,
        failLaporanImpak: eviden,
        sesiId,
        statusPengesahan: "Pending",
      },
    });
    return ok(rec, "Laporan projek dihantar untuk semakan", 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat", 400);
  }
}
