import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { AktivitiForm } from "./AktivitiForm";
import { EvidenUpload } from "./EvidenUpload";
import { getT } from "@/lib/locale";

export default async function AktivitiPage() {
  const session = await getSession();
  if (!session?.pelajarId) redirect("/login");
  const pid = session.pelajarId;
  const { t } = await getT();

  const [pencapaian, aktivitiLuar, koko] = await Promise.all([
    prisma.pencapaian.findMany({ where: { pelajarId: pid }, orderBy: { createdAt: "desc" } }),
    prisma.aktivitiLuar.findMany({ where: { pelajarId: pid }, orderBy: { createdAt: "desc" } }),
    prisma.kokurikulum.findMany({ where: { pelajarId: pid } }),
  ]);
  const units = koko.filter((k) => k.namaUnitT6).map((k) => ({ jenisKoko: k.jenisKoko, namaUnit: k.namaUnitT6! }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.pelajar.backToDashboard}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.pelajar.activityTitle}</h1>
        <p className="text-sm text-slate-500">{t.pelajar.activitySubtitle}</p>
      </div>

      <AktivitiForm pelajarId={pid} units={units} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{t.pelajar.achievementSection}</h2>
          {pencapaian.length === 0 ? <p className="text-sm text-slate-400">{t.pelajar.noRecords}</p> : (
            <div className="space-y-2">
              {pencapaian.map((p) => (
                <div key={p.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-700">{p.namaPencapaian}</span>
                    <StatusBadge status={p.statusSemakan} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {p.namaUnit ? `${p.namaUnit} · ` : ""}{p.peringkat ?? ""} {p.statusSemakan === "Approved" ? `· ${p.markah} ${t.pelajar.commentLabel}` : ""}
                  </p>
                  {p.komenGuru && <p className="mt-1 text-xs text-amber-600">{t.pelajar.commentLabel}: {p.komenGuru}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{t.pelajar.externalActivitiesSection}</h2>
          {aktivitiLuar.length === 0 ? <p className="text-sm text-slate-400">{t.pelajar.noRecords}</p> : (
            <div className="space-y-2">
              {aktivitiLuar.map((a) => (
                <div key={a.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-700">{a.namaAktiviti}</span>
                    <StatusBadge status={a.statusPengesahan} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {a.namaUnit ? `${a.namaUnit} · ` : ""}{a.peringkat}
                    {a.statusPengesahan === "Approved" ? ` · ${a.markahLuar} ${t.pelajar.commentLabel} · ${a.noSiriECert}` : ""}
                  </p>
                  {a.komenGuru && <p className="mt-1 text-xs text-amber-600">{t.pelajar.commentLabel}: {a.komenGuru}</p>}
                  {a.statusPengesahan !== "Approved" && (!a.lampiranSurat || !a.lampiranSijil) && (
                    <EvidenUpload
                      pelajarId={pid}
                      aktivitiId={a.id}
                      adaSurat={!!a.lampiranSurat}
                      adaSijil={!!a.lampiranSijil}
                    />
                  )}
                  {a.statusPengesahan === "Approved" && (
                    <a href={`/api/pelajar/${pid}/ecert/${a.id}`} target="_blank"
                      className="mt-2 inline-block rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-hover">
                      {t.pelajar.generateECert}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
