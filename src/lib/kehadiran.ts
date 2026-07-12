// ===========================================================================
//  Modul Kehadiran — sesi perjumpaan, tanda kehadiran (senarai / QR), kira
//  markah kehadiran (§1.2, skala 50, bundar ke BAWAH) & kemas kini
//  Pelajar.markahKehadiran.
// ===========================================================================
import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { markahKehadiran, peratusKehadiran, MARKAH_KEHADIRAN_PENUH, JUMLAH_PERJUMPAAN_WAJIB } from "./pajsk";
import { kiraSemulaT6 } from "./workflow";
import type { JenisKoko } from "./enums";

// Jumlah perjumpaan mingguan wajib = 30 kali sepanjang pengajian (§1.2).
// Satu kiraan keseluruhan (bukan berasingan ikut bidang).
const PERJUMPAAN_STANDARD = JUMLAH_PERJUMPAAN_WAJIB;

/** Senarai pelajar (ahli) dalam unit T6 tertentu. */
export async function ahliUnit(namaUnit: string) {
  const koko = await prisma.kokurikulum.findMany({
    where: { namaUnitT6: namaUnit },
    include: { pelajar: { select: { id: true, nama: true, kelasT6: true } } },
  });
  return koko.map((k) => k.pelajar);
}

/** Cipta sesi perjumpaan (oleh SU/NSU). Menjana token untuk imbas QR. */
export async function ciptaSesi(input: {
  jenisKoko: JenisKoko;
  namaUnit: string;
  tarikh: Date;
  bilPerjumpaan: number;
  dibuatOlehId?: string;
}) {
  const token = randomBytes(9).toString("base64url");
  return prisma.sesiKehadiran.upsert({
    where: { namaUnit_bilPerjumpaan: { namaUnit: input.namaUnit, bilPerjumpaan: input.bilPerjumpaan } },
    update: { tarikh: input.tarikh, dibuka: true },
    create: {
      jenisKoko: input.jenisKoko,
      namaUnit: input.namaUnit,
      tarikh: input.tarikh,
      bilPerjumpaan: input.bilPerjumpaan,
      token,
      dibuatOlehId: input.dibuatOlehId,
    },
  });
}

/** Tanda kehadiran sekumpulan ahli (senarai). */
export async function tandaKehadiran(
  sesiId: string,
  tanda: { pelajarId: string; hadir: boolean }[],
  ditandaOlehId?: string
) {
  const sesi = await prisma.sesiKehadiran.findUnique({ where: { id: sesiId } });
  if (!sesi) throw new Error("Sesi kehadiran tidak dijumpai.");

  for (const t of tanda) {
    await prisma.kehadiran.upsert({
      where: {
        pelajarId_namaUnit_bilPerjumpaan: {
          pelajarId: t.pelajarId,
          namaUnit: sesi.namaUnit,
          bilPerjumpaan: sesi.bilPerjumpaan,
        },
      },
      update: { statusHadir: t.hadir, ditandaOlehId },
      create: {
        pelajarId: t.pelajarId,
        jenisKoko: sesi.jenisKoko,
        namaUnit: sesi.namaUnit,
        tarikh: sesi.tarikh,
        bilPerjumpaan: sesi.bilPerjumpaan,
        statusHadir: t.hadir,
        ditandaOlehId,
        sesiId: sesi.id,
      },
    });
    await kiraSemulaKehadiran(t.pelajarId);
  }
}

