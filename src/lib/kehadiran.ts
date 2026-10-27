// ===========================================================================
//  Modul Kehadiran — sesi perjumpaan, tanda kehadiran (senarai / QR), kira
//  markah kehadiran (§1.2, skala 50, kaedah KTE Desa Mahkota) & kemas kini
//  Pelajar.markahKehadiran.
// ===========================================================================
import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { markahKehadiran, peratusKehadiran, MARKAH_KEHADIRAN_PENUH, JUMLAH_PERJUMPAAN_WAJIB } from "./pajsk";
import { kiraSemulaT6 } from "./workflow";
import { jumlahAktiviti, jumlahKeseluruhan } from "./tetapan-kehadiran";
import type { JenisKoko } from "./enums";
import { kohortPelajar } from "./kohort-pilihan";

// Jumlah perjumpaan mingguan wajib = 30 kali sepanjang pengajian (§1.2).
// Satu kiraan keseluruhan (bukan berasingan ikut bidang).
const PERJUMPAAN_STANDARD = JUMLAH_PERJUMPAAN_WAJIB;

/** Senarai pelajar (ahli) dalam unit T6 tertentu — hanya kohort yang sama. */
export async function ahliUnit(namaUnit: string, kohort: string | null) {
  const koko = await prisma.kokurikulum.findMany({
    where: { namaUnitT6: namaUnit, pelajar: { kohort, statusAktif: true } },
    include: { pelajar: { select: { id: true, nama: true, kelasT6: true } } },
  });
  return koko.map((k) => k.pelajar);
}

/** Cipta sesi perjumpaan (oleh SU/NSU). Menjana token untuk imbas QR.
 *  Menolak jika perjumpaan# itu sudah wujud DAN telah disahkan guru — supaya
 *  sesi lampau yang telah disahkan tidak tertimpa secara senyap oleh SU yang
 *  tersilap guna semula nombor perjumpaan lama. */
export async function ciptaSesi(input: {
  kohort: string;
  jenisKoko: JenisKoko;
  namaUnit: string;
  tarikh: Date;
  bilPerjumpaan: number;
  dibuatOlehId?: string;
}) {
  const kunci = { kohort: input.kohort, namaUnit: input.namaUnit, bilPerjumpaan: input.bilPerjumpaan };
  const sediaAda = await prisma.sesiKehadiran.findUnique({
    where: { kohort_namaUnit_bilPerjumpaan: kunci },
  });
  if (sediaAda?.disahkan) {
    const tarikhLama = sediaAda.tarikh.toISOString().slice(0, 10);
    throw new Error(
      `Perjumpaan #${input.bilPerjumpaan} untuk unit ini sudah disahkan guru (${tarikhLama}). ` +
        `Guna nombor perjumpaan seterusnya untuk sesi baharu.`
    );
  }

  const token = randomBytes(9).toString("base64url");
  return prisma.sesiKehadiran.upsert({
    where: { kohort_namaUnit_bilPerjumpaan: kunci },
    update: { tarikh: input.tarikh, dibuka: true },
    create: {
      kohort: input.kohort,
      jenisKoko: input.jenisKoko,
      namaUnit: input.namaUnit,
      tarikh: input.tarikh,
      bilPerjumpaan: input.bilPerjumpaan,
      token,
      dibuatOlehId: input.dibuatOlehId,
    },
  });
}

/** Nombor perjumpaan seterusnya (belum wujud) untuk unit ini — cadangan UI
 *  supaya borang "Buka Sesi" tidak default ke #1 dan tertimpa sesi lampau. */
