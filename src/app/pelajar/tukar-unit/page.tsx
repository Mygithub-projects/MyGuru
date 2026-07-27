import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/locale";
import { StatusBadge } from "@/components/StatusBadge";
import { TukarUnitForm } from "./TukarUnitForm";

export default async function TukarUnitPage() {
  const session = await getSession();
  if (!session?.pelajarId) redirect("/login");
  const { t } = await getT();
  const jenisLabel: Record<string, string> = {
    Sukan: t.common.sukan, Kelab: t.common.kelab, Uniform: t.common.uniform, Perkhidmatan: t.common.perkhidmatan,
  };

  const [koko, sejarah] = await Promise.all([
    prisma.kokurikulum.findMany({ where: { pelajarId: session.pelajarId } }),
    prisma.logPertukaran.findMany({
      where: { pelajarId: session.pelajarId },
      orderBy: { tarikhMohon: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">
          {t.pelajar.backToDashboard}
        </Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.pelajar.transferTitle}</h1>
        <p className="text-sm text-slate-500">
          {t.pelajar.transferSubtitle}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TukarUnitForm
          pelajarId={session.pelajarId}
          unitSemasa={koko.map((k) => ({
            jenisKoko: k.jenisKoko,
            namaUnitT6: k.namaUnitT6,
            statusPertukaran: k.statusPertukaran,
          }))}
        />

        <div className="space-y-4">
          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
              {t.pelajar.transferCurrentUnits}
            </h2>
            <div className="space-y-2">
              {koko.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-semibold text-brand-dark">{jenisLabel[k.jenisKoko] ?? k.jenisKoko}:</span>{" "}
                    {k.namaUnitT6 ?? "-"}
                  </span>
                  <StatusBadge status={k.statusPertukaran} />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
              {t.pelajar.transferHistory}
            </h2>
            {sejarah.length === 0 ? (
              <p className="text-sm text-slate-400">{t.pelajar.transferNoRequest}</p>
            ) : (
              <div className="space-y-2">
                {sejarah.map((s) => (
                  <div key={s.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700">
                        {jenisLabel[s.jenisKoko] ?? s.jenisKoko}: {s.unitLama ?? "-"} → {s.unitBaru}
                      </span>
                      <StatusBadge status={s.status} />
                    </div>
                    {s.komenGuru && (
                      <p className="mt-1 text-xs text-slate-500">{t.laporan.comment}: {s.komenGuru}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
