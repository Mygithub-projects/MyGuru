// ===========================================================================
//  Tetapan jumlah aktiviti kokurikulum (penuh) bagi setiap bahagian — Admin.
//  Cth: Kelab 16, Sukan 17, Badan Beruniform 14 → jumlah 47. Kehadiran dikira
//  GABUNGAN: hadir KP + SP + BU (≤ 47) / 2 = perjumpaan, had 15 (KPM);
//  markah = perjumpaan / 15 × 50 — dipakai dalam skor setiap bidang.
//  Disimpan dalam TetapanMarkah: kategori "Kehadiran:<kohort>" bagi setiap
//  kohort, dengan jatuhan ke kategori umum "Kehadiran" (tetapan asal).
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

const kategoriKohort = (kohort: string) => `${KATEGORI}:${kohort}`;

/** Jumlah aktiviti bagi kohort (jatuh ke tetapan umum, kemudian lalai). */
export async function jumlahAktiviti(kohort?: string | null): Promise<JumlahAktiviti> {
  const rows = await prisma.tetapanMarkah.findMany({
    where: { kategori: { in: kohort ? [KATEGORI, kategoriKohort(kohort)] : [KATEGORI] } },
    select: { kategori: true, namaItem: true, nilaiMarkah: true },
  });
  const j = { ...JUMLAH_AKTIVITI_LALAI };
  // Umum dahulu, kemudian khusus kohort menimpa.
  for (const r of [...rows].sort((a) => (a.kategori === KATEGORI ? -1 : 1))) {
    if ((BAHAGIAN_KEHADIRAN as readonly string[]).includes(r.namaItem) && r.nilaiMarkah > 0) {
      j[r.namaItem as BahagianKehadiran] = Math.round(r.nilaiMarkah);
    }
  }
  return j;
}

/** Jumlah aktiviti bagi beberapa kohort sekali gus (untuk laporan pukal). */
export async function jumlahAktivitiIkutKohort(kohort: (string | null)[]): Promise<Map<string, JumlahAktiviti>> {
  const peta = new Map<string, JumlahAktiviti>();
  for (const k of new Set(kohort)) peta.set(k ?? "", await jumlahAktiviti(k));
  return peta;
}

export async function simpanJumlahAktiviti(j: JumlahAktiviti, kohort?: string | null) {
  const kategori = kohort ? kategoriKohort(kohort) : KATEGORI;
  await prisma.$transaction(
    BAHAGIAN_KEHADIRAN.map((b) =>
      prisma.tetapanMarkah.upsert({
        where: { kategori_namaItem: { kategori, namaItem: b } },
        update: { nilaiMarkah: j[b] },
        create: { kategori, namaItem: b, nilaiMarkah: j[b], markahPenuh: j[b] },
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
