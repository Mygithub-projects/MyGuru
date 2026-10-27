// ===========================================================================
//  Pengurusan kitaran hayat kohort (Admin): cipta kohort baharu (bulan ke-8),
//  ubah tarikh mula, tamatkan & arkib (bulan ke-18), aktifkan semula.
//  Arkib: pelajar & akaun log masuk dinyahaktif; data & markah disimpan.
// ===========================================================================
import { prisma } from "./prisma";
import { kitaranKohort, normalKohort } from "./kohort";

export interface InfoKohort {
  nama: string;
  tarikhMula: string;
  status: string;
  tarikhTamat: string | null;
  bulanKe: number;
  jangkaTamat: string;
  jangkaKohortBaharu: string;
  fasa: "awal" | "sediaBaharu" | "patutTamat";
  pelajar: number;
  pelajarAktif: number;
}

export async function senaraiInfoKohort(kini = new Date()): Promise<InfoKohort[]> {
  const [kohort, kiraan] = await Promise.all([
    prisma.kohort.findMany(),
    prisma.pelajar.groupBy({ by: ["kohort", "statusAktif"], where: { kohort: { not: null } }, _count: true }),
  ]);
  return kohort
    .map((k) => {
      const c = kitaranKohort(k.tarikhMula, kini);
      const rows = kiraan.filter((r) => r.kohort === k.nama);
      return {
        nama: k.nama,
        tarikhMula: k.tarikhMula.toISOString(),
        status: k.status,
        tarikhTamat: k.tarikhTamat?.toISOString() ?? null,
        bulanKe: c.bulanKe,
        jangkaTamat: c.jangkaTamat.toISOString(),
        jangkaKohortBaharu: c.jangkaKohortBaharu.toISOString(),
        fasa: c.fasa,
        pelajar: rows.reduce((s, r) => s + r._count, 0),
        pelajarAktif: rows.filter((r) => r.statusAktif).reduce((s, r) => s + r._count, 0),
      };
    })
    .sort((a, b) => b.nama.localeCompare(a.nama, "ms", { numeric: true }));
}

/** Pastikan kohort wujud (dipanggil semasa import); tarikh mula lalai = hari ini. */
export async function pastikanKohort(nama: string, tarikhMula = new Date()) {
  await prisma.kohort.upsert({ where: { nama }, update: {}, create: { nama, tarikhMula } });
}

export async function ciptaKohort(namaInput: string, tarikhMula: Date) {
  const nama = normalKohort(namaInput);
  if (!nama) throw new Error("Nama kohort tidak sah — gunakan format STPM 2028.");
  if (await prisma.kohort.findUnique({ where: { nama } })) throw new Error(`Kohort ${nama} sudah wujud.`);
  return prisma.kohort.create({ data: { nama, tarikhMula } });
}

export async function ubahTarikhMula(nama: string, tarikhMula: Date) {
  return prisma.kohort.update({ where: { nama }, data: { tarikhMula } });
}

/** Tamatkan kohort: arkib — pelajar & akaun dinyahaktif (log masuk ditutup), data disimpan. */
export async function tamatkanKohort(nama: string) {
  const ids = (await prisma.pelajar.findMany({ where: { kohort: nama }, select: { id: true } })).map((p) => p.id);
  await prisma.$transaction([
    prisma.kohort.update({ where: { nama }, data: { status: "Tamat", tarikhTamat: new Date() } }),
    prisma.pelajar.updateMany({ where: { id: { in: ids } }, data: { statusAktif: false } }),
    prisma.user.updateMany({ where: { pelajarId: { in: ids } }, data: { statusAktif: false } }),
  ]);
  return ids.length;
}

/** Batalkan arkib (cth tersilap tekan). */
export async function aktifkanSemulaKohort(nama: string) {
  const ids = (await prisma.pelajar.findMany({ where: { kohort: nama }, select: { id: true } })).map((p) => p.id);
  await prisma.$transaction([
    prisma.kohort.update({ where: { nama }, data: { status: "Aktif", tarikhTamat: null } }),
    prisma.pelajar.updateMany({ where: { id: { in: ids } }, data: { statusAktif: true } }),
    prisma.user.updateMany({ where: { pelajarId: { in: ids } }, data: { statusAktif: true } }),
  ]);
  return ids.length;
}
