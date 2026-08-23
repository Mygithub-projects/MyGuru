// Lapisan data Guru — kumpul item menunggu tindakan ikut skop seliaan.
import { prisma } from "./prisma";
import { guruSeluruhSekolah, unitSeliaan } from "./workflow";
import { statusPilihanT6 } from "./pajsk";
import type { Guru } from "@prisma/client";

/**
 * pelajarId dalam skop guru (null = seluruh sekolah / tiada had).
 * Peraturan RBAC: Penyelaras/PemantauKUPP/PenolongSU → seluruh sekolah (null).
 * Selainnya (KetuaGP/PenolongKetuaGP/GuruPenasihat) → hanya pelajar dalam
 * UNIT yang ditugaskan secara langsung kepada guru.
 */
export async function pelajarIdsDalamSkop(guru: Guru): Promise<string[] | null> {
  if (guruSeluruhSekolah(guru)) return null;
  const units = await unitSeliaan(guru);
  if (units.length === 0) return [];
  const koko = await prisma.kokurikulum.findMany({
    where: { namaUnitT6: { in: units } },
    select: { pelajarId: true },
  });
  return [...new Set(koko.map((k) => k.pelajarId))];
}

/** Bilangan item menunggu tindakan dalam skop (guru = unit seliaan; null = seluruh sekolah). */
export async function countPendingGuru(guru: Guru | null): Promise<number> {
  const ids = guru ? await pelajarIdsDalamSkop(guru) : null;
  const wherePelajar = ids === null ? {} : { pelajarId: { in: ids } };
  const units = guru ? await unitSeliaan(guru) : [];
  const whereUnit = ids === null ? {} : { setiausahaId: { in: ids } };
  const whereSesi = ids === null ? {} : { namaUnit: { in: units } };
  const [a, b, c, d, e, f, g] = await Promise.all([
    prisma.pencapaian.count({ where: { statusSemakan: "Pending", ...wherePelajar } }),
    prisma.aktivitiLuar.count({ where: { statusPengesahan: "Pending", ...wherePelajar } }),
    prisma.logPertukaran.count({ where: { status: "Pending", ...wherePelajar } }),
    prisma.laporanMingguan.count({ where: { statusSemakan: "Pending", ...whereUnit } }),
    prisma.laporanProjek.count({ where: { statusPengesahan: "Pending", ...whereUnit } }),
    prisma.sesiKehadiran.count({ where: { disahkan: false, ...whereSesi } }),
    prisma.cadanganJawatan.count({ where: { status: "Pending", ...wherePelajar } }),
  ]);
  return a + b + c + d + e + f + g;
}

