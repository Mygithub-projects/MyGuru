import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/locale";
import { KehadiranTable } from "./KehadiranTable";

const back = "group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white";

export default async function AdminKehadiranPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string; jenis?: string }>;
}) {
  const { t } = await getT();
  const d = t.admin.kehadiranPage;
  const JENIS = [
    { v: "Sukan", l: t.common.sukan }, { v: "Kelab", l: t.common.kelab }, { v: "Uniform", l: t.common.uniform },
    { v: "Perkhidmatan", l: t.common.perkhidmatan },
  ];
  const sp = await searchParams;
  const fUnit = sp.unit?.trim() || "";
  const fJenis = sp.jenis?.trim() || "";

  const semuaUnit = await prisma.sesiKehadiran.findMany({ select: { namaUnit: true }, distinct: ["namaUnit"], orderBy: { namaUnit: "asc" } });

  const sesi = await prisma.sesiKehadiran.findMany({
    where: { ...(fUnit ? { namaUnit: fUnit } : {}), ...(fJenis ? { jenisKoko: fJenis } : {}) },
    orderBy: [{ namaUnit: "asc" }, { bilPerjumpaan: "asc" }],
    include: { kehadiran: { select: { statusHadir: true } } },
  });

  const rows = sesi.map((s) => {
    const total = s.kehadiran.length;
    const hadir = s.kehadiran.filter((k) => k.statusHadir).length;
    return {
      id: s.id, jenisKoko: s.jenisKoko, namaUnit: s.namaUnit, bil: s.bilPerjumpaan,
      tarikh: s.tarikh.toISOString(), hadir, total,
      peratus: total ? Math.round((hadir / total) * 1000) / 10 : 0, disahkan: s.disahkan,
    };
  });
  const purata = rows.length ? Math.round((rows.reduce((a, r) => a + r.peratus, 0) / rows.length) * 10) / 10 : 0;

  const q = new URLSearchParams();
  if (fUnit) q.set("unit", fUnit);
  if (fJenis) q.set("jenis", fJenis);
  const qs = q.toString() ? `&${q.toString()}` : "";

  const inp = "rounded-lg border border-slate-300 px-2 py-1.5 text-sm";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className={back}>{t.admin.back}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{d.title}</h1>
        <p className="text-sm text-slate-500">{d.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kad label={d.totalMeetings} nilai={`${rows.length}`} />
        <Kad label={d.avgAttendance} nilai={`${purata}%`} />
        <Kad label={d.notVerified} nilai={`${rows.filter((r) => !r.disahkan).length}`} />
      </div>

      {/* Penapis + Eksport */}
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-slate-600">{d.unitLabel}
            <select name="unit" defaultValue={fUnit} className={`${inp} mt-1 block`}>
              <option value="">{d.allUnits}</option>
              {semuaUnit.map((u) => <option key={u.namaUnit} value={u.namaUnit}>{u.namaUnit}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">{d.typeLabel}
            <select name="jenis" defaultValue={fJenis} className={`${inp} mt-1 block`}>
              <option value="">{d.allTypes}</option>
              {JENIS.map((j) => <option key={j.v} value={j.v}>{j.l}</option>)}
            </select>
          </label>
          <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">{d.filterBtn}</button>
          {(fUnit || fJenis) && <Link href="/admin/kehadiran" className="px-2 py-2 text-sm text-slate-500 hover:underline">{d.resetBtn}</Link>}
        </form>
        <div className="flex gap-2">
          <a href={`/api/admin/kehadiran/eksport?format=excel${qs}`} className="rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-ink-2">⬇ Excel</a>
          <a href={`/api/admin/kehadiran/eksport?format=pdf${qs}`} className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-hover">⬇ PDF</a>
        </div>
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{d.listTitle}</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400">{d.noSessions}</p>
        ) : (
          <KehadiranTable rows={rows} t={{ ...t.admin.kehadiranTable, closeLabel: t.common.modalClose }} />
        )}
      </section>
    </div>
  );
}

function Kad({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{nilai}</p>
    </div>
  );
}
