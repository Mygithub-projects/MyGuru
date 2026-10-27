import Link from "next/link";
import { dbKohort } from "@/lib/prisma-kohort";
import { AiInsights } from "@/components/AiInsights";
import { HeroBanner } from "@/components/HeroBanner";
import { StatCard } from "@/components/StatCard";
import { BarChart, DonutChart, LineChart } from "@/components/Charts";
import { NavIcon, type IconName } from "@/components/shell/icons";
import { getT } from "@/lib/locale";
import { stripEmoji } from "@/lib/nav";
import { labelStatusPilihanT6 } from "@/lib/pajsk";
import {
  analitikKehadiran,
  analitikStatusPilihanT6,
  analitikTaburanGred,
  analitikTrendKehadiran,
  kpiSekolah,
} from "@/lib/analitik";
import { analitikRumusan, dataRumusan, type Bahagian } from "@/lib/rumusan";
import { ReviewPanel } from "@/app/guru/ReviewPanel";

// Data dikira semula setiap permintaan — sentiasa ikut markah/kehadiran terkini.
export const dynamic = "force-dynamic";

const GRED = ["A", "B", "C", "D", "E"] as const;
const WARNA_GRED: Record<(typeof GRED)[number], string> = {
  A: "bg-emerald-500", B: "bg-sky-500", C: "bg-amber-400", D: "bg-orange-500", E: "bg-rose-500",
};

