// ===========================================================================
//  Analitik Pintar (data-driven insights) — KPI kohort + cerapan automatik.
//  Berasaskan peraturan (rule-based) ke atas data sebenar, bukan model bahasa.
// ===========================================================================
import { prisma } from "./prisma";
import { analitikKehadiran, analitikStatusPilihanT6 } from "./analitik";
import { getDict, type Locale } from "./i18n";

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

export async function getInsights(units?: string[], locale: Locale = "ms"): Promise<{ kpi: KPI[]; cerapan: Cerapan[] }> {
  const t = getDict(locale).insights;
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
      label: t.kpiPajskAvg,
      nilai: `${avgT6}`,
      delta: t.unitMarksSuffix,
      arah: avgT6 >= 60 ? "naik" : avgT6 >= 40 ? "rata" : "turun",
    },
    { label: t.kpiGradeA, nilai: `${peratusGredA}%`, delta: `${gredA}/${n} ${t.studentsSuffix}`, arah: "naik" },
    { label: t.kpiAvgAttendance, nilai: `${avgKehadiran}%`, arah: avgKehadiran >= 80 ? "naik" : "turun" },
    { label: t.kpiPendingActions, nilai: `${pending}`, arah: pending > 0 ? "turun" : "rata" },
  ];

  // --- Cerapan automatik ---
  const cerapan: Cerapan[] = [];
  if (n > 0 && avgT6 >= 60)
    cerapan.push({ teks: t.avgHigh(avgT6, peratusGredA), jenis: "positif" });
  else if (n > 0 && avgT6 < 40)
    cerapan.push({ teks: t.avgLow(avgT6), jenis: "amaran" });

  if (kehadiran.length > 0) {
    const tertinggi = kehadiran[0];
    const terendah = kehadiran[kehadiran.length - 1];
    cerapan.push({ teks: t.attendanceHighest(tertinggi.namaUnit, tertinggi.peratus), jenis: "info" });
    if (terendah.peratus < 70)
      cerapan.push({ teks: t.attendanceLowest(terendah.namaUnit, terendah.peratus), jenis: "amaran" });
  }

  if (belumPilih > 0)
    cerapan.push({ teks: t.notSelected(belumPilih), jenis: "amaran" });

  if (pending > 0)
    cerapan.push({ teks: t.pendingActionsText(pending), jenis: "info" });

  if (cerapan.length === 0)
    cerapan.push({ teks: t.noIssues, jenis: "positif" });

  return { kpi, cerapan };
}