export async function getGuruDashboard(guru: Guru) {
  const ids = await pelajarIdsDalamSkop(guru);
  const wherePelajar = ids === null ? {} : { pelajarId: { in: ids } };
  const units = await unitSeliaan(guru);
  const whereUnit = ids === null ? {} : { setiausahaId: { in: ids } };
  const whereSesi = ids === null ? {} : { namaUnit: { in: units } };

  const [pencapaian, aktivitiLuar, pertukaran, laporanMingguan, laporanProjek, sesiKehadiran, cadanganJawatan] =
    await Promise.all([
      prisma.pencapaian.findMany({
        where: { statusSemakan: "Pending", ...wherePelajar },
        include: { pelajar: { select: { nama: true, kelasT6: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.aktivitiLuar.findMany({
        where: { statusPengesahan: "Pending", ...wherePelajar },
        include: { pelajar: { select: { nama: true, kelasT6: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.logPertukaran.findMany({
        where: { status: "Pending", ...wherePelajar },
        include: { pelajar: { select: { nama: true, kelasT6: true } } },
        orderBy: { tarikhMohon: "desc" },
      }),
      prisma.laporanMingguan.findMany({
        where: { statusSemakan: "Pending", ...whereUnit },
        include: { setiausaha: { select: { nama: true, kelasT6: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.laporanProjek.findMany({
        where: { statusPengesahan: "Pending", ...whereUnit },
        include: { setiausaha: { select: { nama: true, kelasT6: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sesiKehadiran.findMany({
        where: { disahkan: false, ...whereSesi },
        orderBy: { createdAt: "desc" },
      }),
      prisma.cadanganJawatan.findMany({
        where: { status: "Pending", ...wherePelajar },
        include: { pelajar: { select: { nama: true, kelasT6: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return {
    pencapaian,
    aktivitiLuar,
    pertukaran,
    laporanMingguan,
    laporanProjek,
    sesiKehadiran,
    cadanganJawatan,
    skopSeluruh: ids === null,
  };
}

/**
 * Status pilihan unit T6 dalam skop guru.
 * - Guru unit: senarai ahli (roster) dengan status setiap unit.
 * - Seluruh sekolah: ringkasan kiraan ikut status (elak senarai terlalu besar).
 */
export async function getStatusPilihanT6(guru: Guru) {
  const seluruh = guruSeluruhSekolah(guru);
  const units = await unitSeliaan(guru);
  const koko = await prisma.kokurikulum.findMany({
    where: seluruh ? {} : { namaUnitT6: { in: units } },
    include: { pelajar: { select: { nama: true, kelasT6: true } } },
    orderBy: [{ namaUnitT6: "asc" }],
  });

  const kira = (k: (typeof koko)[number]) =>
    statusPilihanT6({ namaUnitT5: k.namaUnitT5, namaUnitT6: k.namaUnitT6, statusPertukaran: k.statusPertukaran });

  if (seluruh) {
    const counts: Record<string, number> = {};
    for (const k of koko) {
      const s = kira(k);
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return { mode: "ringkasan" as const, counts };
  }

  const rows = koko.map((k) => ({
    nama: k.pelajar.nama,
    kelas: k.pelajar.kelasT6,
    jenisKoko: k.jenisKoko,
    namaUnit: k.namaUnitT6 ?? "-",
    jawatan: k.jawatanT6 ?? "-",
    status: kira(k),
  }));
  return { mode: "roster" as const, rows };
}

/** Laporan yang TELAH DISAHKAN dalam skop guru — untuk muat turun (spec guru §6). */
export async function getLaporanDisahkan(guru: Guru) {
  const seluruh = guruSeluruhSekolah(guru);
  const units = await unitSeliaan(guru);
  if (!seluruh && units.length === 0) return { mingguan: [], projek: [] };
  const whereUnit = seluruh ? {} : { namaUnit: { in: units } };

  const [mingguan, projek] = await Promise.all([
    prisma.laporanMingguan.findMany({
      where: { statusSemakan: "Approved", ...whereUnit },
      include: { setiausaha: { select: { nama: true } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.laporanProjek.findMany({
      where: { statusPengesahan: "Approved", ...whereUnit },
      include: { setiausaha: { select: { nama: true } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
  ]);
  return {
    // tarikh: mingguan guna tarikh aktiviti; projek tiada tarikh aktiviti,
    // guna createdAt (tarikh laporan dicipta) untuk pengisihan.
    mingguan: mingguan.map((m) => ({ id: m.id, tajuk: m.aktiviti, namaUnit: m.namaUnit, jenisKoko: m.jenisKoko, setiausaha: m.setiausaha.nama, tarikh: m.tarikh.toISOString() })),
    projek: projek.map((p) => ({ id: p.id, tajuk: p.namaProjek, namaUnit: p.namaUnit, jenisKoko: p.jenisKoko, setiausaha: p.setiausaha.nama, tarikh: p.createdAt.toISOString() })),
  };
}

export interface AhliUnit {
  pelajarId: string;
  nama: string;
  kelas: string | null;
  jawatan: string | null;
  peringkat: string | null;
  markahJawatan: number;
  subRole: string;
  markahPajskT6: number | null;
  gred: string | null;
  statusButiran: string;
}
export interface UnitAhli {
  namaUnit: string;
  jenisKoko: string;
  ahli: AhliUnit[];
}

/**
 * Senarai nama ahli bagi SETIAP unit yang guru terlibat (spec guru §2).
 * Guru seluruh sekolah → semua unit; guru unit → unit seliaan sahaja.
 */
export async function getSenaraiAhli(guru: Guru): Promise<UnitAhli[]> {
  const seluruh = guruSeluruhSekolah(guru);
  const units = await unitSeliaan(guru);
  if (!seluruh && units.length === 0) return [];

  const koko = await prisma.kokurikulum.findMany({
    where: seluruh
      ? { namaUnitT6: { not: null } }
      : { namaUnitT6: { in: units } },
    include: {
      pelajar: {
        select: {
          id: true, nama: true, kelasT6: true, subRole: true,
          markahPajskT6: true, gredPajskT6: true, statusButiran: true,
        },
      },
    },
    orderBy: [{ namaUnitT6: "asc" }],
  });

  const map = new Map<string, UnitAhli>();
  for (const k of koko) {
    const namaUnit = k.namaUnitT6 as string;
    if (!map.has(namaUnit)) map.set(namaUnit, { namaUnit, jenisKoko: k.jenisKoko, ahli: [] });
    map.get(namaUnit)!.ahli.push({
      pelajarId: k.pelajarId,
      nama: k.pelajar.nama,
      kelas: k.pelajar.kelasT6,
      jawatan: k.jawatanT6,
      peringkat: k.peringkatT6,
      markahJawatan: k.markahJawatanT6 ?? 0,
      subRole: k.pelajar.subRole,
      markahPajskT6: k.pelajar.markahPajskT6,
      gred: k.pelajar.gredPajskT6,
      statusButiran: k.pelajar.statusButiran,
    });
  }
  for (const u of map.values()) u.ahli.sort((a, b) => a.nama.localeCompare(b.nama));
  return [...map.values()].sort((a, b) => a.namaUnit.localeCompare(b.namaUnit));
}

/**
 * Senarai sesi perjumpaan + kehadiran per-pelajar untuk unit dalam skop guru
 * (spec guru §3). Guru seluruh sekolah → semua unit.
 */
export async function getKehadiranGuru(guru: Guru, arah: "asc" | "desc" = "desc") {
  const seluruh = guruSeluruhSekolah(guru);
  const units = await unitSeliaan(guru);
  if (!seluruh && units.length === 0) return [];

  const sesi = await prisma.sesiKehadiran.findMany({
    where: seluruh ? {} : { namaUnit: { in: units } },
    include: {
      kehadiran: {
        include: { pelajar: { select: { nama: true, kelasT6: true } } },
        orderBy: { pelajar: { nama: "asc" } },
      },
    },
    orderBy: [{ tarikh: arah }, { namaUnit: "asc" }, { bilPerjumpaan: "asc" }],
  });

  return sesi.map((s) => {
    const hadir = s.kehadiran.filter((k) => k.statusHadir).length;
    return {
      id: s.id,
      namaUnit: s.namaUnit,
      jenisKoko: s.jenisKoko,
      bilPerjumpaan: s.bilPerjumpaan,
      tarikh: s.tarikh,
      disahkan: s.disahkan,
      hadir,
      jumlah: s.kehadiran.length,
      ahli: s.kehadiran.map((k) => ({
        nama: k.pelajar.nama,
        kelas: k.pelajar.kelasT6,
        hadir: k.statusHadir,
      })),
    };
  });
}
