import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, ok, fail } from "@/lib/api";
import { simpanFailDariForm } from "@/lib/upload";

// POST: cipta projek (pra) atau kemas kini (pasca) bergantung pada `projekId`.
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const boleh =
    session.role === "Pelajar" && (session.subRole === "SU" || session.subRole === "NSU");
  if (!boleh) return fail("Hanya SU/NSU boleh menghantar laporan projek", 403);
  if (!session.pelajarId) return fail("Profil pelajar tidak dijumpai", 403);

  const form = await request.formData();
  const projekId = String(form.get("projekId") ?? "");
  const namaProjek = String(form.get("namaProjek") ?? "").trim();
  const namaUnit = String(form.get("namaUnit") ?? "") || null;
  const jawatanProjek = String(form.get("jawatanProjek") ?? "") || null;
  const peringkatProjek = String(form.get("peringkatProjek") ?? "") || null;
  const kewangan = String(form.get("kewangan") ?? "");
  const kekuatan = String(form.get("kekuatan") ?? "");
  const kelemahan = String(form.get("kelemahan") ?? "");
  const sesiId = String(form.get("sesiId") ?? "") || null;
  const hantar = form.get("hantar") === "true";

  // Sahkan namaUnit terus dari Kokurikulum pelajar (jangan percaya jenisKoko klien).
  let jenisKoko: string | null = null;
  if (namaUnit) {
    const k = await prisma.kokurikulum.findFirst({
      where: { pelajarId: session.pelajarId, namaUnitT6: namaUnit },
      select: { jenisKoko: true },
    });
    jenisKoko = k?.jenisKoko ?? null;
  }

  try {
    const kertasKerja = await simpanFailDariForm(form, "kertasKerja", "kertas");
    const laporanImpak = await simpanFailDariForm(form, "laporanImpak", "impak");

    if (projekId) {
      // Fasa pasca: kemas kini projek sedia ada
      const rec = await prisma.laporanProjek.update({
        where: { id: projekId },
        data: {
          failLaporanImpak: laporanImpak ?? undefined,
          namaUnit: namaUnit ?? undefined,
          jenisKoko: jenisKoko ?? undefined,
          jawatanProjek: jawatanProjek ?? undefined,
          peringkatProjek: peringkatProjek ?? undefined,
          kewangan: kewangan || undefined,
          kekuatan: kekuatan || undefined,
          kelemahan: kelemahan || undefined,
          statusPengesahan: hantar ? "Pending" : undefined,
        },
      });
      return ok(rec, "Laporan pasca-program dikemas kini", 200);
    }

    if (!namaProjek) return fail("Nama projek diperlukan", 422);
    if (!namaUnit) return fail("Unit berkaitan projek diperlukan", 422);
    const rec = await prisma.laporanProjek.create({
      data: {
        namaProjek,
        namaUnit,
        jenisKoko,
        setiausahaId: session.pelajarId,
        failKertasKerja: kertasKerja,
        jawatanProjek,
        peringkatProjek,
        kewangan: kewangan || null,
        sesiId,
        statusPengesahan: hantar ? "Pending" : "Draft",
      },
    });
    return ok(rec, hantar ? "Kertas kerja dihantar untuk semakan" : "Draf projek disimpan", 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat", 400);
  }
}
