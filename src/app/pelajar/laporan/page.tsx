import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { ringkasanSesi, sesiUntukUnit } from "@/lib/kehadiran";
import { getT } from "@/lib/locale";
import { SortToggle } from "@/components/SortToggle";
import { LaporanForm } from "./LaporanForm";

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const session = await getSession();
  if (!session?.pelajarId) redirect("/login");
  const { t } = await getT();
  const arah: "asc" | "desc" = (await searchParams).sort === "lama" ? "asc" : "desc";

  const isSU = session.subRole === "SU" || session.subRole === "NSU";
  if (!isSU) {
    return (
      <div className="space-y-4">
        <Link href="/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← {t.common.kembali}</Link>
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          {t.laporan.suNsuOnly}
        </div>
      </div>
    );
  }

  const koko = await prisma.kokurikulum.findMany({ where: { pelajarId: session.pelajarId } });
  const units = koko.filter((k) => k.namaUnitT6).map((k) => k.namaUnitT6!) as string[];

  const [mingguan, projek, sesiList] = await Promise.all([
    prisma.laporanMingguan.findMany({ where: { setiausahaId: session.pelajarId }, orderBy: { tarikh: arah } }),
    prisma.laporanProjek.findMany({ where: { setiausahaId: session.pelajarId }, orderBy: { createdAt: arah } }),
    sesiUntukUnit(units),
  ]);

  // Ringkasan kehadiran bagi sesi yang dipaut
  const sesiIds = [
    ...new Set([...mingguan, ...projek].map((r) => r.sesiId).filter(Boolean) as string[]),
  ];
  const ringkasan: Record<string, { hadir: number; total: number; peratus: number }> = {};
  await Promise.all(sesiIds.map(async (id) => { ringkasan[id] = await ringkasanSesi(id); }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← {t.common.kembali}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.laporan.title}</h1>
        <p className="text-sm text-slate-500">{t.laporan.sub}</p>
      </div>

      <LaporanForm
        units={koko.filter((k) => k.namaUnitT6).map((k) => ({ jenisKoko: k.jenisKoko, namaUnit: k.namaUnitT6! }))}
        projek={projek.map((p) => ({ id: p.id, namaProjek: p.namaProjek, status: p.statusPengesahan }))}
        sesiList={sesiList.map((s) => ({ id: s.id, namaUnit: s.namaUnit, bilPerjumpaan: s.bilPerjumpaan }))}
      />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">{t.laporan.title}</h2>
        <SortToggle t={t.common.sortToggle} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{t.laporan.weekly}</h2>
          {mingguan.length === 0 ? <Empty message={t.laporan.noRecords} /> : (
            <div className="space-y-2">
              {mingguan.map((m) => (
                <div key={m.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{m.aktiviti}</span>
                    <StatusBadge status={m.statusSemakan} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(m.tarikh).toLocaleDateString("ms-MY")} {m.masa ? `· ${m.masa}` : ""}
                    {m.lampiran ? t.laporan.attachmentLabel : ""}
                  </p>
                  <Kehadiran sesiId={m.sesiId} r={ringkasan} labelHadir={t.laporan.reportAttendanceLabel} labelLihat={t.laporan.reportViewSession} />
                  {m.komenGuru && <p className="mt-1 text-xs text-amber-600">{t.laporan.comment}: {m.komenGuru}</p>}
                  {m.statusSemakan === "Approved" && (
                    <a href={`/api/laporan/mingguan/${m.id}/pdf`} className="mt-1 inline-block text-xs font-semibold text-brand-dark hover:underline">{t.laporan.downloadVerified}</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{t.laporan.project}</h2>
          {projek.length === 0 ? <Empty message={t.laporan.noRecords} /> : (
            <div className="space-y-2">
              {projek.map((p) => (
                <div key={p.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{p.namaProjek}</span>
                    <StatusBadge status={p.statusPengesahan} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {p.failKertasKerja ? t.laporan.attachmentWorkPlan : ""} {p.failLaporanImpak ? `· ${t.laporan.attachmentImpactReport}` : ""}
                  </p>
                  <Kehadiran sesiId={p.sesiId} r={ringkasan} labelHadir={t.laporan.reportAttendanceLabel} labelLihat={t.laporan.reportViewSession} />
                  {p.komenGuru && <p className="mt-1 text-xs text-amber-600">{t.laporan.comment}: {p.komenGuru}</p>}
                  {p.statusPengesahan === "Approved" && (
                    <a href={`/api/laporan/projek/${p.id}/pdf`} className="mt-1 inline-block text-xs font-semibold text-brand-dark hover:underline">{t.laporan.downloadVerified}</a>
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

function Kehadiran({
  sesiId,
  r,
  labelHadir,
  labelLihat,
}: {
  sesiId: string | null;
  r: Record<string, { hadir: number; total: number; peratus: number }>;
  labelHadir: string;
  labelLihat: string;
}) {
  if (!sesiId || !r[sesiId]) return null;
  const s = r[sesiId];
  return (
    <p className="mt-1 flex items-center gap-2 text-xs">
      <span className="rounded bg-brand-light px-1.5 py-0.5 font-semibold text-brand-dark">
        {labelHadir}: {s.hadir}/{s.total} ({s.peratus}%)
      </span>
      <Link href="/pelajar/kehadiran" className="text-brand-dark hover:underline">{labelLihat}</Link>
    </p>
  );
}

function Empty({ message }: { message: string }) {
  return <p className="text-sm text-slate-400">{message}</p>;
}
