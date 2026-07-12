import Link from "next/link";
import { notFound } from "next/navigation";
import { getPelajarProfil } from "@/lib/pelajar";
import { StatusBadge } from "@/components/StatusBadge";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default async function AdminPelajarDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPelajarProfil(id);
  if (!data) notFound();
  const { pelajar, markah, penyertaan, kehadiran } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← Senarai Pelajar</Link>
          <h1 className="mt-1 text-xl font-bold text-slate-800">{pelajar.nama}</h1>
          <p className="text-sm text-slate-500">{pelajar.kelasT6 ?? "-"} · No. KP: {pelajar.noIc}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/pelajar/${pelajar.id}/butiran-diri?download=1`} className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover">⬇ Muat turun PDF</a>
          <a href={`/api/pelajar/${pelajar.id}/butiran-diri`} target="_blank" className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">👁 Papar PDF</a>
          <Link href={`/admin/pelajar/${pelajar.id}/edit`} className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">✏ Edit</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Markah PAJSK T6" value={`${pelajar.markahPajskT6 ?? "-"}`} sub="/ 100 markah penuh" />
        <Stat label="Peratus T6" value={`${pelajar.peratusPajskT6 ?? "-"}%`} />
        <Stat label="Gred" value={`${pelajar.gredPajskT6 ?? "-"}`} sub="A–E" />
        <Stat label="Kehadiran" value={`${kehadiran.hadir}/${kehadiran.jumlahSetahun}`} sub={`${kehadiran.peratus}% · ${kehadiran.markah} markah`} />
      </div>

      {/* Penyertaan (kelab/sukan/BB) + markah */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">Penyertaan & Markah (T6)</h2>
        {penyertaan.length === 0 ? (
          <p className="text-sm text-slate-400">Belum berdaftar dalam mana-mana unit.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {penyertaan.map((p) => (
              <div key={p.jenisKoko} className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase text-brand-dark">{p.label}</p>
                <p className="mt-1 font-medium text-slate-800">{p.namaUnit}</p>
                <p className="text-xs text-slate-500">{p.jawatan ?? "-"} · {p.peringkat ?? "-"}</p>
                <p className="mt-1 text-sm">Jawatan <strong>{p.markahJawatan}</strong> · Peringkat <strong>{p.markahPeringkat}</strong> · Jumlah <strong className="text-brand-dark">{p.jumlah}</strong></p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pecahan Markah PAJSK (T6) */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">Pecahan Markah PAJSK (T6)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="py-2 pr-3">Komponen Pentaksiran</th>
                <th className="py-2">Markah</th>
              </tr>
            </thead>
            <tbody>
              {markah.map((m) => (
                <tr key={m.kategori} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pr-3 font-medium text-slate-700">{m.kategori}</td>
                  <td className="py-2 font-semibold text-brand-dark">{m.nilai} / {m.maks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pencapaian */}
      {pelajar.pencapaian.length > 0 && (
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">Pencapaian & Aktiviti</h2>
          <ul className="space-y-2">
            {pelajar.pencapaian.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <span className="text-slate-700">{p.namaPencapaian} <span className="text-xs text-slate-400">· {p.markah} markah</span></span>
                <StatusBadge status={p.statusSemakan} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
