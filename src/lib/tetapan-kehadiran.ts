// ===========================================================================
//  Tetapan jumlah aktiviti kokurikulum (penuh) bagi setiap bahagian — Admin.
//  Cth: Kelab 16, Sukan 17, Badan Beruniform 14 → jumlah 47. Kehadiran dikira
//  GABUNGAN: hadir KP + SP + BU (≤ 47) / 2 = perjumpaan, had 15 (KPM);
//  markah = perjumpaan / 15 × 50 — dipakai dalam skor setiap bidang.
//  Disimpan dalam TetapanMarkah (kategori "Kehadiran") — tiada migrasi skema.
// ===========================================================================
import { prisma } from "./prisma";
import { JUMLAH_PERJUMPAAN_WAJIB } from "./pajsk";

export const BAHAGIAN_KEHADIRAN = ["Kelab", "Sukan", "Uniform"] as const;
export type BahagianKehadiran = (typeof BAHAGIAN_KEHADIRAN)[number];
export type JumlahAktiviti = Record<BahagianKehadiran, number>;

const KATEGORI = "Kehadiran";

/** Lalai = 30 aktiviti setiap bahagian (Semester 1: 12 + Semester 2–3: 18). */
export const JUMLAH_AKTIVITI_LALAI: JumlahAktiviti = {
  Kelab: JUMLAH_PERJUMPAAN_WAJIB,
  Sukan: JUMLAH_PERJUMPAAN_WAJIB,
  Uniform: JUMLAH_PERJUMPAAN_WAJIB,
};

export async function jumlahAktiviti(): Promise<JumlahAktiviti> {
  const rows = await prisma.tetapanMarkah.findMany({
    where: { kategori: KATEGORI },
    select: { namaItem: true, nilaiMarkah: true },
  });
  const j = { ...JUMLAH_AKTIVITI_LALAI };
  for (const r of rows) {
    if ((BAHAGIAN_KEHADIRAN as readonly string[]).includes(r.namaItem) && r.nilaiMarkah > 0) {
      j[r.namaItem as BahagianKehadiran] = Math.round(r.nilaiMarkah);
    }
  }
  return j;
}

export async function simpanJumlahAktiviti(j: JumlahAktiviti) {
  await prisma.$transaction(
    BAHAGIAN_KEHADIRAN.map((b) =>
      prisma.tetapanMarkah.upsert({
        where: { kategori_namaItem: { kategori: KATEGORI, namaItem: b } },
        update: { nilaiMarkah: j[b] },
        create: { kategori: KATEGORI, namaItem: b, nilaiMarkah: j[b], markahPenuh: j[b] },
      }),
    ),
  );
}

/** Jumlah semua bahagian (cth 16 + 17 + 14 = 47). */
export const jumlahKeseluruhan = (j: JumlahAktiviti) => j.Kelab + j.Sukan + j.Uniform;

/** Jumlah untuk skorUnit: bahagian ini (paparan) + gabungan semua (asas markah). */
export function jumlahKehadiranUntuk(j: JumlahAktiviti, jenisKoko: string) {
  return { bidang: jumlahUntuk(j, jenisKoko), gabung: jumlahKeseluruhan(j) };
}

/** Jumlah aktiviti penuh bagi satu jenisKoko (Perkhidmatan tiada kehadiran → lalai). */
export function jumlahUntuk(j: JumlahAktiviti, jenisKoko: string): number {
  return (BAHAGIAN_KEHADIRAN as readonly string[]).includes(jenisKoko)
    ? j[jenisKoko as BahagianKehadiran]
    : JUMLAH_PERJUMPAAN_WAJIB;
}