export default async function AdminDashboard() {
  const db = await dbKohort(); // data kohort dipilih sahaja
  const { t, locale } = await getT();
  const L = (ms: string, en: string) => (locale === "en" ? en : ms);
  const ta = t.analitik;

  const [bilGuru, kpi, gred, trend, kehadiranUnit, statusT6, rumusanRows, pertukaranPending, bilPencapaianPending, bilLuarPending] =
    await Promise.all([
      db.guru.count(),
      kpiSekolah(),
      analitikTaburanGred(),
      analitikTrendKehadiran(),
      analitikKehadiran(),
      analitikStatusPilihanT6(),
      dataRumusan(),
      // Permohonan pertukaran/pendaftaran unit — admin boleh sahkan terus.
      db.logPertukaran.findMany({
        where: { status: "Pending" },
        include: { pelajar: { select: { nama: true, kelasT6: true } } },
        orderBy: { tarikhMohon: "desc" },
      }),
      db.pencapaian.count({ where: { statusSemakan: "Pending" } }),
      db.aktivitiLuar.count({ where: { statusPengesahan: "Pending" } }),
    ]);
  const bahagian = analitikRumusan(rumusanRows).bahagian;
  const labelBahagian: Record<Bahagian, string> = {
    Kelab: t.common.kelab, Sukan: t.common.sukan, Uniform: t.common.uniform, Perkhidmatan: t.common.perkhidmatan,
  };
  const menunggu = pertukaranPending.length + bilPencapaianPending + bilLuarPending;
  const unitTerendah = [...kehadiranUnit].filter((k) => k.jumlahRekod > 0).sort((a, b) => a.peratus - b.peratus).slice(0, 8);

  return (
    <div className="space-y-6">
      <HeroBanner
        heading={t.admin.dashboardTitle}
        subheading={L(
          `${kpi.jumlah} pelajar · ${bilGuru} guru · ${menunggu} item menunggu tindakan`,
          `${kpi.jumlah} students · ${bilGuru} teachers · ${menunggu} items awaiting action`,
        )}
        scopeLabel={t.guru.scopeSchool}
      />

      {/* KPI utama */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label={ta.totalStudents} value={kpi.jumlah} sub={`${bilGuru} ${L("guru", "teachers")}`} />
        <StatCard label={ta.avgMark} value={kpi.purataMarkah} sub="/ 100" tone="brand" progress={kpi.purataMarkah} />
        <StatCard label={ta.gradeAStudents} value={`${kpi.peratusGredA}%`} tone="ok" progress={kpi.peratusGredA} />
        <StatCard
          label={ta.avgAttendance}
          value={`${kpi.purataKehadiran}%`}
          tone={kpi.purataKehadiran >= 80 ? "ok" : "warn"}
          progress={kpi.purataKehadiran}
        />
        <StatCard label={L("Menunggu Tindakan", "Awaiting Action")} value={menunggu} tone={menunggu > 0 ? "warn" : "ok"} />
      </div>

      {/* Prestasi ikut bahagian (Borang Rumusan) */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">{L("Prestasi Ikut Bahagian", "Performance by Division")}</h2>
          <Link href="/admin/rumusan" className="text-xs font-semibold text-brand-dark hover:underline">
            {L("Rumusan penuh & Excel →", "Full summary & Excel →")}
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {bahagian.map((b) => {
            const bermarkah = GRED.reduce((s, g) => s + b.gred[g], 0);
            return (
              <div key={b.bahagian} className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase text-brand-dark">{labelBahagian[b.bahagian!]}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-800">{b.purata ?? "—"}</span>
                  <span className="text-xs text-slate-500">
                    {b.purata === null ? L("ekstra (bonus)", "extra (bonus)") : L("purata", "average")} · {b.ahli} {L("ahli", "members")}
                  </span>
                </div>
                {b.purata !== null && bermarkah > 0 && (
                  <>
                    <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      {GRED.map((g) =>
                        b.gred[g] ? (
                          <div key={g} className={WARNA_GRED[g]} style={{ width: `${(b.gred[g] / bermarkah) * 100}%` }} title={`${g}: ${b.gred[g]}`} />
                        ) : null,
                      )}
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
                      {GRED.map((g) => <span key={g}>{g} {b.gred[g]}</span>)}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Carta analitik */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={ta.gradeDist} href="/admin/analitik" more={L("Analitik penuh →", "Full analytics →")}>
          <DonutChart data={gred} emptyLabel={ta.noChartData} />
        </Panel>
        <Panel title={ta.attendanceTrend}>
          <LineChart data={trend} emptyLabel={ta.noChartData} valueInLabel={ta.valueIn} />
        </Panel>
        <Panel title={L("Kehadiran Terendah Ikut Unit", "Lowest Attendance by Unit")} href="/admin/kehadiran" more={L("Kehadiran →", "Attendance →")}>
          <BarChart data={unitTerendah.map((k) => ({ nama: k.namaUnit, nilai: k.peratus, sufiks: "%" }))} emptyLabel={ta.noChartData} />
        </Panel>
        <Panel title={ta.unitSelectionStatus}>
          <DonutChart
            data={statusT6.filter((s) => s.nama !== "Kekal").map((s) => ({ ...s, nama: labelStatusPilihanT6(s.nama, locale) }))}
            emptyLabel={ta.noChartData}
          />
        </Panel>
      </div>

      <AiInsights />

      {pertukaranPending.length > 0 && (
        <ReviewPanel
          pencapaian={[]}
          aktivitiLuar={[]}
          pertukaran={pertukaranPending.map((p) => ({
            id: p.id,
            jenisKoko: p.jenisKoko,
            unitLama: p.unitLama,
            unitBaru: p.unitBaru,
            sebab: p.sebab,
            pelajar: p.pelajar,
          }))}
          t={t.guru.reviewPanel}
        />
      )}

      {/* Pintasan */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{t.admin.quickActions}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Pintasan href="/admin/pelajar" icon="members" label={t.admin.actManageStudents} />
          <Pintasan href="/admin/guru" icon="members" label={t.admin.actManageTeachers} />
          <Pintasan href="/admin/rumusan" icon="analytics" label={t.admin.actRumusan} />
          <Pintasan href="/admin/kehadiran" icon="attendance" label={t.admin.actAttendance} />
          <Pintasan href="/admin/import" icon="import" label={t.admin.actImport} />
          <Pintasan href="/admin/raw-data" icon="spreadsheet" label={t.admin.actRawData} />
          <Pintasan href="/admin/demografi" icon="demographics" label={t.admin.actDemographics} />
          <Pintasan href="/admin/sijil" icon="cert" label={t.admin.actCertTemplate} />
          <Pintasan href="/admin/tetapan" icon="settings" label={t.admin.actFormula} />
          <Pintasan href="/admin/analitik" icon="analytics" label={t.admin.actAnalytics} />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {t.admin.seeAlso} <Link href="/guru" className="text-brand-dark underline">{t.admin.teacherView}</Link> ·{" "}
          <Link href="/pelajar" className="text-brand-dark underline">{t.admin.studentView}</Link>
        </p>
      </section>
    </div>
  );
}

function Panel({ title, href, more, children }: { title: string; href?: string; more?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">{title}</h2>
        {href && more && <Link href={href} className="shrink-0 text-xs font-semibold text-brand-dark hover:underline">{more}</Link>}
      </div>
      {children}
    </section>
  );
}

function Pintasan({ href, icon, label }: { href: string; icon: IconName; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-lg bg-brand-light px-3 py-2.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/15 transition hover:bg-brand hover:text-white"
    >
      <NavIcon name={icon} className="h-5 w-5 shrink-0 opacity-80 group-hover:opacity-100" />
      <span className="min-w-0 truncate">{stripEmoji(label)}</span>
    </Link>
  );
}
