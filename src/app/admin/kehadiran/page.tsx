import Link from "next/link";
import { dbKohort } from "@/lib/prisma-kohort";
import { getT } from "@/lib/locale";
import { KehadiranTable } from "./KehadiranTable";

const MYT_MS = 8 * 3_600_000;
// Empat bahagian PAJSK, setiap satu dengan warna tetap untuk carta harian.
const BAHAGIAN = [
  { jenis: "Kelab", warna: "#2563eb" },
  { jenis: "Uniform", warna: "#059669" },
  { jenis: "Sukan", warna: "#d97706" },
  { jenis: "Perkhidmatan", warna: "#7c3aed" },
] as const;

/** Tarikh hari ini (YYYY-MM-DD) ikut waktu Malaysia. */
function tarikhHariIniMYT(): string {
  return new Date(Date.now() + MYT_MS).toISOString().slice(0, 10);
}

const back = "group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white";

export default async function AdminKehadiranPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string; jenis?: string; belumSah?: string; tarikh?: string }>;
}) {
  const db = await dbKohort(); // data kohort dipilih sahaja
  const { t } = await getT();
  const d = t.admin.kehadiranPage;
  const JENIS = [
    { v: "Sukan", l: t.common.sukan }, { v: "Kelab", l: t.common.kelab }, { v: "Uniform", l: t.common.uniform },
    { v: "Perkhidmatan", l: t.common.perkhidmatan },
  ];
  const sp = await searchParams;
  const fUnit = sp.unit?.trim() || "";
  const fJenis = sp.jenis?.trim() || "";
  const fBelumSah = sp.belumSah === "1";

  // Ringkasan harian — hari ikut waktu Malaysia (UTC+8); lalai hari ini.
  const hariIni = tarikhHariIniMYT();
  const fTarikh = /^\d{4}-\d{2}-\d{2}$/.test(sp.tarikh ?? "") ? sp.tarikh! : hariIni;
  const mulaHari = new Date(Date.parse(`${fTarikh}T00:00:00Z`) - MYT_MS);
  const sesiHari = await db.sesiKehadiran.findMany({
    where: { tarikh: { gte: mulaHari, lt: new Date(mulaHari.getTime() + 86_400_000) } },
    orderBy: { namaUnit: "asc" },
    include: { kehadiran: { select: { statusHadir: true } } },
  });
  const harian = BAHAGIAN.map((b) => {
    const unit = sesiHari
      .filter((s) => s.jenisKoko === b.jenis)
      .map((s) => {
        const total = s.kehadiran.length;
        const hadir = s.kehadiran.filter((k) => k.statusHadir).length;
        return { nama: s.namaUnit, bil: s.bilPerjumpaan, hadir, total, peratus: total ? Math.round((hadir / total) * 100) : 0 };
      });
    const hadir = unit.reduce((a, u) => a + u.hadir, 0);
    const total = unit.reduce((a, u) => a + u.total, 0);
    return { ...b, label: t.guru.pemilihan.bahagian[b.jenis], unit, hadir, total, peratus: total ? Math.round((hadir / total) * 100) : 0 };
  });

  const semuaUnit = await db.sesiKehadiran.findMany({ select: { namaUnit: true }, distinct: ["namaUnit"], orderBy: { namaUnit: "asc" } });

  const sesi = await db.sesiKehadiran.findMany({
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
  const belumSahCount = rows.filter((r) => !r.disahkan).length;
  const rowsDipaparkan = fBelumSah ? rows.filter((r) => !r.disahkan) : rows;

  const q = new URLSearchParams();
  if (fUnit) q.set("unit", fUnit);
  if (fJenis) q.set("jenis", fJenis);
  const qs = q.toString() ? `&${q.toString()}` : "";

  const qBelumSah = new URLSearchParams(q);
  qBelumSah.set("belumSah", "1");
  const qTanpaBelumSah = new URLSearchParams(q);

  const inp = "rounded-lg border border-slate-300 px-2 py-1.5 text-sm";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className={back}>{t.admin.back}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{d.title}</h1>
        <p className="text-sm text-slate-500">{d.subtitle}</p>
      </div>

      {/* Ringkasan kehadiran harian ikut bahagian KP / BU / SP / UP */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
            {d.dailyTitle} · {new Date(`${fTarikh}T00:00:00Z`).toLocaleDateString("ms-MY", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </h2>
          <form method="get" className="flex flex-wrap items-end gap-2">
            {fUnit && <input type="hidden" name="unit" value={fUnit} />}
            {fJenis && <input type="hidden" name="jenis" value={fJenis} />}
            {fBelumSah && <input type="hidden" name="belumSah" value="1" />}
            <label className="text-xs font-medium text-slate-600">{d.dailyDate}
              <input type="date" name="tarikh" defaultValue={fTarikh} className={`${inp} mt-1 block`} />
            </label>
            <button type="submit" className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-hover">{d.dailyShow}</button>
            {fTarikh !== hariIni && (
              <Link href="/admin/kehadiran" className="px-2 py-2 text-sm text-slate-500 hover:underline">{d.dailyToday}</Link>
            )}
          </form>
        </div>

        {sesiHari.length === 0 ? (
          <p className="text-sm text-slate-400">{d.dailyNone}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {harian.map((b) => (
              <div key={b.jenis} className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs font-semibold text-slate-500">{b.label}</p>
                {b.unit.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">{d.dailyNoMeeting}</p>
                ) : (
                  <>
                    <p className="mt-1 text-2xl font-bold" style={{ color: b.warna }}>{b.peratus}%</p>
                    <p className="text-xs text-slate-500">
                      {b.hadir} / {b.total} {d.dailyPresent} · {b.unit.length} {d.dailySessions}
                    </p>
                    <div className="mt-3 space-y-2">
                      {b.unit.map((u) => (
                        <div key={u.nama} title={`${u.nama} #${u.bil}: ${u.hadir}/${u.total}`}>
                          <div className="mb-0.5 flex justify-between gap-2 text-xs">
                            <span className="truncate text-slate-600">{u.nama}</span>
                            <span className="shrink-0 font-semibold text-slate-700">{u.hadir}/{u.total}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100">
                            <div className="h-2 rounded-full" style={{ width: `${u.peratus}%`, backgroundColor: b.warna }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kad label={d.totalMeetings} nilai={`${rows.length}`} />
        <Kad label={d.avgAttendance} nilai={`${purata}%`} />
        <Kad
          label={d.notVerified}
          nilai={`${belumSahCount}`}
          href={belumSahCount > 0 ? `/admin/kehadiran?${(fBelumSah ? qTanpaBelumSah : qBelumSah).toString()}` : undefined}
          active={fBelumSah}
          hint={belumSahCount > 0 ? d.clickToFilter : undefined}
        />
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
          {fBelumSah && <input type="hidden" name="belumSah" value="1" />}
          <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">{d.filterBtn}</button>
          {(fUnit || fJenis) && <Link href={`/admin/kehadiran${fBelumSah ? "?belumSah=1" : ""}`} className="px-2 py-2 text-sm text-slate-500 hover:underline">{d.resetBtn}</Link>}
        </form>
        <div className="flex gap-2">
          <a href={`/api/admin/kehadiran/eksport?format=excel${qs}`} className="rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-ink-2">⬇ Excel</a>
          <a href={`/api/admin/kehadiran/eksport?format=pdf${qs}`} className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-hover">⬇ PDF</a>
        </div>
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">{d.listTitle}</h2>
          {fBelumSah && (
            <Link href={`/admin/kehadiran?${qTanpaBelumSah.toString()}`} className="text-xs font-semibold text-brand-dark hover:underline">
              {d.showAllBtn}
            </Link>
          )}
        </div>
        {rowsDipaparkan.length === 0 ? (
          <p className="text-sm text-slate-400">{d.noSessions}</p>
        ) : (
          <KehadiranTable
            key={fBelumSah ? "belum-sah" : "semua"}
            rows={rowsDipaparkan}
            t={{ ...t.admin.kehadiranTable, closeLabel: t.common.modalClose }}
            expandAll={fBelumSah}
          />
        )}
      </section>
    </div>
  );
}

function Kad({
  label, nilai, href, active, hint,
}: { label: string; nilai: string; href?: string; active?: boolean; hint?: string }) {
  const kelas = `block rounded-xl bg-white p-4 shadow-sm ring-1 transition ${
    active ? "ring-2 ring-brand" : "ring-slate-200"
  } ${href ? "hover:ring-brand/50" : ""}`;
  const isi = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{nilai}</p>
    </>
  );
  if (href) {
    return <Link href={href} title={hint} className={kelas}>{isi}</Link>;
  }
  return <div className={kelas}>{isi}</div>;
}
