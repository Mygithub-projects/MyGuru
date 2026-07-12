// Lapisan data pelajar — profil & pecahan markah PAJSK T6 (model §1.1)
import { prisma } from "./prisma";
import { ringkasanKehadiranPelajar } from "./kehadiran";

export interface BarisPenyertaan {
  jenisKoko: string;
  label: string;
  namaUnit: string;
  jawatan: string | null;
  peringkat: string | null;
  markahJawatan: number;
  markahPeringkat: number;
  jumlah: number;
}

/** Satu baris pecahan komponen markah (T6 sahaja). `kunci` = kunci i18n stabil
 *  (§8), `kategori` = label BM lalai (fallback untuk PDF/admin). */
export interface BarisMarkah {
  kunci: "kehadiran" | "jawatan" | "penglibatan" | "pencapaian" | "projekJawatan" | "projekPeringkat" | "ekstra";
  kategori: string;
  nilai: number;
  maks: number;
}

export async function getPelajarProfil(pelajarId: string) {
  const pelajar = await prisma.pelajar.findUnique({
    where: { id: pelajarId },
    include: {
      kokurikulum: true,
      pencapaian: { orderBy: { createdAt: "desc" } },
      aktivitiLuar: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!pelajar) return null;

  const byJenis = (j: string) => pelajar.kokurikulum.find((k) => k.jenisKoko === j);
  const labelJenis: Record<string, string> = {
    Kelab: "Kelab/Persatuan",
    Sukan: "Sukan",
    Uniform: "Badan Beruniform",
  };

  // Jawatan tertinggi merentas unit (T6)
  const maxJawT6 = Math.max(0, ...pelajar.kokurikulum.map((k) => k.markahJawatanT6 ?? 0));

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

  // Markah bagi SETIAP penyertaan/unit (spec pelajar §1)
  const penyertaan: BarisPenyertaan[] = ["Kelab", "Sukan", "Uniform"]
    .map((jenis) => {
      const k = byJenis(jenis);
      if (!k || !k.namaUnitT6) return null;
      const mJ = k.markahJawatanT6 ?? 0;
      const mP = k.markahPeringkatT6 ?? 0;
      return {
        jenisKoko: jenis,
        label: labelJenis[jenis],
        namaUnit: k.namaUnitT6,
        jawatan: k.jawatanT6,
        peringkat: k.peringkatT6,
        markahJawatan: mJ,
        markahPeringkat: mP,
        jumlah: Math.round((mJ + mP) * 100) / 100,
      };
    })
    .filter((x): x is BarisPenyertaan => x !== null);

  // Ringkasan kehadiran keseluruhan (atas 30 perjumpaan/tahun — spec pelajar §2)
  const kehadiran = await ringkasanKehadiranPelajar(pelajarId);

  return { pelajar, markah, penyertaan, kehadiran };
}
