import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, ok, fail } from "@/lib/api";
import { simpanFailDariForm } from "@/lib/upload";
import { PERINGKAT } from "@/lib/enums";
import { bacaOprDariForm, janaOprPDF, simpanOpr, teksLaporanOpr } from "@/lib/opr";
import { bacaPeserta, tagProjekPelajar } from "@/lib/projek";
import { JAWATAN_PERANAN } from "@/lib/projek-jawatan";

// POST: laporan projek — HANYA pelajar yang di-tag guru sebagai SU/NSU bagi
// projek itu (projekId). Borang OPR: butiran + gambar → PDF OPR sebagai eviden,
// + senarai peserta & jawatan (markah projek dikreditkan selepas disahkan guru).
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;
  if (session.role !== "Pelajar" || !session.pelajarId) return fail("Hanya pelajar boleh menghantar laporan projek", 403);

  const form = await request.formData();
  const tag = await tagProjekPelajar(session.pelajarId, String(form.get("projekId") ?? ""));
  if (!tag) return fail("Anda belum di-tag sebagai SU/NSU bagi projek ini oleh guru penasihat", 403);
  const projek = tag.projek;
  // Jawatan penghantar ditetapkan oleh tag guru (SU → Setiausaha, NSU → Naib Setiausaha).
  form.set("jawatanProjek", JAWATAN_PERANAN[tag.peranan]);

  // Satu laporan aktif bagi setiap projek (laporan dikuiri boleh dihantar semula).
  const aktif = await prisma.laporanProjek.findFirst({
    where: { projekId: projek.id, statusPengesahan: { in: ["Pending", "Approved"] } },
    select: { statusPengesahan: true },
  });
  if (aktif) {
    return fail(aktif.statusPengesahan === "Approved"
      ? "Laporan projek ini telah disahkan"
      : "Laporan projek ini sudah dihantar dan sedang menunggu pengesahan", 409);
  }

  const namaUnit = String(form.get("namaUnit") ?? "");
  const jawatanProjek = String(form.get("jawatanProjek") ?? "") || null;
  const peringkatProjek = String(form.get("peringkatProjek") ?? "");
  const tarikh = String(form.get("tarikh") ?? "");
  const laporan = String(form.get("laporan") ?? "").trim();

  if (!PERINGKAT.includes(peringkatProjek as (typeof PERINGKAT)[number])) return fail("Peringkat tidak sah", 422);
  if (!tarikh) return fail("Tarikh program/aktiviti diperlukan", 422);
  if (!laporan) return fail("Laporan ringkas diperlukan", 422);

  // Sahkan namaUnit terus dari Kokurikulum pelajar (jangan percaya jenisKoko klien).
  const unit = await prisma.kokurikulum.findFirst({
    where: { pelajarId: session.pelajarId, namaUnitT6: namaUnit },
    select: { jenisKoko: true },
  });
  if (!unit) return fail("Unit berkaitan projek diperlukan/tidak sah", 422);

  const p = await bacaPeserta(form, session.pelajarId, projek);
  if ("ralat" in p) return fail(p.ralat, 422);

  try {
    let eviden: string | null;
    let teksLaporan = laporan;
    if (form.get("opr") === "1") {
      const r = await bacaOprDariForm(form, "Projek", { id: session.pelajarId, subRole: session.subRole }, {
        nama: projek.nama,
        peranan: tag.peranan,
        peserta: p.peserta,
      });
      if ("ralat" in r) return fail(r.ralat, 422);
      eviden = await simpanOpr(await janaOprPDF(r.data));
      teksLaporan = teksLaporanOpr(r.data);
    } else {
      eviden = await simpanFailDariForm(form, "eviden", "impak");
    }
    if (!eviden) return fail("Eviden diperlukan untuk semakan guru", 422);

    const rec = await prisma.laporanProjek.create({
      data: {
        namaProjek: projek.nama,
        projekId: projek.id,
        namaUnit,
        jenisKoko: unit.jenisKoko,
        setiausahaId: session.pelajarId,
        jawatanProjek,
        peringkatProjek,
        tarikh: new Date(tarikh),
        laporan: teksLaporan,
        failLaporanImpak: eviden,
        statusPengesahan: "Pending",
        peserta: {
          create: p.peserta.map((x) => ({ pelajarId: x.pelajarId, jawatan: x.jawatan, unitKredit: x.unitKredit })),
        },
      },
    });
    return ok(rec, "Laporan projek dihantar untuk semakan", 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat", 400);
  }
}
