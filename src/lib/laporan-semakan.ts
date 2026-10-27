// Senarai laporan SU/NSU (mingguan & projek) untuk semakan guru/admin.
import type { Guru } from "@prisma/client";
import { prisma } from "./prisma";
import { unitSeliaan } from "./workflow";
import { pelajarIdsDalamSkop } from "./guru";
import { urlFail } from "./fail-url";

export type JenisLaporan = "mingguan" | "projek";

export interface LaporanSU {
  id: string;
  jenis: JenisLaporan;
  tajuk: string;
  namaUnit: string | null;
  peringkat: string | null;
  jawatan: string | null;
  tarikh: string | null;
  laporan: string | null;
  setiausaha: string;
  kelas: string | null;
  status: string;
  komen: string | null;
  eviden: string[];
  kertasKerja: string | null;
  dicipta: number; // ms, untuk susunan terkini dahulu
}

/**
 * Semua laporan SU/NSU dalam skop (guru = unit seliaan; null = Admin, seluruh
 * sekolah). Skop sama seperti countPendingGuru(): ikut namaUnit rekod, dengan
 * jatuhan skop pelajar untuk rekod lama tanpa namaUnit. Draf tidak dipaparkan.
 */
export async function senaraiLaporanSU(
  guru: Guru | null,
  opts: { jenis?: string; status?: string } = {}
): Promise<LaporanSU[]> {
  const ids = guru ? await pelajarIdsDalamSkop(guru) : null;
  const units = guru ? await unitSeliaan(guru) : [];
  const whereUnit = ids === null ? {} : { OR: [{ namaUnit: { in: units } }, { namaUnit: null, setiausahaId: { in: ids } }] };
  const status = opts.status ? opts.status : { not: "Draft" };
  const pilihSU = { setiausaha: { select: { nama: true, kelasT6: true } } } as const;

  const [mingguan, projek] = await Promise.all([
    opts.jenis === "projek"
      ? []
      : prisma.laporanMingguan.findMany({
          where: { ...whereUnit, statusSemakan: status },
          include: pilihSU,
          orderBy: { createdAt: "desc" },
        }),
    opts.jenis === "mingguan"
      ? []
      : prisma.laporanProjek.findMany({
          where: { ...whereUnit, statusPengesahan: status },
          include: pilihSU,
          orderBy: { createdAt: "desc" },
        }),
  ]);

  const rows: LaporanSU[] = [
    ...mingguan.map((m) => ({
      id: m.id,
      jenis: "mingguan" as const,
      tajuk: m.namaProgram ?? m.aktiviti,
      namaUnit: m.namaUnit,
      peringkat: m.peringkat,
      jawatan: null,
      tarikh: m.tarikh.toISOString(),
      laporan: m.aktiviti,
      setiausaha: m.setiausaha.nama,
      kelas: m.setiausaha.kelasT6,
      status: m.statusSemakan,
      komen: m.komenGuru,
      eviden: (m.lampiran ?? "").split(",").map((x) => urlFail(x.trim())).filter((x): x is string => !!x),
      kertasKerja: null,
      dicipta: m.createdAt.getTime(),
    })),
    ...projek.map((p) => ({
      id: p.id,
      jenis: "projek" as const,
      tajuk: p.namaProjek,
      namaUnit: p.namaUnit,
      peringkat: p.peringkatProjek,
      jawatan: p.jawatanProjek,
      tarikh: p.tarikh?.toISOString() ?? null,
      // Rekod lama (sebelum templat baharu) tiada laporan — guna kekuatan/kelemahan.
      laporan: p.laporan ?? ([p.kekuatan, p.kelemahan].filter(Boolean).join("\n") || null),
      setiausaha: p.setiausaha.nama,
      kelas: p.setiausaha.kelasT6,
      status: p.statusPengesahan,
      komen: p.komenGuru,
      eviden: [urlFail(p.failLaporanImpak)].filter((x): x is string => !!x),
      kertasKerja: urlFail(p.failKertasKerja),
      dicipta: p.createdAt.getTime(),
    })),
  ];
  return rows.sort((a, b) => b.dicipta - a.dicipta);
}