/** Self check-in melalui token QR (oleh pelajar). */
export async function selfCheckIn(token: string, pelajarId: string) {
  const sesi = await prisma.sesiKehadiran.findUnique({ where: { token } });
  if (!sesi) throw new Error("Token sesi tidak sah.");
  if (!sesi.dibuka) throw new Error("Sesi kehadiran telah ditutup.");

  // Pastikan pelajar ialah ahli unit
  const ahli = await prisma.kokurikulum.findFirst({
    where: { pelajarId, namaUnitT6: sesi.namaUnit },
    select: { id: true },
  });
  if (!ahli) throw new Error("Anda bukan ahli unit ini.");

  await prisma.kehadiran.upsert({
    where: {
      pelajarId_namaUnit_bilPerjumpaan: {
        pelajarId,
        namaUnit: sesi.namaUnit,
        bilPerjumpaan: sesi.bilPerjumpaan,
      },
    },
    update: { statusHadir: true },
    create: {
      pelajarId,
      jenisKoko: sesi.jenisKoko,
      namaUnit: sesi.namaUnit,
      tarikh: sesi.tarikh,
      bilPerjumpaan: sesi.bilPerjumpaan,
      statusHadir: true,
      sesiId: sesi.id,
    },
  });
  await kiraSemulaKehadiran(pelajarId);
  return sesi;
}

/** Guru sahkan sesi → tandakan rekod disahkan. */
export async function sahkanSesi(sesiId: string, guruId: string | null) {
  const sesi = await prisma.sesiKehadiran.update({
    where: { id: sesiId },
    data: { disahkan: true, dibuka: false, guruId },
  });
  await prisma.kehadiran.updateMany({ where: { sesiId }, data: { disahkan: true } });
  return sesi;
}

/**
 * Kira semula markah kehadiran pelajar (§1.2): peratus = FLOOR(hadir/30×100),
 * markah = FLOOR(peratus × 0.5) — skala 50, sentiasa bundar ke BAWAH.
 * Berdasarkan jumlah perjumpaan wajib yang tetap (30 kali). Hanya menulis
 * ganti jika ada sekurang-kurangnya satu rekod (jika tiada, kekalkan import).
 */
export async function kiraSemulaKehadiran(pelajarId: string) {
  const recs = await prisma.kehadiran.findMany({ where: { pelajarId } });
  if (recs.length === 0) return;
  const hadir = recs.filter((r) => r.statusHadir).length;
  const denom = PERJUMPAAN_STANDARD;
  const markah = markahKehadiran(hadir, denom);
  await prisma.pelajar.update({ where: { id: pelajarId }, data: { markahKehadiran: markah } });
  await kiraSemulaT6(pelajarId);
  return { hadir, denom, markah };
}

/** Ringkasan kehadiran keseluruhan pelajar (atas 30 perjumpaan wajib). */
export async function ringkasanKehadiranPelajar(pelajarId: string) {
  const recs = await prisma.kehadiran.findMany({ where: { pelajarId } });
  const hadir = recs.filter((r) => r.statusHadir).length;
  const direkod = recs.length;
  const jumlahSetahun = PERJUMPAAN_STANDARD;
  const markah = markahKehadiran(hadir, jumlahSetahun);
  const peratus = peratusKehadiran(hadir, jumlahSetahun);
  return { hadir, direkod, jumlahSetahun, markah, peratus, markahPenuh: MARKAH_KEHADIRAN_PENUH };
}

/** Ringkasan kehadiran satu sesi: hadir/jumlah + peratus. */
export async function ringkasanSesi(sesiId: string) {
  const recs = await prisma.kehadiran.findMany({ where: { sesiId } });
  const total = recs.length;
  const hadir = recs.filter((r) => r.statusHadir).length;
  const peratus = total ? Math.round((hadir / total) * 1000) / 10 : 0;
  return { total, hadir, peratus };
}

/** Senarai sesi kehadiran untuk unit-unit tertentu (untuk dropdown laporan). */
export async function sesiUntukUnit(units: string[]) {
  if (units.length === 0) return [];
  return prisma.sesiKehadiran.findMany({
    where: { namaUnit: { in: units } },
    orderBy: [{ namaUnit: "asc" }, { bilPerjumpaan: "asc" }],
    select: { id: true, namaUnit: true, bilPerjumpaan: true, tarikh: true },
  });
}

export { PERJUMPAAN_STANDARD };
