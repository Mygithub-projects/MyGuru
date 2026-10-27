// ===========================================================================
//  Analitik — agregat kehadiran, projek/laporan, demografi & cross-tab.
//  Hak akses: Admin = seluruh kohort; Guru = unit seliaan (hantar unitFilter).
// ===========================================================================
import { dbKohort } from "./prisma-kohort";
import { statusPilihanT6, normalizePeringkat } from "./pajsk";

/** pelajarId dalam unit tertentu (null = semua pelajar / skop admin). */
async function pelajarIdsUntukUnit(units?: string[]): Promise<string[] | null> {
  const db = await dbKohort(); // data kohort dipilih sahaja
  if (!units) return null;
  const koko = await db.kokurikulum.findMany({
    where: { namaUnitT6: { in: units } },
    select: { pelajarId: true },
  });
  return [...new Set(koko.map((k) => k.pelajarId))];
}

export interface KehadiranUnit {
  namaUnit: string;
  jumlahRekod: number;
  hadir: number;
  peratus: number;
}

export async function analitikKehadiran(units?: string[]): Promise<KehadiranUnit[]> {
  const db = await dbKohort(); // data kohort dipilih sahaja
  const where = units ? { namaUnit: { in: units } } : {};
  const recs = await db.kehadiran.findMany({ where, select: { namaUnit: true, statusHadir: true } });
  const map = new Map<string, { total: number; hadir: number }>();
  for (const r of recs) {
    const key = r.namaUnit ?? "(tiada unit)";
    const m = map.get(key) ?? { total: 0, hadir: 0 };
    m.total++;
    if (r.statusHadir) m.hadir++;
    map.set(key, m);
  }
  return [...map.entries()]
    .map(([namaUnit, m]) => ({
      namaUnit,
      jumlahRekod: m.total,
      hadir: m.hadir,
      peratus: m.total ? Math.round((m.hadir / m.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.peratus - a.peratus);
}

/** Tren kehadiran mengikut nombor perjumpaan (untuk carta garisan). */
export async function analitikTrendKehadiran(units?: string[]): Promise<{ label: string; nilai: number }[]> {
  const db = await dbKohort(); // data kohort dipilih sahaja
  const where = units ? { namaUnit: { in: units } } : {};
  const recs = await db.kehadiran.findMany({
    where,
    select: { bilPerjumpaan: true, statusHadir: true },
  });
  const map = new Map<number, { total: number; hadir: number }>();
  for (const r of recs) {
    const m = map.get(r.bilPerjumpaan) ?? { total: 0, hadir: 0 };
    m.total++;
    if (r.statusHadir) m.hadir++;
    map.set(r.bilPerjumpaan, m);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bil, m]) => ({
      label: `P${bil}`,
      nilai: m.total ? Math.round((m.hadir / m.total) * 1000) / 10 : 0,
    }));
}

export async function analitikProjek() {
  const db = await dbKohort(); // data kohort dipilih sahaja
  const grp = await db.laporanProjek.groupBy({ by: ["statusPengesahan"], _count: true });
  return grp.map((g) => ({ status: g.statusPengesahan, bil: g._count }));
}

export async function analitikLaporan() {
  const db = await dbKohort(); // data kohort dipilih sahaja
  const [jumlah, disahkan, pending, kuiri] = await Promise.all([
    db.laporanMingguan.count(),
    db.laporanMingguan.count({ where: { statusSemakan: "Approved" } }),
    db.laporanMingguan.count({ where: { statusSemakan: "Pending" } }),
    db.laporanMingguan.count({ where: { statusSemakan: "Kuiri" } }),
  ]);
  const kadar = jumlah ? Math.round((disahkan / jumlah) * 1000) / 10 : 0;
  return { jumlah, disahkan, pending, kuiri, kadarPematuhan: kadar };
}

export interface Taburan {
  label: string;
  data: { nama: string; bil: number }[];
}

async function taburan(field: "jantina" | "kaum" | "agama", label: string): Promise<Taburan> {
  const db = await dbKohort(); // data kohort dipilih sahaja
  const grp = await db.pelajar.groupBy({ by: [field], _count: true });
  return {
    label,
    data: grp.map((g) => ({ nama: (g[field] as string) ?? "Tiada data", bil: g._count })),
  };
}

export async function analitikDemografi() {
  return Promise.all([
    taburan("jantina", "Jantina"),
    taburan("kaum", "Kaum"),
    taburan("agama", "Agama"),
  ]);
}

/** Taburan status pilihan unit T6 (Belum Pilih/Kekal/Mohon Tukar/Disahkan). */
export async function analitikStatusPilihanT6(units?: string[]): Promise<{ nama: string; bil: number }[]> {
  const db = await dbKohort(); // data kohort dipilih sahaja
  const koko = await db.kokurikulum.findMany({
    where: units ? { namaUnitT6: { in: units } } : {},
    select: { namaUnitT5: true, namaUnitT6: true, statusPertukaran: true },
  });
  const urutan = ["Belum Pilih", "Mohon Tukar", "Kekal", "Disahkan"];
  const counts: Record<string, number> = {};
  for (const k of koko) {
    const s = statusPilihanT6(k);
    counts[s] = (counts[s] ?? 0) + 1;
  }
  return urutan.filter((s) => counts[s]).map((s) => ({ nama: s, bil: counts[s] }));
}

/** Taburan gred PAJSK T6 (A/B/C/D/E) — untuk carta (§7). */
export async function analitikTaburanGred(units?: string[]): Promise<{ nama: string; bil: number }[]> {
  const db = await dbKohort(); // data kohort dipilih sahaja
  const ids = await pelajarIdsUntukUnit(units);
  const grp = await db.pelajar.groupBy({
    by: ["gredPajskT6"],
    where: ids ? { id: { in: ids } } : {},
    _count: true,
  });
  const counts: Record<string, number> = {};
  for (const g of grp) counts[g.gredPajskT6 ?? "-"] = g._count;
  return ["A", "B", "C", "D", "E"]
    .filter((g) => counts[g])
    .map((g) => ({ nama: `Gred ${g}`, bil: counts[g] }));
}

/** Taburan pencapaian (aktiviti luar disahkan) mengikut peringkat (§7). */
export async function analitikPencapaianPeringkat(units?: string[]): Promise<{ nama: string; bil: number }[]> {
  const db = await dbKohort(); // data kohort dipilih sahaja
  const ids = await pelajarIdsUntukUnit(units);
  const recs = await db.aktivitiLuar.findMany({
    where: { statusPengesahan: "Approved", ...(ids ? { pelajarId: { in: ids } } : {}) },
    select: { peringkat: true },
  });
  const counts: Record<string, number> = {};
  for (const r of recs) {
    const p = normalizePeringkat(r.peringkat) ?? "Lain-lain";
    counts[p] = (counts[p] ?? 0) + 1;
  }
  return ["Sekolah", "Daerah", "Zon/Daerah", "Negeri", "Kebangsaan", "Antarabangsa", "Lain-lain"]
    .filter((p) => counts[p])
    .map((p) => ({ nama: p, bil: counts[p] }));
}

/** Kad ringkasan (KPI) sekolah/skop: jumlah pelajar, purata markah, %Gred A, purata kehadiran (§7). */
export async function kpiSekolah(units?: string[]) {
  const db = await dbKohort(); // data kohort dipilih sahaja
  const ids = await pelajarIdsUntukUnit(units);
  const wherePel = ids ? { id: { in: ids } } : {};
  const [jumlah, agg, gredA, kehadiranRecs] = await Promise.all([
    db.pelajar.count({ where: wherePel }),
    db.pelajar.aggregate({ where: wherePel, _avg: { markahPajskT6: true } }),
    db.pelajar.count({ where: { ...wherePel, gredPajskT6: "A" } }),
    db.kehadiran.findMany({ where: units ? { namaUnit: { in: units } } : {}, select: { statusHadir: true } }),
  ]);
  const purataMarkah = Math.round((agg._avg.markahPajskT6 ?? 0) * 10) / 10;
  const peratusGredA = jumlah ? Math.round((gredA / jumlah) * 100) : 0;
  const hadir = kehadiranRecs.filter((r) => r.statusHadir).length;
  const purataKehadiran = kehadiranRecs.length ? Math.round((hadir / kehadiranRecs.length) * 1000) / 10 : 0;
  return { jumlah, purataMarkah, peratusGredA, purataKehadiran };
}

/** Cross-tab: Jantina × Jenis Koko (bilangan rekod kokurikulum). */
export async function crosstabJantinaKoko() {
  const db = await dbKohort(); // data kohort dipilih sahaja
  const koko = await db.kokurikulum.findMany({
    select: { jenisKoko: true, pelajar: { select: { jantina: true } } },
  });
  const jenisList = ["Sukan", "Kelab", "Uniform", "Perkhidmatan"];
  const jantinaList = ["L", "P", "Tiada data"];
  const tab: Record<string, Record<string, number>> = {};
  for (const j of jantinaList) {
    tab[j] = {};
    for (const k of jenisList) tab[j][k] = 0;
  }
  for (const row of koko) {
    const j = row.pelajar.jantina ?? "Tiada data";
    if (tab[j] && row.jenisKoko in tab[j]) tab[j][row.jenisKoko]++;
  }
  return { jenisList, jantinaList, tab };
}
