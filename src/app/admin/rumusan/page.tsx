import Link from "next/link";
import { getT } from "@/lib/locale";
import {
  BAHAGIAN,
  analitikRumusan,
  dataRumusan,
  isBahagian,
  senaraiKelas,
  type Bahagian,
  type StatKumpulan,
} from "@/lib/rumusan";

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
  searchParams: Promise<{ bahagian?: string; kelas?: string }>;
}) {
  const sp = await searchParams;
  const bahagian = isBahagian(sp.bahagian) ? sp.bahagian : undefined;
  const kelas = sp.kelas?.trim() || undefined;

  const [rows, kelasList, { t }] = await Promise.all([dataRumusan({ bahagian, kelas }), senaraiKelas(), getT()]);
  const a = analitikRumusan(rows);
  const r = t.admin.rumusan;
  const labelBahagian: Record<Bahagian, string> = {
    Kelab: t.common.kelab, Sukan: t.common.sukan, Uniform: t.common.uniform, Perkhidmatan: t.common.perkhidmatan,
  };

  const qs = new URLSearchParams({ ...(bahagian ? { bahagian } : {}), ...(kelas ? { kelas } : {}) }).toString();
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

      <form className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
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
                  <p className="text-xs text-slate-500">{r.average} · {s.ahli} {t.guru.memberCount}</p>
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
  r: { members: string; average: string; bahagian: string; form: string };
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
