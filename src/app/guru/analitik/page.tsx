import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { guruSeluruhSekolah, unitSeliaan } from "@/lib/workflow";
import { getT } from "@/lib/locale";
import { AnalitikDashboard } from "@/components/AnalitikDashboard";

export default async function GuruAnalitikPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const guru = session.guruId ? await prisma.guru.findUnique({ where: { id: session.guruId } }) : null;
  const seluruh = session.role === "Admin" || (guru ? guruSeluruhSekolah(guru) : false);
  const units = guru ? await unitSeliaan(guru) : [];
  const { t } = await getT();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/guru" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.analitik.back}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.analitik.pageTitle}</h1>
        <p className="text-sm text-slate-500">
          {seluruh ? t.analitik.scopeSchool : t.analitik.scopeUnit(units.join(", ") || t.analitik.noUnit)}
        </p>
        <div className="mt-2 flex gap-2">
          <a href="/api/analitik/eksport?format=excel" className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-2">{t.analitik.exportExcel}</a>
          <a href="/api/analitik/eksport?format=pdf" className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover">{t.analitik.exportPdf}</a>
        </div>
      </div>
      <AnalitikDashboard units={seluruh ? undefined : units} demografiPenuh={seluruh} />
    </div>
  );
}
