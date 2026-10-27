// Lapisan data pelajar — profil & pecahan markah PAJSK T6 (model §1.1)
import { prisma } from "./prisma";
import { ringkasanKehadiranPelajar } from "./kehadiran";
import { markahEkstra } from "./pajsk";
import { itemEkstra, skorUnit, type RekodPelajar, type SkorUnit } from "./skor-unit";
import { jumlahAktiviti, jumlahKehadiranUntuk } from "./tetapan-kehadiran";

export interface BarisPenyertaan {
  jenisKoko: string;
  label: string;
  namaUnit: string;
  /** Skor penuh bidang ini (/100) — sama dengan slip & Borang Rumusan. */
  skor: SkorUnit;
  /** Termasuk dalam 2 bidang terbaik yang dipuratakan (Sukan/Kelab/Uniform). */
  dikira: boolean;
  /** Unit Perkhidmatan: markah ekstra keseluruhan (MAX jawatan UP / anugerah). */
  ekstra: number | null;
}

/** Satu baris pecahan komponen markah (T6 sahaja). `kunci` = kunci i18n stabil
 *  (§8), `kategori` = label BM lalai (fallback untuk PDF/admin). */
export interface BarisMarkah {
  kunci: "kehadiran" | "jawatan" | "penglibatan" | "pencapaian" | "projekJawatan" | "projekPeringkat" | "ekstra";
  kategori: string;
  nilai: number;
  maks: number;
}

/**
 * Unit-unit T6 di mana pelajar memegang jawatan Setiausaha (SU) / Penolong
 * Setiausaha (NSU) — BUKAN semua unit yang disertainya. Sub-peranan SU/NSU
 * ditetapkan pada akaun pelajar (lihat workflow.ts: tetapkanJawatanOlehGuru)
 * berdasarkan jawatan di SATU unit sahaja; unit lain yang disertai pelajar
 * (cth. sebagai Ahli Aktif) berada di luar skop seliaannya.
 */
export async function unitSeliaanSU(pelajarId: string, subRole: string | null | undefined): Promise<string[]> {
  const koko = await prisma.kokurikulum.findMany({
    where: { pelajarId },
    select: { namaUnitT6: true, jawatanT6: true },
  });
  // Padanan tak-peka-huruf-besar/kecil (data sedia ada bercampur kes, cth. "SETIAUSAHA" vs "Setiausaha").
  return koko
    .filter((k) => {
      if (!k.namaUnitT6 || !k.jawatanT6) return false;
      const j = k.jawatanT6.toUpperCase();
      const nsu = j.includes("PENOLONG SETIAUSAHA") || j.includes("NAIB SETIAUSAHA");
      const su = j.includes("SETIAUSAHA") && !nsu;
      return subRole === "NSU" ? nsu : su;
    })
    .map((k) => k.namaUnitT6 as string);
}

export async function getPelajarProfil(pelajarId: string) {
  const pelajar = await prisma.pelajar.findUnique({
    where: { id: pelajarId },
    include: {
      kokurikulum: true,
      pencapaian: { orderBy: { createdAt: "desc" } },
      aktivitiLuar: { orderBy: { createdAt: "desc" } },
      kehadiran: { where: { statusHadir: true, disahkan: true }, select: { jenisKoko: true } },
      laporanProjek: { where: { statusPengesahan: "Approved" } },
    },
  });
  if (!pelajar) return null;

  const byJenis = (j: string) => pelajar.kokurikulum.find((k) => k.jenisKoko === j);
  const labelJenis: Record<string, string> = {
    Kelab: "Kelab/Persatuan",
    Sukan: "Sukan",
    Uniform: "Badan Beruniform",
    Perkhidmatan: "Unit Perkhidmatan",
  };

  // Jawatan tertinggi merentas unit (T6)
  const maxJawT6 = Math.max(0, ...pelajar.kokurikulum.filter((k) => k.jenisKoko !== "Perkhidmatan").map((k) => k.markahJawatanT6 ?? 0));

  // Pecahan komponen model baharu (§1.1): Kehadiran(50) + Jawatan(10) +
  // Penglibatan(10) + Pencapaian(10) + Projek Jawatan(10) + Projek Peringkat(10)
  // = 100 ; Ekstra Kurikulum(10) bonus berasingan.
  const markah: BarisMarkah[] = [
    { kunci: "kehadiran", kategori: "Kehadiran", nilai: pelajar.markahKehadiran, maks: 50 },
    { kunci: "jawatan", kategori: "Jawatan", nilai: maxJawT6, maks: 10 },
    { kunci: "penglibatan", kategori: "Penglibatan", nilai: pelajar.markahPenglibatan, maks: 10 },
    { kunci: "pencapaian", kategori: "Pencapaian", nilai: pelajar.markahPencapaian, maks: 10 },
    { kunci: "projekJawatan", kategori: "Projek — Jawatan", nilai: pelajar.markahProjekJawatan, maks: 10 },
    { kunci: "projekPeringkat", kategori: "Projek — Peringkat", nilai: pelajar.markahProjekPeringkat, maks: 10 },
    { kunci: "ekstra", kategori: "Ekstra Kurikulum (bonus)", nilai: pelajar.markahEkstra, maks: 10 },
  ];

  // Skor bagi SETIAP bidang (/100) — sumber sama dengan slip PAJSK & Borang Rumusan.
  const rekod: RekodPelajar = {
    kehadiran: pelajar.kehadiran,
    pencapaian: pelajar.pencapaian.filter((p) => p.statusSemakan === "Approved"),
    aktivitiLuar: pelajar.aktivitiLuar.filter((a) => a.statusPengesahan === "Approved"),
    laporanProjek: pelajar.laporanProjek,
  };
  const ekstra = markahEkstra(itemEkstra(rekod, pelajar.kokurikulum));
  const jumlah = await jumlahAktiviti();
  const asas = ["Kelab", "Sukan", "Uniform", "Perkhidmatan"]
    .map((jenis) => {
      const k = byJenis(jenis);
      if (!k || !k.namaUnitT6) return null;
      return { jenisKoko: jenis, label: labelJenis[jenis], namaUnit: k.namaUnitT6, skor: skorUnit(rekod, k, jumlahKehadiranUntuk(jumlah, jenis)) };
    })
    .filter((x): x is Omit<BarisPenyertaan, "dikira" | "ekstra"> => x !== null);
  // 2 bidang terbaik (Sukan/Kelab/Uniform) yang dipuratakan untuk markah keseluruhan.
  const duaTerbaik = new Set(
    asas
      .filter((p) => (p.skor.jumlah ?? 0) > 0) // belum ada markah → tiada tanda
      .sort((x, y) => (y.skor.jumlah ?? 0) - (x.skor.jumlah ?? 0))
      .slice(0, 2)
      .map((p) => p.jenisKoko),
  );
  const penyertaan: BarisPenyertaan[] = asas.map((p) => ({
    ...p,
    dikira: duaTerbaik.has(p.jenisKoko),
    ekstra: p.jenisKoko === "Perkhidmatan" ? ekstra : null,
  }));

  // Ringkasan kehadiran keseluruhan (atas 30 perjumpaan/tahun — spec pelajar §2)
  const kehadiran = await ringkasanKehadiranPelajar(pelajarId);

  return { pelajar, markah, penyertaan, kehadiran };
}
