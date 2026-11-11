import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { guruSeluruhSekolah } from "@/lib/workflow";
import { getT } from "@/lib/locale";
import { normalBahagian, skopAnalitikBahagian, type BahagianKoko } from "@/lib/analitik";
import { AnalitikDashboard } from "@/components/AnalitikDashboard";

export default async function GuruAnalitikPage({
  searchParams,
}: {
  searchParams: Promise<{ bahagian?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const guru = session.guruId ? await prisma.guru.findUnique({ where: { id: session.guruId } }) : null;
  const seluruh = session.role === "Admin" || (guru ? guruSeluruhSekolah(guru) : false);
  const { units, tersedia, bahagian } = await skopAnalitikBahagian(
    guru?.id ?? null,
    seluruh,
    normalBahagian((await searchParams).bahagian),
  );
  const { t } = await getT();

  // Uniform = BU, Kelab = KP, Sukan = SP
  const labelBahagian: Record<BahagianKoko, string> = {
    Uniform: `${t.common.uniform} (BU)`,
    Kelab: `${t.common.kelab} (KP)`,
    Sukan: `${t.common.sukan} (SP)`,
  };
  const tabs: { key: BahagianKoko | undefined; label: string; href: string }[] = [
    { key: undefined, label: t.analitik.allSections, href: "/guru/analitik" },
    ...tersedia.map((b) => ({ key: b, label: labelBahagian[b], href: `/guru/analitik?bahagian=${b}` })),
  ];
  const qEksport = bahagian ? `&bahagian=${bahagian}` : "";
  const skopUnit = t.analitik.scopeUnit((units ?? []).join(", ") || t.analitik.noUnit);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/guru" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.analitik.back}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.analitik.pageTitle}</h1>
        <p className="text-sm text-slate-500">
          {seluruh
            ? bahagian
              ? `${t.analitik.scopeSchool} — ${labelBahagian[bahagian]}`
              : t.analitik.scopeSchool
            : skopUnit}
        </p>
        {tersedia.length > 0 && (
          <nav aria-label={t.analitik.sectionFilter} className="mt-3 flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const aktif = tab.key === bahagian;
              return (
                <Link
                  key={tab.key ?? "semua"}
                  href={tab.href}
                  aria-current={aktif ? "page" : undefined}
                  className={
                    aktif
                      ? "rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white"
                      : "rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-brand-light hover:text-brand-dark"
                  }
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        )}
        <div className="mt-3 flex gap-2">
          <a href={`/api/analitik/eksport?format=excel${qEksport}`} className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-2">{t.analitik.exportExcel}</a>
          <a href={`/api/analitik/eksport?format=pdf${qEksport}`} className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover">{t.analitik.exportPdf}</a>
        </div>
      </div>
      <AnalitikDashboard units={units} demografiPenuh={seluruh && !bahagian} />
    </div>
  );
}
