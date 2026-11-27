// ===========================================================================
//  Aktiviti Luar pelajar — borang OPR (sama aliran seperti Laporan Mingguan):
//  isi butiran + gambar → Jana OPR → pratonton & semak → hantar bersama surat
//  pengiktirafan KPM & sijil. Dikongsi oleh pratonton (/api/laporan/opr) dan
//  penghantaran (/api/pelajar/[id]/aktiviti-luar) supaya OPR yang disemak =
//  OPR yang disimpan.
// ===========================================================================
import { prisma } from "./prisma";
import { KEDUDUKAN_AKTIVITI, PERINGKAT_LUAR } from "./enums";
import { bacaOprDariForm, type OprData } from "./opr";

export interface AktivitiLuarBorang {
  opr: OprData;
  namaAktiviti: string;
  peringkat: string;
  namaUnit: string;
  tarikh: string;
  kedudukan: string;
  pengiring: { id: string; nama: string; userId: string | null };
}

export async function bacaAktivitiLuarDariForm(
  form: FormData,
  pelajarId: string,
): Promise<{ data: AktivitiLuarBorang } | { ralat: string }> {
  const peringkat = String(form.get("peringkat") ?? "");
  const kedudukan = String(form.get("kedudukan") ?? "");
  const guruPengiringId = String(form.get("guruPengiringId") ?? "");
  if (!(PERINGKAT_LUAR as readonly string[]).includes(peringkat)) return { ralat: "Peringkat tidak sah" };
  if (!(KEDUDUKAN_AKTIVITI as readonly string[]).includes(kedudukan)) return { ralat: "Kedudukan/pencapaian diperlukan" };

  // Guru pengiring — hanya guru ini boleh mengesahkan aktiviti ini.
  const g = guruPengiringId
    ? await prisma.guru.findFirst({
        where: { id: guruPengiringId, statusAktif: true },
        select: { id: true, nama: true, user: { select: { id: true } } },
      })
    : null;
  if (!g) return { ralat: "Sila pilih guru pengiring" };

  // Butiran OPR (nama, tarikh, unit pelajar disahkan, objektif/aktiviti/refleksi, gambar).
  const r = await bacaOprDariForm(form, "Luar", { id: pelajarId, subRole: null });
  if ("ralat" in r) return r;
  const opr: OprData = {
    ...r.data,
    jawatanPenyedia: "Peserta",
    tambahan: [
      ["Kedudukan / Pencapaian", kedudukan],
      ["Guru Pengiring", g.nama],
    ],
  };

  return {
    data: {
      opr,
      namaAktiviti: opr.namaProgram,
      peringkat,
      namaUnit: opr.namaUnit,
      tarikh: opr.tarikh,
      kedudukan,
      pengiring: { id: g.id, nama: g.nama, userId: g.user?.id ?? null },
    },
  };
}
