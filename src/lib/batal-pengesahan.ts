// ===========================================================================
//  Batal Pengesahan — kembalikan rekod yang telah disahkan kepada "Pending".
//  Dibenarkan: guru yang mengesahkan, Ketua Unit Kokurikulum, dan Admin.
//  Markah pelajar dikira semula; pelajar/guru dimaklumkan.
//  (Tukar unit & jawatan TIDAK termasuk: kelulusan itu mengubah unit/jawatan
//  pelajar dan nilai lama tidak disimpan, jadi tidak boleh diundur dengan selamat.)
// ===========================================================================
import type { Guru } from "@prisma/client";
import { prisma } from "./prisma";
import { dbKohort } from "./prisma-kohort";
import { kohortDipilih } from "./kohort-pilihan";
import { kiraSemulaT6 } from "./workflow";
import { notify, notifyPelajar } from "./notifikasi";

export const JENIS_BATAL = [
  "butiran",
  "ekstra",
  "pencapaian",
  "aktivitiLuar",
  "aktivitiUnit",
  "laporanMingguan",
  "laporanProjek",
  "kehadiranGuru",
] as const;
export type JenisBatal = (typeof JENIS_BATAL)[number];

export const LABEL_JENIS: Record<JenisBatal, { ms: string; en: string }> = {
  butiran: { ms: "Butiran pelajar", en: "Student details" },
  ekstra: { ms: "Ekstra Kurikulum", en: "Extra-curricular" },
  pencapaian: { ms: "Pencapaian", en: "Achievement" },
  aktivitiLuar: { ms: "Aktiviti luar", en: "External activity" },
  aktivitiUnit: { ms: "Aktiviti unit", en: "Unit activity" },
  laporanMingguan: { ms: "Laporan mingguan", en: "Weekly report" },
  laporanProjek: { ms: "Laporan projek", en: "Project report" },
  kehadiranGuru: { ms: "Kehadiran guru", en: "Teacher attendance" },
};

/** Pelaku: guru (null = Admin) + userId sesi. */
export interface Pelaku {
  guru: Pick<Guru, "id" | "jawatanKoko"> | null;
  userId: string;
}

/** Admin & Ketua Unit Kokurikulum boleh membatalkan semua pengesahan. */
export function pelakuPenuh(p: Pelaku): boolean {
  return !p.guru || p.guru.jawatanKoko === "KetuaUnitKoko";
}

/**
 * Boleh batal? `pengesahGuruId` = guruId pengesah; `pengesahUserId` = userId
 * pengesah (kehadiran guru menyimpan userId). Rekod lama tanpa pengesah
 * tercatat hanya boleh dibatalkan oleh Ketua Unit Kokurikulum / Admin.
 */
export function bolehBatal(p: Pelaku, pengesah: { guruId?: string | null; userId?: string | null }): boolean {
  if (pelakuPenuh(p)) return true;
  if (pengesah.guruId && pengesah.guruId === p.guru!.id) return true;
  if (pengesah.userId && pengesah.userId === p.userId) return true;
  return false;
}

export interface RekodDisahkan {
  jenis: JenisBatal;
  id: string;
  tajuk: string;
  pelajar: string | null;
  unit: string | null;
  tarikhSahkan: string | null;
  pengesah: string | null;
}

