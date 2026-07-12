// ===========================================================================
//  Analitik Pintar (data-driven insights) — KPI kohort + cerapan automatik.
//  Berasaskan peraturan (rule-based) ke atas data sebenar, bukan model bahasa.
// ===========================================================================
import { prisma } from "./prisma";
import { analitikKehadiran, analitikStatusPilihanT6 } from "./analitik";

export type JenisCerapan = "positif" | "amaran" | "info";
export interface Cerapan {
  teks: string;
  jenis: JenisCerapan;
}
export interface KPI {
  label: string;
  nilai: string;
  delta?: string;
  arah?: "naik" | "turun" | "rata";
}

function purata(arr: (number | null | undefined)[]): number {
  const v = arr.filter((x): x is number => x != null);
  if (v.length === 0) return 0;
  return Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10) / 10;
}

export async function getInsights(units?: string[]): Promise<{ kpi: KPI[]; cerapan: Cerapan[] }> {
  // Pelajar dalam skop
  let pelajarWhere = {};
  if (units) {
    const ids = (
      await prisma.kokurikulum.findMany({ where: { namaUnitT6: { in: units } }, select: { pelajarId: true } })
    ).map((k) => k.pelajarId);
    pelajarWhere = { id: { in: [...new Set(ids)] } };
  }

  const pelajar = await prisma.pelajar.findMany({
    where: pelajarWhere,
    select: { markahPajskT6: true, gredPajskT6: true },
  });
  const n = pelajar.length;
  const avgT6 = purata(pelajar.map((p) => p.markahPajskT6));
  const gredA = pelajar.filter((p) => p.gredPajskT6 === "A").length;
  const peratusGredA = n ? Math.round((gredA / n) * 100) : 0;

  const kehadiran = await analitikKehadiran(units);
  const avgKehadiran = kehadiran.length
    ? Math.round((kehadiran.reduce((s, k) => s + k.peratus, 0) / kehadiran.length) * 10) / 10
    : 0;

  const statusT6 = await analitikStatusPilihanT6(units);
  const belumPilih = statusT6.find((s) => s.nama === "Belum Pilih")?.bil ?? 0;

  // Item menunggu tindakan (kohort)
  const [pPertukaran, pCadangan, pPencapaian, pAktiviti, pLaporan] = await Promise.all([
    prisma.logPertukaran.count({ where: { status: "Pending" } }),
    prisma.cadanganJawatan.count({ where: { status: "Pending" } }),
    prisma.pencapaian.count({ where: { statusSemakan: "Pending" } }),
    prisma.aktivitiLuar.count({ where: { statusPengesahan: "Pending" } }),
    prisma.laporanMingguan.count({ where: { statusSemakan: "Pending" } }),
  ]);
  const pending = pPertukaran + pCadangan + pPencapaian + pAktiviti + pLaporan;

  // --- KPI ---
  const kpi: KPI[] = [
    {
      label: "Purata PAJSK T6",
      nilai: `${avgT6}`,
      delta: "/ 100 markah",
      arah: avgT6 >= 60 ? "naik" : avgT6 >= 40 ? "rata" : "turun",
    },
    { label: "Pelajar Gred A", nilai: `${peratusGredA}%`, delta: `${gredA}/${n} pelajar`, arah: "naik" },
    { label: "Purata Kehadiran", nilai: `${avgKehadiran}%`, arah: avgKehadiran >= 80 ? "naik" : "turun" },
    { label: "Menunggu Tindakan", nilai: `${pending}`, arah: pending > 0 ? "turun" : "rata" },
  ];

  // --- Cerapan automatik ---
  const cerapan: Cerapan[] = [];
  if (n > 0 && avgT6 >= 60)
    cerapan.push({ teks: `Purata markah PAJSK kohort ${avgT6}/100 — ${peratusGredA}% pelajar mencapai Gred A.`, jenis: "positif" });
  else if (n > 0 && avgT6 < 40)
    cerapan.push({ teks: `Purata markah PAJSK kohort ${avgT6}/100 (di bawah 40) — perlu pemantauan rapi.`, jenis: "amaran" });

  if (kehadiran.length > 0) {
    const tertinggi = kehadiran[0];
    const terendah = kehadiran[kehadiran.length - 1];
    cerapan.push({ teks: `Kehadiran tertinggi: ${tertinggi.namaUnit} (${tertinggi.peratus}%).`, jenis: "info" });
    if (terendah.peratus < 70)
      cerapan.push({ teks: `Kehadiran terendah: ${terendah.namaUnit} (${terendah.peratus}%) — di bawah 70%, disarankan intervensi.`, jenis: "amaran" });
  }

  if (belumPilih > 0)
    cerapan.push({ teks: `${belumPilih} rekod unit belum mempunyai pilihan T6 — ingatkan pelajar melengkapkan pendaftaran.`, jenis: "amaran" });

  if (pending > 0)
    cerapan.push({ teks: `${pending} item menunggu tindakan guru (pertukaran, cadangan jawatan, pencapaian, aktiviti, laporan).`, jenis: "info" });

  if (cerapan.length === 0)
    cerapan.push({ teks: "Tiada isu dikesan. Semua metrik dalam keadaan baik.", jenis: "positif" });

  return { kpi, cerapan };
}