export async function bilPerjumpaanSeterusnya(namaUnit: string, kohort: string): Promise<number> {
  const terbesar = await prisma.sesiKehadiran.aggregate({
    where: { namaUnit, kohort },
    _max: { bilPerjumpaan: true },
  });
  return (terbesar._max.bilPerjumpaan ?? 0) + 1;
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

  // Pastikan pelajar ialah ahli unit DAN dalam kohort sesi ini
  const ahli = await prisma.kokurikulum.findFirst({
    where: { pelajarId, namaUnitT6: sesi.namaUnit, ...(sesi.kohort ? { pelajar: { kohort: sesi.kohort } } : {}) },
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

/** Guru/Admin sahkan sesi → tandakan rekod disahkan, kemudian kira semula
 *  markah ahli sesi (kehadiran hanya dikira selepas disahkan). */
export async function sahkanSesi(sesiId: string, guruId: string | null) {
  const sesi = await prisma.sesiKehadiran.update({
    where: { id: sesiId },
    data: { disahkan: true, dibuka: false, guruId },
  });
  await prisma.kehadiran.updateMany({ where: { sesiId }, data: { disahkan: true } });
  const ahli = await prisma.kehadiran.findMany({ where: { sesiId }, select: { pelajarId: true }, distinct: ["pelajarId"] });
  for (const a of ahli) await kiraSemulaKehadiran(a.pelajarId);
  return sesi;
}

/**
 * Kira semula markah kehadiran pelajar (§1.2, kaedah KTE Desa Mahkota):
 * 2 aktiviti = 1 perjumpaan PAJSK (maks 15), markah = perjumpaan/15 × 50.
 * Berdasarkan jumlah perjumpaan wajib yang tetap (30 kali). Pelajar tanpa
 * sebarang rekod kekal nilai import; jika ada rekod, HANYA rekod yang telah
 * DISAHKAN guru/admin dikira (0 jika belum ada yang disahkan).
 */
export async function kiraSemulaKehadiran(pelajarId: string) {
  const recs = await prisma.kehadiran.findMany({ where: { pelajarId } });
  if (recs.length === 0) return;
  const hadir = recs.filter((r) => r.statusHadir && r.disahkan).length;
  const denom = jumlahKeseluruhan(await jumlahAktiviti(await kohortPelajar(pelajarId))); // cth 16 + 17 + 14 = 47
  const markah = markahKehadiran(hadir, denom);
  await prisma.pelajar.update({ where: { id: pelajarId }, data: { markahKehadiran: markah } });
  await kiraSemulaT6(pelajarId);
  return { hadir, denom, markah };
}

/**
 * Kira semula markah SEMUA pelajar (cth. selepas Admin menukar jumlah aktiviti
 * bahagian). Pelajar dengan rekod kehadiran: kehadiran + T6; tanpa rekod: T6.
 */
export async function kiraSemulaSemuaPelajar(kohort?: string | null) {
  const senarai = await prisma.pelajar.findMany({
    where: kohort ? { kohort } : undefined,
    select: { id: true, _count: { select: { kehadiran: true } } },
  });
  for (const p of senarai) {
    if (p._count.kehadiran > 0) await kiraSemulaKehadiran(p.id);
    else await kiraSemulaT6(p.id);
  }
  return senarai.length;
}

/** Ringkasan kehadiran keseluruhan pelajar (atas jumlah aktiviti semua bahagian — tetapan Admin).
 *  `direkod` dihadkan pada jumlahSetahun — perjumpaan tambahan yang berlaku
 *  selepas kuota wajib dipenuhi tetap disimpan (tidak dipadam), tetapi tidak
 *  dipaparkan melebihi jumlah wajib supaya tidak kelihatan bercanggah dengan
 *  penyebut jumlah di sebelahnya. */
export async function ringkasanKehadiranPelajar(pelajarId: string) {
  const recs = await prisma.kehadiran.findMany({ where: { pelajarId } });
  // Hadir & markah hanya daripada sesi yang telah disahkan.
  const hadir = recs.filter((r) => r.statusHadir && r.disahkan).length;
  const jumlahSetahun = jumlahKeseluruhan(await jumlahAktiviti(await kohortPelajar(pelajarId)));
  const direkod = Math.min(recs.length, jumlahSetahun);
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
export async function sesiUntukUnit(units: string[], kohort: string | null) {
  if (units.length === 0) return [];
  return prisma.sesiKehadiran.findMany({
    where: { namaUnit: { in: units }, ...(kohort ? { kohort } : {}) },
    orderBy: [{ namaUnit: "asc" }, { bilPerjumpaan: "asc" }],
    select: { id: true, namaUnit: true, bilPerjumpaan: true, tarikh: true },
  });
}

export { PERJUMPAAN_STANDARD };