const HAD = 300;
const tarikh = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/** Senarai rekod disahkan yang pelaku BOLEH batalkan (kohort dipilih). */
export async function senaraiBolehBatal(p: Pelaku, jenis: JenisBatal): Promise<RekodDisahkan[]> {
  const db = await dbKohort();
  const penuh = pelakuPenuh(p);
  const gid = p.guru?.id ?? "__tiada__";
  const milik = (medan: string) => (penuh ? {} : { [medan]: gid });

  let rows: (RekodDisahkan & { pengesahGuruId?: string | null; pengesahUserId?: string | null })[] = [];
  switch (jenis) {
    case "butiran": {
      const r = await db.pelajar.findMany({
        where: { statusButiran: "Approved", ...milik("disahkanOlehId") },
        select: { id: true, nama: true, kelasT6: true, tarikhSahkan: true, disahkanOlehId: true },
        orderBy: { tarikhSahkan: "desc" }, take: HAD,
      });
      rows = r.map((x) => ({ jenis, id: x.id, tajuk: x.kelasT6 ?? "-", pelajar: x.nama, unit: null,
        tarikhSahkan: tarikh(x.tarikhSahkan), pengesah: null, pengesahGuruId: x.disahkanOlehId }));
      break;
    }
    case "ekstra":
    case "pencapaian": {
      const r = await db.pencapaian.findMany({
        where: {
          statusSemakan: "Approved",
          ...(jenis === "ekstra" ? { kategori: "ekstra" } : { OR: [{ kategori: null }, { kategori: { not: "ekstra" } }] }),
          ...milik("disahkanOlehId"),
        },
        include: { pelajar: { select: { nama: true } } },
        orderBy: { createdAt: "desc" }, take: HAD,
      });
      rows = r.map((x) => ({ jenis, id: x.id, tajuk: `${x.namaPencapaian} (${x.markah} markah)`, pelajar: x.pelajar.nama,
        unit: x.namaUnit, tarikhSahkan: tarikh(x.tarikh ?? x.createdAt), pengesah: null, pengesahGuruId: x.disahkanOlehId }));
      break;
    }
    case "aktivitiLuar": {
      const r = await db.aktivitiLuar.findMany({
        where: { statusPengesahan: "Approved", ...milik("guruPengiringId") },
        include: { pelajar: { select: { nama: true } } },
        orderBy: { createdAt: "desc" }, take: HAD,
      });
      rows = r.map((x) => ({ jenis, id: x.id, tajuk: `${x.namaAktiviti} · ${x.peringkat}`, pelajar: x.pelajar.nama,
        unit: x.namaUnit, tarikhSahkan: tarikh(x.tarikhJanaECert ?? x.tarikh ?? x.createdAt), pengesah: null, pengesahGuruId: x.guruPengiringId }));
      break;
    }
    case "aktivitiUnit": {
      const kohort = await kohortDipilih();
      const r = await prisma.aktivitiUnit.findMany({
        where: { statusPengesahan: "Approved", ...(kohort ? { kohort } : {}), ...milik("disahkanOlehId") },
        include: { _count: { select: { peserta: true } } },
        orderBy: { tarikhSahkan: "desc" }, take: HAD,
      });
      rows = r.map((x) => ({ jenis, id: x.id, tajuk: `${x.namaAktiviti} · ${x.peringkat} (${x._count.peserta} peserta)`,
        pelajar: null, unit: x.namaUnit, tarikhSahkan: tarikh(x.tarikhSahkan ?? x.tarikh ?? x.createdAt), pengesah: null, pengesahGuruId: x.disahkanOlehId }));
      break;
    }
    case "laporanMingguan": {
      const r = await db.laporanMingguan.findMany({
        where: { statusSemakan: "Approved", ...milik("disahkanOlehId") },
        include: { setiausaha: { select: { nama: true } } },
        orderBy: { tarikhSahkan: "desc" }, take: HAD,
      });
      rows = r.map((x) => ({ jenis, id: x.id, tajuk: x.namaProgram ?? x.aktiviti.slice(0, 80), pelajar: x.setiausaha.nama,
        unit: x.namaUnit, tarikhSahkan: tarikh(x.tarikhSahkan ?? x.tarikh), pengesah: x.disahkanOleh, pengesahGuruId: x.disahkanOlehId }));
      break;
    }
    case "laporanProjek": {
      const r = await db.laporanProjek.findMany({
        where: { statusPengesahan: "Approved", ...milik("disahkanOlehId") },
        include: { setiausaha: { select: { nama: true } } },
        orderBy: { tarikhSahkan: "desc" }, take: HAD,
      });
      rows = r.map((x) => ({ jenis, id: x.id, tajuk: x.namaProjek, pelajar: x.setiausaha.nama,
        unit: x.namaUnit, tarikhSahkan: tarikh(x.tarikhSahkan ?? x.tarikh ?? x.createdAt), pengesah: x.disahkanOleh, pengesahGuruId: x.disahkanOlehId }));
      break;
    }
    case "kehadiranGuru": {
      const r = await db.kehadiranGuru.findMany({
        where: { statusSemakan: "Approved", ...(penuh ? {} : { disemakOlehId: p.userId }) },
        include: { guru: { select: { nama: true } }, sesi: { select: { namaUnit: true, bilPerjumpaan: true, tarikh: true } } },
        orderBy: { tarikhSemak: "desc" }, take: HAD,
      });
      rows = r.map((x) => ({ jenis, id: x.id, tajuk: `${x.guru.nama} · Perjumpaan ${x.sesi.bilPerjumpaan} (${x.sesi.tarikh.toLocaleDateString("ms-MY")})`,
        pelajar: null, unit: x.sesi.namaUnit, tarikhSahkan: tarikh(x.tarikhSemak), pengesah: null, pengesahUserId: x.disemakOlehId }));
      break;
    }
  }

  // Nama pengesah (jika belum ada label).
  const guruIds = [...new Set(rows.map((r) => r.pengesahGuruId).filter((x): x is string => !!x))];
  const userIds = [...new Set(rows.map((r) => r.pengesahUserId).filter((x): x is string => !!x))];
  const [guru, user] = await Promise.all([
    guruIds.length ? prisma.guru.findMany({ where: { id: { in: guruIds } }, select: { id: true, nama: true } }) : [],
    userIds.length ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true, guru: { select: { nama: true } } } }) : [],
  ]);
  const namaGuru = new Map(guru.map((g) => [g.id, g.nama]));
  const namaUser = new Map(user.map((u) => [u.id, u.guru?.nama ?? u.username]));
  return rows.map(({ pengesahGuruId, pengesahUserId, ...r }) => ({
    ...r,
    pengesah: r.pengesah ?? (pengesahGuruId ? namaGuru.get(pengesahGuruId) ?? null : pengesahUserId ? namaUser.get(pengesahUserId) ?? null : null),
  }));
}

