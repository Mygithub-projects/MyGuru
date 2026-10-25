import Link from "next/link";
import { ringkasanKelasRawData } from "@/lib/eksport";
import { getT } from "@/lib/locale";

export default async function RawDataPage() {
  const [kelas, { t }] = await Promise.all([ringkasanKelasRawData(), getT()]);
  const r = t.admin.rawData;
  const jumlah = kelas.reduce((n, k) => n + k.bil, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.admin.back}</Link>
          <h1 className="mt-1 text-xl font-bold text-slate-800">{r.title}</h1>
          <p className="text-sm text-slate-500">{r.subtitle}</p>
        </div>
        <a href="/api/admin/raw-data" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">{r.button}</a>
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-600">{r.contentsTitle}</h2>
        <p className="mb-4 text-sm text-slate-500">{r.formatNote}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {kelas.map((k) => (
            <div key={k.kelas} className="rounded-lg border border-slate-200 px-3 py-2">
              <p className="font-semibold text-slate-800">{k.kelas}</p>
              <p className="text-xs text-slate-500">{k.bil} {r.students}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-brand-dark">{kelas.length} {r.sheets} · {jumlah} {r.students}</p>
      </section>
    </div>
  );
}
