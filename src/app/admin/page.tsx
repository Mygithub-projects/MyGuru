import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AiInsights } from "@/components/AiInsights";
import { HeroBanner } from "@/components/HeroBanner";
import { StatCard } from "@/components/StatCard";
import { getT } from "@/lib/locale";
import { ReviewPanel } from "@/app/guru/ReviewPanel";

export default async function AdminDashboard() {
  const [bilPelajar, bilGuru, bilUser, bilKoko, bilTetapan] = await Promise.all([
    prisma.pelajar.count(),
    prisma.guru.count(),
    prisma.user.count(),
    prisma.kokurikulum.count(),
    prisma.tetapanMarkah.count(),
  ]);

  // Permohonan pertukaran/pendaftaran unit (Kelab/Sukan/Uniform/Perkhidmatan)
  // menunggu kelulusan — admin boleh sahkan terus, sama macam guru penasihat.
  const pertukaranPending = await prisma.logPertukaran.findMany({
    where: { status: "Pending" },
    include: { pelajar: { select: { nama: true, kelasT6: true } } },
    orderBy: { tarikhMohon: "desc" },
  });

  // Taburan demografi ringkas
  const jantina = await prisma.pelajar.groupBy({ by: ["jantina"], _count: true });
  const { t } = await getT();

  return (
    <div className="space-y-6">
      <HeroBanner heading={t.admin.dashboardTitle} scopeLabel={t.guru.scopeSchool} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t.admin.students} value={bilPelajar} />
        <StatCard label={t.admin.teachers} value={bilGuru} />
        <StatCard label={t.admin.userAccounts} value={bilUser} />
        <StatCard label={t.admin.kokoRecords} value={bilKoko} />
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

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
          {t.admin.genderDist}
        </h2>
        {jantina.every((j) => !j.jantina) ? (
          <p className="text-sm text-slate-400">
            {t.admin.noDemographics}
          </p>
        ) : (
          (() => {
            const total = jantina.reduce((s, j) => s + j._count, 0);
            const label = (v: string | null) =>
              v === "L" ? t.admin.male : v === "P" ? t.admin.female : t.common.tiadaData;
            return (
              <ul className="space-y-2.5 text-sm text-slate-700">
                {jantina.map((j) => {
                  const pct = total ? Math.round((j._count / total) * 100) : 0;
                  return (
                    <li key={j.jantina ?? "NA"}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">{label(j.jantina)}</span>
                        <span className="text-slate-500">{j._count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            );
          })()
        )}
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
          {t.admin.quickActions}
        </h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <Action href="/admin/pelajar" label={t.admin.actManageStudents} />
          <Action href="/admin/pelajar/tambah" label={t.admin.actAddStudent} />
          <Action href="/admin/guru/tambah" label={t.admin.actAddTeacher} />
          <Action href="/admin/import" label={t.admin.actImport} />
          <Action href="/admin/tetapan" label={`${t.admin.actFormula} (${bilTetapan})`} />
          <Action href="/admin/demografi" label={t.admin.actDemographics} />
          <Action href="/admin/guru" label={t.admin.actManageTeachers} />
          <Action href="/admin/kehadiran" label={t.admin.actAttendance} />
          <Action href="/admin/sijil" label={t.admin.actCertTemplate} />
          <Action href="/admin/analitik" label={t.admin.actAnalytics} />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {t.admin.seeAlso} <Link href="/guru" className="text-brand-dark underline">{t.admin.teacherView}</Link> ·{" "}
          <Link href="/pelajar" className="text-brand-dark underline">{t.admin.studentView}</Link>
        </p>
      </section>
    </div>
  );
}

function Action({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-lg bg-brand-light px-3 py-2 font-semibold text-brand-dark hover:bg-brand hover:text-white">
      {label}
    </Link>
  );
}
