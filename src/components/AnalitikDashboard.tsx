import {
  analitikKehadiran,
  analitikProjek,
  analitikLaporan,
  analitikDemografi,
  analitikStatusPilihanT6,
  analitikTrendKehadiran,
  analitikTaburanGred,
  analitikPencapaianPeringkat,
  kpiSekolah,
  crosstabJantinaKoko,
} from "@/lib/analitik";
import { getT } from "@/lib/locale";
import { labelStatusPilihanT6 } from "@/lib/pajsk";
import { StatCard } from "./StatCard";
import { BarChart, DonutChart, LineChart } from "./Charts";

export async function AnalitikDashboard({
  units,
  demografiPenuh,
}: {
  units?: string[]; // undefined = semua (admin)
  demografiPenuh: boolean;
}) {
  const { t, locale } = await getT();
  const ta = t.analitik;
  const [kehadiran, projek, laporan, statusT6, trend, gred, pencapaian, kpi, demografi, crosstab] =
    await Promise.all([
      analitikKehadiran(units),
      analitikProjek(),
      analitikLaporan(),
      analitikStatusPilihanT6(units),
      analitikTrendKehadiran(units),
      analitikTaburanGred(units),
      analitikPencapaianPeringkat(units),
      kpiSekolah(units),
      demografiPenuh ? analitikDemografi() : Promise.resolve([]),
      demografiPenuh ? crosstabJantinaKoko() : Promise.resolve(null),
    ]);

  return (
    <div className="space-y-6">
      {/* Kad ringkasan (KPI) — §7 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={ta.totalStudents} value={kpi.jumlah} />
        <StatCard label={ta.avgMark} value={kpi.purataMarkah} sub="/ 100" tone="brand" />
        <StatCard label={ta.gradeAStudents} value={`${kpi.peratusGredA}%`} tone="ok" />
        <StatCard label={ta.avgAttendance} value={`${kpi.purataKehadiran}%`} tone={kpi.purataKehadiran >= 80 ? "ok" : "warn"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={ta.gradeDist}>
          <DonutChart data={gred} emptyLabel={ta.noChartData} />
        </Panel>

        <Panel title={ta.achievementByLevel}>
          <DonutChart data={pencapaian} emptyLabel={ta.noChartData} />
        </Panel>

        <Panel title={ta.attendanceByUnit}>
          <BarChart data={kehadiran.map((k) => ({ nama: k.namaUnit, nilai: k.peratus, sufiks: "%" }))} emptyLabel={ta.noChartData} />
        </Panel>

        <Panel title={ta.projectReportStatus}>
          <DonutChart data={projek.map((p) => ({ nama: p.status, bil: p.bil }))} emptyLabel={ta.noChartData} />
        </Panel>

        <Panel title={ta.unitSelectionStatus}>
          <DonutChart data={statusT6.map((s) => ({ ...s, nama: labelStatusPilihanT6(s.nama, locale) }))} emptyLabel={ta.noChartData} />
        </Panel>

        <Panel title={ta.attendanceTrend}>
          <LineChart data={trend} emptyLabel={ta.noChartData} valueInLabel={ta.valueIn} />
        </Panel>

        <Panel title={ta.weeklyReportCompliance}>
          <div className="grid grid-cols-2 gap-3 text-center">
            <Metric label={ta.total} value={laporan.jumlah} />
            <Metric label={ta.verified} value={laporan.disahkan} tone="ok" />
            <Metric label={ta.pending} value={laporan.pending} tone="warn" />
            <Metric label={ta.complianceRate} value={`${laporan.kadarPematuhan}%`} tone="brand" />
          </div>
        </Panel>

        {demografiPenuh &&
          demografi.map((d) => (
            <Panel key={d.label} title={`${ta.demographicsPrefix}${d.label}`}>
              <DonutChart data={d.data} />
            </Panel>
          ))}
      </div>

      {demografiPenuh && crosstab && (
        <Panel title={ta.crosstabTitle}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                  <th className="py-2 pr-3">{ta.gender}</th>
                  {crosstab.jenisList.map((j) => (
                    <th key={j} className="py-2 pr-3">{j}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {crosstab.jantinaList.map((j) => (
                  <tr key={j} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 font-medium text-slate-700">{j}</td>
                    {crosstab.jenisList.map((k) => (
                      <td key={k} className="py-2 pr-3 text-slate-600">{crosstab.tab[j][k]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-600">{title}</h2>
      {children}
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: "ok" | "warn" | "brand" }) {
  const c = tone === "ok" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : tone === "brand" ? "text-brand-dark" : "text-slate-800";
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className={`text-2xl font-bold ${c}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
