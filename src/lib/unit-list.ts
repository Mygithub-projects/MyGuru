// ===========================================================================
//  Senarai unit kokurikulum — senarai rasmi TETAP (BASELINE sahaja, tiada
//  gabungan dengan nama lapuk dari rekod pelajar). Untuk dropdown borang.
// ===========================================================================
import { prisma } from "./prisma";
import { buangKurungan } from "./pajsk";

// Senarai rasmi sekolah (§ senarai unit KTE Desa Mahkota). "Perkhidmatan" ialah
// kategori ke-4 berasingan (lihat JENIS_KOKO dalam ./enums.ts).
const BASELINE: Record<string, string[]> = {
  Sukan: [
    "Bola Tampar", "Bola Keranjang", "Badminton", "Catur",
    "Bola Jaring", "Futsal", "Ping Pong", "Seni Mempertahankan Diri",
  ],
  Kelab: [
    "Persatuan Sains dan Matematik", "Persatuan Bahasa", "Kelab Kebudayaan dan Kesenian",
    "Kelab Pencegahan Jenayah", "Kelab Bimbingan dan Kerjaya", "Kelab Alam Sekitar dan Keceriaan",
    "Kelab Komputer", "Kelab Kewangan dan Pengguna", "Kelab Pelancongan dan Rekreasi",
    "Kelab Fotografi", "Kelab Rukun Negara", "Kelab Falak", "Kelab Muzik",
    "Kelab Informasi", "Kelab Koperasi",
  ],
  Uniform: ["Pengakap Kelana", "St. John Ambulans Malaysia", "Briged Bomba", "PISPA"],
  Perkhidmatan: [
    "Unit Perwakilan Pelajar", "Sidang Redaksi", "Unit Koko & QM",
    "Unit Lembaga Pusat Sumber", "Unit Koperator Koperasi", "Unit PRS",
    "Unit Ketua Tingkatan",
  ],
};

export type SenaraiUnit = Record<"Sukan" | "Kelab" | "Uniform" | "Perkhidmatan", string[]>;

export async function senaraiUnit(): Promise<SenaraiUnit> {
  const susun = (arr: string[]) => [...arr].sort((a, b) => a.localeCompare(b, "ms"));
  return {
    Sukan: susun(BASELINE.Sukan), Kelab: susun(BASELINE.Kelab),
    Uniform: susun(BASELINE.Uniform), Perkhidmatan: susun(BASELINE.Perkhidmatan),
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
