import Link from "next/link";
import { getT } from "@/lib/locale";
import {
  BAHAGIAN,
  analitikRumusan,
  dataRumusan,
  gpsIkutKohort,
  isBahagian,
  senaraiKelas,
  type Bahagian,
  type StatKumpulan,
} from "@/lib/rumusan";
import { normalKohort, senaraiKohort } from "@/lib/kohort";
import { kohortDipilih } from "@/lib/kohort-pilihan";

// Dikira semula setiap permintaan — sentiasa ikut markah terkini yang disahkan.
export const dynamic = "force-dynamic";

const GRED = ["A", "B", "C", "D", "E"] as const;
const WARNA_GRED: Record<(typeof GRED)[number], string> = {
  A: "bg-emerald-100 text-emerald-700",
  B: "bg-sky-100 text-sky-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-orange-100 text-orange-700",
  E: "bg-rose-100 text-rose-700",
};

export default async function AdminRumusanPage({
  searchParams,
}: {
  searchParams: Promise<{ bahagian?: string; kelas?: string; kohort?: string }>;
}) {
  const sp = await searchParams;
  const bahagian = isBahagian(sp.bahagian) ? sp.bahagian : undefined;
  const kelas = sp.kelas?.trim() || undefined;

  // Kohort semasa = kohort terkini; lalai penapis. "semua" = tiada had kohort.
  const kohortList = await senaraiKohort();
  const semasa = kohortList[0];
  const kohort = sp.kohort === "semua" ? undefined : normalKohort(sp.kohort) ?? (await kohortDipilih()) ?? semasa;

  const [rows, semuaRows, kelasList, { t }] = await Promise.all([
    dataRumusan({ bahagian, kelas, kohort }),
    dataRumusan(),
    senaraiKelas(),
    getT(),
  ]);
  const a = analitikRumusan(rows);
  const gpsTahun = gpsIkutKohort(semuaRows);
  const gpsSemasa = gpsTahun.find((g) => g.kohort === semasa);
  const r = t.admin.rumusan;
  const labelBahagian: Record<Bahagian, string> = {
    Kelab: t.common.kelab, Sukan: t.common.sukan, Uniform: t.common.uniform, Perkhidmatan: t.common.perkhidmatan,
  };

  const qs = new URLSearchParams({
    ...(bahagian ? { bahagian } : {}), ...(kelas ? { kelas } : {}), ...(kohort ? { kohort } : {}),
  }).toString();
  const pilihCls = "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.admin.back}</Link>
          <h1 className="mt-1 text-xl font-bold text-slate-800">{r.title}</h1>
          <p className="max-w-3xl text-sm text-slate-500">{r.subtitle}</p>
        </div>
        <a href={`/api/admin/rumusan${qs ? `?${qs}` : ""}`} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">
          {r.download}
        </a>
      </div>

      {/* GPS semasa + mengikut tahun — tidak terjejas oleh penapis di bawah */}
      {gpsSemasa && (
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
            {r.gpsCurrent} · {gpsSemasa.kohort} <span className="font-normal normal-case text-slate-400">({gpsSemasa.pelajar} {r.students})</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[{ ...gpsSemasa.keseluruhan, nama: r.overall }, ...gpsSemasa.bahagian.map((s) => ({ ...s, nama: labelBahagian[s.bahagian!] }))].map((s) => (
              <div key={s.nama} className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.nama}</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{s.gps?.toFixed(2) ?? "—"}</p>
                <p className="text-xs text-slate-500">{s.ahli} {t.guru.memberCount}</p>
              </div>
            ))}
          </div>

          <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-slate-600">{r.gpsByYear}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2 pr-3">{r.kohort}</th>
                  <th className="py-2 pr-3 text-right">{r.students}</th>
                  <th className="py-2 pr-3 text-right">{r.overall}</th>
                  {BAHAGIAN.map((b) => <th key={b} className="py-2 pr-3 text-right">{labelBahagian[b]}</th>)}
                </tr>
              </thead>
              <tbody>
                {gpsTahun.map((g) => (
                  <tr key={g.kohort} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 font-medium text-slate-800">
                      {g.kohort}{g.kohort === semasa && <span className="ml-1 text-xs font-normal text-brand-dark">({r.current})</span>}
                    </td>
                    <td className="py-2 pr-3 text-right">{g.pelajar}</td>
                    <td className="py-2 pr-3 text-right font-semibold">{g.keseluruhan.gps?.toFixed(2) ?? "—"}</td>
                    {g.bahagian.map((s) => <td key={s.bahagian} className="py-2 pr-3 text-right">{s.gps?.toFixed(2) ?? "—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs italic text-slate-500">{r.gpsNote}</p>
        </section>
      )}

      <form className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <label className="text-xs font-semibold text-slate-600">
          {r.kohort}
          <select name="kohort" defaultValue={kohort ?? "semua"} className={`mt-1 block ${pilihCls}`}>
            {kohortList.map((k) => <option key={k} value={k}>{k}{k === semasa ? ` (${r.current})` : ""}</option>)}
            <option value="semua">{r.allKohort}</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          {r.bahagian}
          <select name="bahagian" defaultValue={bahagian ?? ""} className={`mt-1 block ${pilihCls}`}>
            <option value="">{r.all}</option>
            {BAHAGIAN.map((b) => <option key={b} value={b}>{labelBahagian[b]}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          {r.kelas}
          <select name="kelas" defaultValue={kelas ?? ""} className={`mt-1 block ${pilihCls}`}>
            <option value="">{r.all}</option>
            {kelasList.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded-md bg-ink px-4 py-1.5 text-sm font-semibold text-white hover:bg-ink-2">{r.filter}</button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">{r.noData}</p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[{ ...a.keseluruhan, nama: r.overall }, ...a.bahagian.map((s) => ({ ...s, nama: labelBahagian[s.bahagian!] }))]
              .filter((s) => s.ahli > 0)
              .map((s) => (
                <div key={s.nama} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.nama}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">{s.purata ?? "—"}</p>
                  <p className="text-xs text-slate-500">{r.average} · {s.ahli} {t.guru.memberCount}{s.gps !== null ? ` · ${r.gps} ${s.gps.toFixed(2)}` : ""}</p>
                  {s.purata !== null && <TaburanGred s={s} />}
                </div>
              ))}
          </section>

          <Jadual
            tajuk={r.byUnit}
            kolPertama={r.unit}
            data={a.unit}
            r={r}
            bahagianLabel={(s) => labelBahagian[s.bahagian!]}
            pautan={(s) => `/api/borang-rumusan?unit=${encodeURIComponent(s.nama)}`}
          />
          <Jadual tajuk={r.byKelas} kolPertama={r.kelas} data={a.kelas} r={r} />
          <p className="text-xs italic text-slate-500">{r.bonusNote}</p>
        </>
      )}
    </div>
  );
}

function TaburanGred({ s }: { s: StatKumpulan }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {GRED.map((g) => (
        <span key={g} className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${WARNA_GRED[g]}`}>
          {g}: {s.gred[g]}
        </span>
      ))}
    </div>
  );
}

function Jadual({
  tajuk,
  kolPertama,
  data,
  r,
  bahagianLabel,
  pautan,
}: {
  tajuk: string;
  kolPertama: string;
  data: StatKumpulan[];
  r: { members: string; average: string; bahagian: string; form: string; gps: string };
  bahagianLabel?: (s: StatKumpulan) => string;
  pautan?: (s: StatKumpulan) => string;
}) {
  return (
    <section className="overflow-x-auto rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{tajuk}</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
            <th className="py-2 pr-3">{kolPertama}</th>
            {bahagianLabel && <th className="py-2 pr-3">{r.bahagian}</th>}
            <th className="py-2 pr-3 text-right">{r.members}</th>
            <th className="py-2 pr-3 text-right">{r.average}</th>
            <th className="py-2 pr-3 text-right">{r.gps}</th>
            {GRED.map((g) => <th key={g} className="py-2 pr-3 text-right">{g}</th>)}
            {pautan && <th className="py-2 text-right">{r.form}</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((s) => (
            <tr key={`${s.bahagian ?? ""}|${s.nama}`} className="border-b border-slate-100 last:border-0">
              <td className="py-2 pr-3 font-medium text-slate-800">{s.nama}</td>
              {bahagianLabel && <td className="py-2 pr-3 text-slate-500">{bahagianLabel(s)}</td>}
              <td className="py-2 pr-3 text-right">{s.ahli}</td>
              <td className="py-2 pr-3 text-right font-semibold">{s.purata ?? "—"}</td>
              <td className="py-2 pr-3 text-right">{s.gps?.toFixed(2) ?? "—"}</td>
              {GRED.map((g) => (
                <td key={g} className="py-2 pr-3 text-right text-slate-600">{s.purata === null ? "—" : s.gred[g]}</td>
              ))}
              {pautan && (
                <td className="py-2 text-right">
                  <a href={pautan(s)} className="text-xs font-semibold text-brand-dark hover:underline">⬇ Excel</a>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
