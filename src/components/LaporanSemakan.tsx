import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { LaporanSU } from "@/lib/laporan-semakan";
import { StatusBadge } from "./StatusBadge";
import { LaporanSemakanAksi } from "./LaporanSemakanAksi";

// Halaman semakan laporan SU/NSU — dikongsi oleh /guru/laporan & /admin/laporan.
export function LaporanSemakan({
  rows,
  basePath,
  jenis,
  status,
  t,
}: {
  rows: LaporanSU[];
  basePath: string;
  jenis: string;
  status: string;
  t: Dict;
}) {
  const d = t.laporan.semakan;
  const inp = "rounded-lg border border-slate-300 px-2 py-1.5 text-sm";
  const pautan = "rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-200";
  const STATUS = [
    { v: "", l: d.all },
    { v: "Pending", l: d.pending },
    { v: "Approved", l: d.approved },
    { v: "Kuiri", l: d.query },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{d.title}</h1>
        <p className="text-sm text-slate-500">{d.sub}</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <label className="text-xs font-medium text-slate-600">{d.typeLabel}
          <select name="jenis" defaultValue={jenis} className={`${inp} mt-1 block`}>
            <option value="">{d.all}</option>
            <option value="mingguan">{t.laporan.weekly}</option>
            <option value="projek">{t.laporan.project}</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">{d.statusLabel}
          <select name="status" defaultValue={status} className={`${inp} mt-1 block`}>
            {STATUS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">{d.filterBtn}</button>
        {(jenis || status) && (
          <Link href={basePath} className="px-2 py-2 text-sm text-slate-500 hover:underline">{t.admin.kehadiranPage.resetBtn}</Link>
        )}
      </form>

      <section className="space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-xl bg-white p-5 text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">{d.empty}</p>
        ) : (
          rows.map((r) => (
            <article key={`${r.jenis}-${r.id}`} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {r.jenis === "mingguan" ? t.laporan.weekly : t.laporan.project}
                  </p>
                  <h2 className="font-semibold text-slate-800">{r.tajuk}</h2>
                  <p className="text-xs text-slate-500">
                    {[
                      r.namaUnit,
                      r.peringkat,
                      r.jawatan ? `${d.position}: ${r.jawatan}` : null,
                      r.tarikh ? new Date(r.tarikh).toLocaleDateString("ms-MY") : null,
                    ].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-xs text-slate-500">{d.by} {r.setiausaha}{r.kelas ? ` (${r.kelas})` : ""}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              {r.laporan && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{r.laporan}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {r.eviden.map((u, i) => (
                  <a key={u} href={u} target="_blank" rel="noopener" className={pautan}>
                    📎 {d.evidence}{r.eviden.length > 1 ? ` ${i + 1}` : ""}
                  </a>
                ))}
                {r.kertasKerja && (
                  <a href={r.kertasKerja} target="_blank" rel="noopener" className={pautan}>📋 {d.workPlan}</a>
                )}
                {r.status === "Approved" && (
                  <a href={`/api/laporan/${r.jenis}/${r.id}/pdf`} className="font-semibold text-brand-dark hover:underline">
                    {t.laporan.downloadVerified}
                  </a>
                )}
                {r.status === "Pending" && <LaporanSemakanAksi jenis={r.jenis} id={r.id} t={d} />}
              </div>
              {r.status === "Approved" && r.disahkanOleh && (
                <p className="mt-2 text-xs text-emerald-700">{d.approvedBy}: {r.disahkanOleh}</p>
              )}
              {r.komen && <p className="mt-2 text-xs text-amber-600">{t.laporan.comment}: {r.komen}</p>}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
