// ===========================================================================
//  Pendaftaran unit SP/KP/BU pelajar baharu dengan had ahli setiap unit.
//  Admin menetapkan had bagi setiap unit untuk satu kohort (cth STPM 2028).
//  Unit tanpa had = tiada had; had 0 = unit ditutup. Pendaftaran terus
//  berkuat kuasa (siapa cepat dia dapat) selagi ada kekosongan.
// ===========================================================================
import { prisma } from "./prisma";
import { senaraiUnit } from "./unit-list";
import { kiraSemulaT6 } from "./workflow";

export const JENIS_DAFTAR = ["Sukan", "Kelab", "Uniform"] as const;
export type JenisDaftar = (typeof JENIS_DAFTAR)[number];

export interface KuotaUnit {
  jenisKoko: JenisDaftar;
  namaUnit: string;
  had: number | null; // null = tiada had
  ahli: number;
}

/** Semua unit SP/KP/BU dengan had & bilangan ahli semasa bagi satu kohort. */
export async function kuotaUnit(kohort: string | null): Promise<KuotaUnit[]> {
  const [senarai, had, kiraan] = await Promise.all([
    senaraiUnit(),
    kohort ? prisma.hadUnit.findMany({ where: { kohort } }) : Promise.resolve([]),
    prisma.kokurikulum.groupBy({
      by: ["namaUnitT6"],
      where: { jenisKoko: { in: [...JENIS_DAFTAR] }, namaUnitT6: { not: null }, pelajar: { kohort } },
      _count: true,
    }),
  ]);
  const hadIkutUnit = new Map(had.map((h) => [h.namaUnit, h.had]));
  const ahliIkutUnit = new Map(kiraan.map((k) => [k.namaUnitT6!, k._count]));
  return JENIS_DAFTAR.flatMap((jenisKoko) =>
    senarai[jenisKoko].map((namaUnit) => ({
      jenisKoko,
      namaUnit,
      had: hadIkutUnit.get(namaUnit) ?? null,
      ahli: ahliIkutUnit.get(namaUnit) ?? 0,
    })),
  );
}

/** Kohort yang sudah mempunyai had ditetapkan (termasuk kohort akan datang tanpa pelajar). */
export async function kohortBerhad(): Promise<string[]> {
  const rows = await prisma.hadUnit.findMany({ distinct: ["kohort"], select: { kohort: true } });
  return rows.map((r) => r.kohort);
}

/** Had tersimpan satu kohort sebagai peta unit → had (untuk "salin had"). */
export async function hadIkutUnit(kohort: string): Promise<Record<string, number>> {
  const rows = await prisma.hadUnit.findMany({ where: { kohort }, select: { namaUnit: true, had: true } });
  return Object.fromEntries(rows.map((r) => [r.namaUnit, r.had]));
}

/** Simpan had (null/kosong = buang had) bagi satu kohort. */
export async function simpanHad(
  kohort: string,
  items: { jenisKoko: JenisDaftar; namaUnit: string; had: number | null }[],
) {
  await prisma.$transaction(
    items.map((i) =>
      i.had === null
        ? prisma.hadUnit.deleteMany({ where: { kohort, namaUnit: i.namaUnit } })
        : prisma.hadUnit.upsert({
            where: { kohort_namaUnit: { kohort, namaUnit: i.namaUnit } },
            update: { had: i.had, jenisKoko: i.jenisKoko },
            create: { kohort, namaUnit: i.namaUnit, jenisKoko: i.jenisKoko, had: i.had },
          }),
    ),
  );
}

/**
 * Daftar unit SP/KP/BU yang belum ada bagi pelajar, sekali gus. Kuota disemak
 * dalam transaksi dengan kunci nasihat (advisory lock) setiap unit supaya dua
 * pelajar tidak boleh mengambil tempat terakhir yang sama serentak.
 */
export async function daftarUnitPelajar(pelajarId: string, pilihan: Partial<Record<JenisDaftar, string>>) {
  const senarai = await senaraiUnit();
  const daftar = await prisma.$transaction(async (tx) => {
    const pelajar = await tx.pelajar.findUnique({
      where: { id: pelajarId },
      select: { kohort: true, kokurikulum: { select: { jenisKoko: true, namaUnitT6: true } } },
    });
    if (!pelajar) throw new Error("Pelajar tidak dijumpai.");

    const belum = JENIS_DAFTAR.filter((j) => !pelajar.kokurikulum.some((k) => k.jenisKoko === j && k.namaUnitT6));
    if (belum.length === 0) throw new Error("Anda telah berdaftar dalam semua bahagian. Pendaftaran ditutup.");

    const hasil: { jenisKoko: JenisDaftar; namaUnit: string }[] = [];
    for (const jenisKoko of belum) {
      const namaUnit = pilihan[jenisKoko]?.trim();
      if (!namaUnit) throw new Error(`Sila pilih unit bagi ${jenisKoko}.`);
      if (!senarai[jenisKoko].includes(namaUnit)) throw new Error(`Unit "${namaUnit}" tidak sah.`);

      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`hadunit:${pelajar.kohort ?? ""}:${namaUnit}`}))`;
      const had = pelajar.kohort
        ? await tx.hadUnit.findUnique({ where: { kohort_namaUnit: { kohort: pelajar.kohort, namaUnit } } })
        : null;
      if (had) {
        const ahli = await tx.kokurikulum.count({
          where: { jenisKoko, namaUnitT6: namaUnit, pelajar: { kohort: pelajar.kohort } },
        });
        if (ahli >= had.had) throw new Error(`Unit "${namaUnit}" sudah penuh (${had.had} ahli). Sila pilih unit lain.`);
      }

      await tx.kokurikulum.upsert({
        where: { pelajarId_jenisKoko: { pelajarId, jenisKoko } },
        update: {
          namaUnitT6: namaUnit, jawatanT6: "Ahli Aktif", peringkatT6: "Sekolah",
          statusPertukaran: "Approved", tarikhKemaskini: new Date(),
        },
        create: {
          pelajarId, jenisKoko, namaUnitT6: namaUnit, jawatanT6: "Ahli Aktif", peringkatT6: "Sekolah",
          statusPertukaran: "Approved",
        },
      });
      // Permohonan lama yang masih menunggu bagi bahagian ini sudah tidak relevan.
      await tx.logPertukaran.updateMany({
        where: { pelajarId, jenisKoko, status: "Pending" },
        data: { status: "Reject", komenGuru: "Digantikan oleh pendaftaran terus", tarikhLulus: new Date() },
      });
      await tx.logPertukaran.create({
        data: {
          pelajarId, jenisKoko, unitLama: null, unitBaru: namaUnit, status: "Approved",
          sebab: "Pendaftaran pelajar (kuota)", tarikhLulus: new Date(), komenGuru: "Pendaftaran terus — dalam had ahli",
        },
      });
      hasil.push({ jenisKoko, namaUnit });
    }
    return hasil;
  });
  await kiraSemulaT6(pelajarId);
  return daftar;
}
