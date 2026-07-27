// ===========================================================================
//  Senarai unit kokurikulum — senarai asas rasmi digabung dengan unit sedia
//  ada dalam sistem (distinct dari rekod pelajar). Untuk dropdown borang.
// ===========================================================================
import { prisma } from "./prisma";
import { buangKurungan } from "./pajsk";

// Senarai rasmi sekolah (§ senarai unit KTE Desa Mahkota). "Perkhidmatan" ialah
// kategori ke-4 berasingan (lihat JENIS_KOKO dalam ./enums.ts).
const BASELINE: Record<string, string[]> = {
  Sukan: [
    "Ping Pong", "Badminton", "Bola Jaring", "Futsal", "Bola Keranjang",
    "Bola Tampar", "Seni Mempertahankan Diri", "Catur",
  ],
  Kelab: [
    "STEM", "Bahasa", "Kebudayaan", "KPJ", "Bimbingan & Kerjaya",
    "Alam Sekitar", "Komputer", "Kewangan", "Pelancongan", "Fotografi",
    "Rukunegara", "Falak", "Muzik", "Informasi", "Koperasi",
  ],
  Uniform: ["PISPA", "PENGAKAP", "St JOHN", "BOMBA"],
  Perkhidmatan: [
    "Unit Perwakilan Pelajar", "Sidang Redaksi", "Unit Koko & QM",
    "Unit Lembaga Pusat Sumber", "Unit Koperator Koperasi", "Unit PRS",
    "Unit Ketua Tingkatan",
  ],
};

export type SenaraiUnit = Record<"Sukan" | "Kelab" | "Uniform" | "Perkhidmatan", string[]>;

export async function senaraiUnit(): Promise<SenaraiUnit> {
  const koko = await prisma.kokurikulum.findMany({
    select: { jenisKoko: true, namaUnitT5: true, namaUnitT6: true },
  });
  const set: Record<string, Set<string>> = {
    Sukan: new Set(BASELINE.Sukan),
    Kelab: new Set(BASELINE.Kelab),
    Uniform: new Set(BASELINE.Uniform),
    Perkhidmatan: new Set(BASELINE.Perkhidmatan),
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
  return {
    Sukan: susun(set.Sukan), Kelab: susun(set.Kelab),
    Uniform: susun(set.Uniform), Perkhidmatan: susun(set.Perkhidmatan),
  };
}

/**
 * Hanya unit yang MEMPUNYAI guru penasihat boleh dipohon — supaya setiap
 * pendaftaran/pertukaran ada penyelia. Sukan/Kelab/Uniform baca medan lapuk
 * `Guru.sukanDiselia/kelabDiselia/badanDiselia` (tiada perubahan tingkah laku).
 * Perkhidmatan (kategori baharu, tiada medan lapuk) baca terus dari
 * `GuruPenasihatKelab` — jadual sumber-kebenaran RBAC yang UI "Urus Guru"
 * (admin) sudah tulis melaluinya.
 */
export async function senaraiUnitBerpenasihat(): Promise<SenaraiUnit> {
  const guru = await prisma.guru.findMany({
    where: { statusAktif: true },
    select: { sukanDiselia: true, kelabDiselia: true, badanDiselia: true },
  });
  const set: Record<string, Set<string>> = {
    Sukan: new Set(), Kelab: new Set(), Uniform: new Set(), Perkhidmatan: new Set(),
  };
  for (const g of guru) {
    if (g.sukanDiselia) set.Sukan.add(buangKurungan(g.sukanDiselia) || g.sukanDiselia);
    if (g.kelabDiselia) set.Kelab.add(buangKurungan(g.kelabDiselia) || g.kelabDiselia);
    if (g.badanDiselia) set.Uniform.add(buangKurungan(g.badanDiselia) || g.badanDiselia);
  }

  const perkhidmatan = await prisma.guruPenasihatKelab.findMany({
    where: { jenisKoko: "Perkhidmatan", guru: { statusAktif: true } },
    select: { namaUnit: true },
  });
  for (const p of perkhidmatan) set.Perkhidmatan.add(buangKurungan(p.namaUnit) || p.namaUnit);

  const susun = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b, "ms"));
  return {
    Sukan: susun(set.Sukan), Kelab: susun(set.Kelab),
    Uniform: susun(set.Uniform), Perkhidmatan: susun(set.Perkhidmatan),
  };
}
