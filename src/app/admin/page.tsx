import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AiInsights } from "@/components/AiInsights";
import { getT } from "@/lib/locale";

export default async function AdminDashboard() {
  const [bilPelajar, bilGuru, bilUser, bilKoko, bilTetapan] = await Promise.all([
    prisma.pelajar.count(),
    prisma.guru.count(),
    prisma.user.count(),
    prisma.kokurikulum.count(),
    prisma.tetapanMarkah.count(),
  ]);

  // Taburan demografi ringkas
  const jantina = await prisma.pelajar.groupBy({ by: ["jantina"], _count: true });
  const { t } = await getT();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">{t.admin.dashboardTitle}</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label={t.admin.students} value={`${bilPelajar}`} />
        <Card label={t.admin.teachers} value={`${bilGuru}`} />
        <Card label={t.admin.userAccounts} value={`${bilUser}`} />
        <Card label={t.admin.kokoRecords} value={`${bilKoko}`} />
      </div>

      <AiInsights />

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
          {t.admin.genderDist}
        </h2>
        {jantina.every((j) => !j.jantina) ? (
          <p className="text-sm text-slate-400">
            {t.admin.noDemographics}
          </p>
        ) : (
          <ul className="text-sm text-slate-700">
            {jantina.map((j) => (
              <li key={j.jantina ?? "NA"}>
                {j.jantina ?? t.common.tiadaData}: {j._count}
              </li>
            ))}
          </ul>
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

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
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