/** Batalkan satu pengesahan. Lempar Error (mesej untuk pengguna) jika tidak dibenarkan. */
export async function batalPengesahan(p: Pelaku, jenis: JenisBatal, id: string, sebab: string): Promise<string> {
  const ralat = (m: string) => { throw new Error(m); };
  const tolak = () => ralat("Hanya guru yang mengesahkan, Ketua Unit Kokurikulum atau Admin boleh membatalkan pengesahan ini");
  const nota = ` Sebab: ${sebab}`;

  switch (jenis) {
    case "butiran": {
      const r = await prisma.pelajar.findUnique({ where: { id }, select: { statusButiran: true, disahkanOlehId: true } });
      if (!r) return ralat("Pelajar tidak dijumpai");
      if (r.statusButiran !== "Approved") return ralat("Butiran pelajar ini belum disahkan");
      if (!bolehBatal(p, { guruId: r.disahkanOlehId })) return tolak();
      await prisma.pelajar.update({ where: { id }, data: { statusButiran: "Pending", disahkanOlehId: null, tarikhSahkan: null } });
      await kiraSemulaT6(id);
      await notifyPelajar(id, { tajuk: "Pengesahan butiran dibatalkan", mesej: `Pengesahan butiran anda dibatalkan.${nota}`, jenis: "kuiri", pautan: "/pelajar" });
      return "Pengesahan butiran pelajar dibatalkan";
    }
    case "ekstra":
    case "pencapaian": {
      const r = await prisma.pencapaian.findUnique({ where: { id } });
      if (!r || (jenis === "ekstra") !== (r.kategori === "ekstra")) return ralat("Rekod tidak dijumpai");
      if (r.statusSemakan !== "Approved") return ralat("Rekod ini belum disahkan");
      if (!bolehBatal(p, { guruId: r.disahkanOlehId })) return tolak();
      await prisma.pencapaian.update({
        where: { id },
        data: { statusSemakan: "Pending", markah: 0, perkaraEkstra: null, disahkanOlehId: null, komenGuru: sebab },
      });
      await kiraSemulaT6(r.pelajarId);
      await notifyPelajar(r.pelajarId, {
        tajuk: "Pengesahan dibatalkan",
        mesej: `Pengesahan "${r.namaPencapaian}" dibatalkan dan menunggu semakan semula.${nota}`,
        jenis: "kuiri", pautan: jenis === "ekstra" ? "/pelajar/ekstra" : "/pelajar/aktiviti",
      });
      return "Pengesahan dibatalkan; markah dikira semula";
    }
    case "aktivitiLuar": {
      const r = await prisma.aktivitiLuar.findUnique({ where: { id } });
      if (!r) return ralat("Aktiviti luar tidak dijumpai");
      if (r.statusPengesahan !== "Approved") return ralat("Aktiviti ini belum disahkan");
      if (!bolehBatal(p, { guruId: r.guruPengiringId })) return tolak();
      await prisma.aktivitiLuar.update({
        where: { id },
        data: { statusPengesahan: "Pending", markahLuar: 0, markahPenglibatan: 0, markahPencapaian: 0,
          noSiriECert: null, tarikhJanaECert: null, komenGuru: sebab },
      });
      await kiraSemulaT6(r.pelajarId);
      await notifyPelajar(r.pelajarId, {
        tajuk: "Pengesahan aktiviti luar dibatalkan",
        mesej: `Pengesahan "${r.namaAktiviti}" dibatalkan; e-Cert tidak lagi aktif.${nota}`,
        jenis: "kuiri", pautan: "/pelajar/aktiviti",
      });
      return "Pengesahan aktiviti luar dibatalkan; markah dikira semula";
    }
    case "aktivitiUnit": {
      const r = await prisma.aktivitiUnit.findUnique({ where: { id }, include: { peserta: { select: { id: true, pelajarId: true } } } });
      if (!r) return ralat("Aktiviti tidak dijumpai");
      if (r.statusPengesahan !== "Approved") return ralat("Aktiviti ini belum disahkan");
      if (!bolehBatal(p, { guruId: r.disahkanOlehId })) return tolak();
      await prisma.$transaction([
        prisma.aktivitiUnit.update({ where: { id }, data: { statusPengesahan: "Pending", disahkanOlehId: null, tarikhSahkan: null, komenGuru: sebab } }),
        prisma.aktivitiUnitPeserta.updateMany({ where: { aktivitiId: id }, data: { markahPenglibatan: 0, markahPencapaian: 0 } }),
      ]);
      for (const x of r.peserta) await kiraSemulaT6(x.pelajarId);
      await notifyPelajar(r.setiausahaId, {
        tajuk: "Pengesahan aktiviti dibatalkan",
        mesej: `Pengesahan "${r.namaAktiviti}" dibatalkan dan menunggu semakan semula.${nota}`,
        jenis: "kuiri", pautan: "/pelajar/aktiviti",
      });
      return `Pengesahan dibatalkan; markah ${r.peserta.length} peserta dikira semula`;
    }
    case "laporanMingguan": {
      const r = await prisma.laporanMingguan.findUnique({ where: { id } });
      if (!r) return ralat("Laporan tidak dijumpai");
      if (r.statusSemakan !== "Approved") return ralat("Laporan ini belum disahkan");
      if (!bolehBatal(p, { guruId: r.disahkanOlehId })) return tolak();
      await prisma.laporanMingguan.update({
        where: { id },
        data: { statusSemakan: "Pending", disahkanOleh: null, disahkanOlehId: null, tarikhSahkan: null, komenGuru: sebab },
      });
      await notifyPelajar(r.setiausahaId, {
        tajuk: "Pengesahan laporan dibatalkan",
        mesej: `Pengesahan laporan "${r.namaProgram ?? r.aktiviti.slice(0, 60)}" dibatalkan.${nota}`,
        jenis: "kuiri", pautan: "/pelajar/laporan",
      });
      return "Pengesahan laporan mingguan dibatalkan";
    }
    case "laporanProjek": {
      const r = await prisma.laporanProjek.findUnique({ where: { id }, include: { peserta: { select: { pelajarId: true } } } });
      if (!r) return ralat("Laporan projek tidak dijumpai");
      if (r.statusPengesahan !== "Approved") return ralat("Laporan projek ini belum disahkan");
      if (!bolehBatal(p, { guruId: r.disahkanOlehId })) return tolak();
      await prisma.laporanProjek.update({
        where: { id },
        data: { statusPengesahan: "Pending", disahkanOleh: null, disahkanOlehId: null, tarikhSahkan: null, komenGuru: sebab },
      });
      await kiraSemulaT6(r.setiausahaId);
      for (const x of r.peserta) await kiraSemulaT6(x.pelajarId);
      await notifyPelajar(r.setiausahaId, {
        tajuk: "Pengesahan projek dibatalkan",
        mesej: `Pengesahan projek "${r.namaProjek}" dibatalkan.${nota}`,
        jenis: "kuiri", pautan: "/pelajar/laporan",
      });
      return "Pengesahan laporan projek dibatalkan; markah dikira semula";
    }
    case "kehadiranGuru": {
      const r = await prisma.kehadiranGuru.findUnique({ where: { id }, include: { guru: { select: { user: { select: { id: true } } } } } });
      if (!r) return ralat("Rekod kehadiran guru tidak dijumpai");
      if (r.statusSemakan !== "Approved") return ralat("Kehadiran ini belum disahkan");
      if (!bolehBatal(p, { userId: r.disemakOlehId })) return tolak();
      await prisma.kehadiranGuru.update({
        where: { id },
        data: { statusSemakan: "Pending", disemakOlehId: null, tarikhSemak: null, komenAdmin: sebab },
      });
      if (r.guru.user) {
        await notify({ userId: r.guru.user.id, tajuk: "Pengesahan kehadiran dibatalkan",
          mesej: `Pengesahan kehadiran anda dibatalkan.${nota}`, jenis: "kuiri", pautan: "/guru/kehadiran-saya" });
      }
      return "Pengesahan kehadiran guru dibatalkan";
    }
  }
}
