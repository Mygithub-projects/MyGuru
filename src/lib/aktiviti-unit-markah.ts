// Markah Aktiviti Unit (Jadual D & E) — tanpa akses DB, selamat diimport oleh
// skor-unit / workflow / eksport tanpa import bulat.
import { markahPenglibatan, markahPencapaian } from "./pajsk";
import type { ProgramPenglibatan, PencapaianBidang } from "./skor-unit";

/** Include Prisma: penyertaan pelajar dalam aktiviti unit yang DISAHKAN. */
export const INCLUDE_AKTIVITI_UNIT_LULUS = {
  where: { aktiviti: { statusPengesahan: "Approved" } },
  include: { aktiviti: { select: { namaAktiviti: true, peringkat: true, jenisKoko: true } } },
} as const;

type BarisPeserta = {
  kedudukan: string;
  aktiviti: { namaAktiviti: string; peringkat: string; jenisKoko: string };
};

/** Markah satu peserta ikut Jadual D (penglibatan) & Jadual E (pencapaian). */
export function markahPeserta(peringkat: string, kedudukan: string) {
  return {
    penglibatan: markahPenglibatan(peringkat),
    pencapaian: kedudukan === "Penyertaan" ? 0 : markahPencapaian(peringkat, kedudukan),
  };
}

/** Penglibatan — sumbangan kepada unit peserta dalam bidang aktiviti sahaja. */
export function penglibatanAktivitiUnit(rows: BarisPeserta[]): ProgramPenglibatan[] {
  return rows.map((r) => ({ nama: r.aktiviti.namaAktiviti, peringkat: r.aktiviti.peringkat, jenisKoko: r.aktiviti.jenisKoko }));
}

/** Pencapaian — calon markah pencapaian bagi bidang aktiviti (Johan/N.Johan/Ketiga). */
export function pencapaianAktivitiUnit(rows: BarisPeserta[]): PencapaianBidang[] {
  return rows
    .map((r) => ({
      jenisKoko: r.aktiviti.jenisKoko,
      tahap: `${r.kedudukan} ${r.aktiviti.peringkat === "Sekolah" ? "Kolej" : r.aktiviti.peringkat} (${r.aktiviti.namaAktiviti})`,
      markah: markahPeserta(r.aktiviti.peringkat, r.kedudukan).pencapaian,
    }))
    .filter((c) => c.markah > 0);
}
