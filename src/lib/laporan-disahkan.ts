// ===========================================================================
//  Dokumen laporan SU/NSU yang DISAHKAN — dalam format OPR.
//  1. Laporan dihantar melalui borang OPR → OPR asal (dengan gambar) dicop
//     pengesahan guru di kaki muka surat.
//  2. Rekod lama / import (tiada OPR) → OPR dijana dari medan pangkalan data;
//     eviden gambar (jpg/png) yang dimuat naik dimasukkan sebagai gambar aktiviti.
// ===========================================================================
import type { LaporanMingguan, LaporanProjek } from "@prisma/client";
import { prisma } from "./prisma";
import { storage } from "./storage";
import { ringkasanSesi } from "./kehadiran";
import { teksDisahkanOleh } from "./pengesah";
import {
  copPengesahanOpr, huraiTeksLaporanOpr, janaOprPDF, jenisImej, OPR_MAKS_GAMBAR,
  type OprData, type PengesahanOpr,
} from "./opr";

const namaFail = (simpanan: string) => simpanan.trim().split("/").pop() ?? "";

/** Fail OPR (opr-*.pdf) pertama dalam senarai lampiran → dicop; null jika tiada/gagal. */
async function cubaCopOpr(lampiran: string[], p: PengesahanOpr): Promise<Uint8Array | null> {
  for (const l of lampiran) {
    const n = namaFail(l);
    if (!n.startsWith("opr-") || !n.endsWith(".pdf")) continue;
    const buf = await storage().baca(n);
    if (!buf) continue;
    try {
      return await copPengesahanOpr(new Uint8Array(buf), p);
    } catch {
      /* PDF rosak — jatuh ke OPR jana semula */
    }
  }
  return null;
}

/** Eviden gambar (jpg/png) yang dimuat naik → gambar aktiviti OPR. */
async function gambarDariLampiran(lampiran: string[]): Promise<OprData["gambar"]> {
  const out: OprData["gambar"] = [];
  for (const l of lampiran) {
    if (out.length >= OPR_MAKS_GAMBAR) break;
    const buf = await storage().baca(namaFail(l));
    if (!buf) continue;
    const data = new Uint8Array(buf);
    const jenis = jenisImej(data);
    if (jenis) out.push({ data, jenis });
  }
  return out;
}

const tarikhISO = (d: Date | null) => (d ? new Date(d.getTime() + 8 * 3_600_000).toISOString().slice(0, 10) : "-");

export async function pdfProjekDisahkan(
  rec: LaporanProjek & { setiausaha: { nama: string } }
): Promise<Uint8Array> {
  const pengesahan: PengesahanOpr = { oleh: await teksDisahkanOleh(rec), komen: rec.komenGuru };
  const lampiran = [rec.failLaporanImpak, rec.failKertasKerja].filter((x): x is string => !!x);
  const dicop = await cubaCopOpr(lampiran, pengesahan);
  if (dicop) return dicop;

  const peserta = await prisma.projekPeserta.findMany({
    where: { laporanId: rec.id, pelajarId: { not: rec.setiausahaId } },
    select: { jawatan: true, pelajar: { select: { nama: true, kelasT6: true } } },
    orderBy: { pelajar: { nama: "asc" } },
  });
  // Rekod lama (sebelum OPR): kewangan/kekuatan/kelemahan sebagai isi aktiviti & refleksi.
  const teks = rec.laporan
    ? huraiTeksLaporanOpr(rec.laporan)
    : {
        tempat: "",
        objektif: "",
        aktiviti: [rec.kewangan && `Kewangan: ${rec.kewangan}`, rec.kekuatan && `Kekuatan: ${rec.kekuatan}`].filter(Boolean).join("\n\n"),
        refleksi: rec.kelemahan ? `Kelemahan / Penambahbaikan: ${rec.kelemahan}` : "",
      };
  return janaOprPDF(
    {
      jenis: "Projek",
      namaProgram: rec.namaProjek,
      namaUnit: rec.namaUnit ?? "-",
      jenisKoko: rec.jenisKoko ?? "-",
      peringkat: rec.peringkatProjek ?? "",
      tarikh: tarikhISO(rec.tarikh),
      masa: "",
      ...teks,
      jawatanProjek: rec.jawatanProjek,
      kehadiran: null,
      disediakanOleh: rec.setiausaha.nama,
      jawatanPenyedia: rec.jawatanProjek ?? "Setiausaha Projek",
      gambar: await gambarDariLampiran(lampiran),
      peserta: peserta.map((p) => ({ nama: p.pelajar.nama, kelas: p.pelajar.kelasT6, jawatan: p.jawatan })),
    },
    { pengesahan }
  );
}

export async function pdfMingguanDisahkan(
  rec: LaporanMingguan & { setiausaha: { nama: string } }
): Promise<Uint8Array> {
  const pengesahan: PengesahanOpr = { oleh: await teksDisahkanOleh(rec), komen: rec.komenGuru };
  const lampiran = (rec.lampiran ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const dicop = await cubaCopOpr(lampiran, pengesahan);
  if (dicop) return dicop;

  let kehadiran: OprData["kehadiran"] = null;
  if (rec.sesiId) {
    const [sesi, r] = await Promise.all([
      prisma.sesiKehadiran.findUnique({ where: { id: rec.sesiId }, select: { bilPerjumpaan: true } }),
      ringkasanSesi(rec.sesiId),
    ]);
    if (sesi && r.total) kehadiran = { bil: sesi.bilPerjumpaan, ...r };
  }
  return janaOprPDF(
    {
      jenis: "Mingguan",
      namaProgram: rec.namaProgram ?? "Laporan Perjumpaan Mingguan",
      namaUnit: rec.namaUnit ?? "-",
      jenisKoko: rec.jenisKoko,
      peringkat: rec.peringkat ?? "",
      tarikh: tarikhISO(rec.tarikh),
      masa: rec.masa ?? "",
      ...huraiTeksLaporanOpr(rec.aktiviti),
      jawatanProjek: null,
      kehadiran,
      disediakanOleh: rec.setiausaha.nama,
      jawatanPenyedia: "Setiausaha / Naib Setiausaha (SU/NSU)",
      gambar: await gambarDariLampiran(lampiran),
      peserta: [],
    },
    { pengesahan }
  );
}
