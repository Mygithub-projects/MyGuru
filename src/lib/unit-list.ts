// ===========================================================================
//  Senarai unit kokurikulum — senarai asas rasmi digabung dengan unit sedia
//  ada dalam sistem (distinct dari rekod pelajar). Untuk dropdown borang.
// ===========================================================================
import { prisma } from "./prisma";
import { buangKurungan } from "./pajsk";

const BASELINE: Record<string, string[]> = {
  Sukan: [
    "Olahraga", "Bola Sepak", "Bola Jaring", "Bola Tampar", "Bola Baling",
    "Badminton", "Ping Pong", "Hoki", "Sepak Takraw", "Catur", "Memanah",
    "Silat", "Karate", "Renang", "Ragbi", "Kriket",
  ],
  Kelab: [
    "Kelab Komputer ICT", "Kelab Robotik", "Persatuan Bahasa Melayu",
    "Persatuan Bahasa Inggeris", "Persatuan Bahasa Arab", "Persatuan Bahasa Cina",
    "Kelab Alam Sekitar", "Kelab Usahawan Muda", "Persatuan Sejarah",
    "Persatuan Sains & Matematik", "Kelab Rukun Negara", "Kelab Pencegahan Jenayah",
    "Kelab Seni & Kraf", "Kelab Fotografi",
  ],
  Uniform: [
    "Persekutuan Pengakap Malaysia", "Pandu Puteri Malaysia",
    "Kadet Bomba dan Penyelamat Malaysia", "Kadet Polis", "Kadet Tentera (PKBM)",
    "Bulan Sabit Merah Malaysia (PBSM)", "St. John Ambulans Malaysia",
    "Pergerakan Puteri Islam Malaysia", "TKRS",
  ],
};

export type SenaraiUnit = Record<"Sukan" | "Kelab" | "Uniform", string[]>;

export async function senaraiUnit(): Promise<SenaraiUnit> {
  const koko = await prisma.kokurikulum.findMany({
    select: { jenisKoko: true, namaUnitT5: true, namaUnitT6: true },
  });
  const set: Record<string, Set<string>> = {
    Sukan: new Set(BASELINE.Sukan),
    Kelab: new Set(BASELINE.Kelab),
    Uniform: new Set(BASELINE.Uniform),
  };
  for (const k of koko) {
    const tambah = (n: string | null) => {
      if (!n) return;
      const bersih = buangKurungan(n) || n;
      if (set[k.jenisKoko]) set[k.jenisKoko].add(bersih);
    };
    tambah(k.namaUnitT5);
    tambah(k.namaUnitT6);
  }
  const susun = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b, "ms"));
  return { Sukan: susun(set.Sukan), Kelab: susun(set.Kelab), Uniform: susun(set.Uniform) };
}

/**
 * Hanya unit yang MEMPUNYAI guru penasihat (dari medan seliaan Guru) boleh
 * dipohon — supaya setiap pendaftaran/pertukaran ada penyelia.
 */
export async function senaraiUnitBerpenasihat(): Promise<SenaraiUnit> {
  const guru = await prisma.guru.findMany({
    where: { statusAktif: true },
    select: { sukanDiselia: true, kelabDiselia: true, badanDiselia: true },
  });
  const set: Record<string, Set<string>> = { Sukan: new Set(), Kelab: new Set(), Uniform: new Set() };
  for (const g of guru) {
    if (g.sukanDiselia) set.Sukan.add(buangKurungan(g.sukanDiselia) || g.sukanDiselia);
    if (g.kelabDiselia) set.Kelab.add(buangKurungan(g.kelabDiselia) || g.kelabDiselia);
    if (g.badanDiselia) set.Uniform.add(buangKurungan(g.badanDiselia) || g.badanDiselia);
  }
  const susun = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b, "ms"));
  return { Sukan: susun(set.Sukan), Kelab: susun(set.Kelab), Uniform: susun(set.Uniform) };
}
