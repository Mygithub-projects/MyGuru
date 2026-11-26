"use client";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import type { RekodDisahkan as Rekod } from "@/lib/batal-pengesahan";

const HAD_PAPAR = 50;

export function RekodDisahkan({ rows, en, jenis, pilihan, basePath }: {
  rows: Rekod[];
  en: boolean;
  jenis: string;
  pilihan: { value: string; label: string }[];
  basePath: string;
}) {
  const router = useRouter();
  const [cari, setCari] = useState("");
  const [dari, setDari] = useState("");
  const [hingga, setHingga] = useState("");
  const [had, setHad] = useState(HAD_PAPAR);
  const [buka, setBuka] = useState<string | null>(null);
  const q = cari.trim().toLowerCase();
  // Tarikh tempatan YYYY-MM-DD supaya setanding dengan <input type="date">.
  const hari = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-CA") : "");
  const ditapis = rows.filter((r) => {
    if (q && ![r.tajuk, r.pelajar, r.unit, r.pengesah].some((x) => x?.toLowerCase().includes(q))) return false;
    const h = hari(r.tarikhSahkan);
    if (dari && (!h || h < dari)) return false;
    if (hingga && (!h || h > hingga)) return false;
    return true;
  });
  const paparan = ditapis.slice(0, had);
  const adaTapis = !!(q || dari || hingga);
  const adaPelajar = rows.some((r) => r.pelajar);
  const ctl = "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm";
  const ubah = <T,>(set: (v: T) => void) => (v: T) => { set(v); setHad(HAD_PAPAR); };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={jenis} onChange={(e) => router.push(`${basePath}?jenis=${e.target.value}`)}
          aria-label={en ? "Record type" : "Jenis rekod"} className={`${ctl} font-semibold text-slate-700`}>
          {pilihan.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <input value={cari} onChange={(e) => ubah(setCari)(e.target.value)} type="search"
          placeholder={en ? "Find name, unit, verifier…" : "Cari nama, unit, pengesah…"}
          className={`${ctl} min-w-0 flex-1 sm:max-w-xs`} />
        <label className="flex items-center gap-1 text-xs text-slate-500">
          {en ? "From" : "Dari"}
          <input type="date" value={dari} max={hingga || undefined} onChange={(e) => ubah(setDari)(e.target.value)} className={ctl} />
        </label>
        <label className="flex items-center gap-1 text-xs text-slate-500">
          {en ? "To" : "Hingga"}
          <input type="date" value={hingga} min={dari || undefined} onChange={(e) => ubah(setHingga)(e.target.value)} className={ctl} />
        </label>
        {adaTapis && (
          <button onClick={() => { setCari(""); setDari(""); setHingga(""); setHad(HAD_PAPAR); }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 hover:underline">
            {en ? "Clear" : "Kosongkan"}
          </button>
        )}
        <span className="text-xs text-slate-500">{ditapis.length} {en ? "records" : "rekod"}</span>
      </div>

      {paparan.length === 0 ? (
        <p className="rounded-xl bg-white p-4 text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
          {en ? "No verified records you can cancel." : "Tiada rekod disahkan yang boleh anda batalkan."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {adaPelajar && <th className="px-3 py-2 font-semibold">{en ? "Student" : "Pelajar"}</th>}
                <th className="px-3 py-2 font-semibold">{en ? "Item" : "Perkara"}</th>
                <th className="hidden px-3 py-2 font-semibold md:table-cell">Unit</th>
                <th className="hidden px-3 py-2 font-semibold lg:table-cell">{en ? "Verified by" : "Disahkan oleh"}</th>
                <th className="hidden px-3 py-2 font-semibold sm:table-cell">{en ? "Date" : "Tarikh"}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paparan.map((r) => (
                <Fragment key={r.id}>
                  <tr className="hover:bg-slate-50">
                    {adaPelajar && <td className="whitespace-nowrap px-3 py-1.5 font-medium text-slate-800">{r.pelajar ?? "-"}</td>}
                    <td className="max-w-xs truncate px-3 py-1.5 text-slate-700" title={r.tajuk}>{r.tajuk}</td>
                    <td className="hidden max-w-[12rem] truncate px-3 py-1.5 text-slate-500 md:table-cell" title={r.unit ?? ""}>{r.unit ?? "-"}</td>
                    <td className="hidden max-w-[12rem] truncate px-3 py-1.5 text-slate-500 lg:table-cell" title={r.pengesah ?? ""}>{r.pengesah ?? "-"}</td>
                    <td className="hidden whitespace-nowrap px-3 py-1.5 text-slate-500 sm:table-cell">
                      {r.tarikhSahkan ? new Date(r.tarikhSahkan).toLocaleDateString("ms-MY") : "-"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-right">
                      <button onClick={() => setBuka(buka === r.id ? null : r.id)}
                        className="text-xs font-semibold text-rose-600 hover:underline">
                        {buka === r.id ? (en ? "Close" : "Tutup") : en ? "Cancel" : "Batal"}
                      </button>
                    </td>
                  </tr>
                  {buka === r.id && (
                    <tr className="bg-rose-50/40">
                      <td colSpan={6} className="px-3 py-2">
                        <BorangBatal r={r} en={en} onSelesai={() => setBuka(null)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          {ditapis.length > paparan.length && (
            <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
              <span>{en ? `Showing ${paparan.length} of ${ditapis.length}` : `Papar ${paparan.length} daripada ${ditapis.length}`}</span>
              <button onClick={() => setHad(had + HAD_PAPAR)} className="font-semibold text-brand-dark hover:underline">
                {en ? `Show ${HAD_PAPAR} more` : `Tunjuk ${HAD_PAPAR} lagi`}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function BorangBatal({ r, en, onSelesai }: { r: Rekod; en: boolean; onSelesai: () => void }) {
  const router = useRouter();
  const [sebab, setSebab] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function batal() {
    if (!sebab.trim()) { setMsg(en ? "State the reason." : "Nyatakan sebab pembatalan."); return; }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/pengesahan/batal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenis: r.jenis, id: r.id, sebab: sebab.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (json?.success) { onSelesai(); router.refresh(); return; }
      setMsg(json?.message ?? `${en ? "Request failed" : "Permintaan gagal"} (${res.status})`);
    } catch {
      setMsg(en ? "Network error." : "Ralat rangkaian.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input value={sebab} onChange={(e) => setSebab(e.target.value)} maxLength={500} autoFocus
        onKeyDown={(e) => e.key === "Enter" && batal()}
        placeholder={en ? "Reason (sent to the student)" : "Sebab pembatalan (dihantar kepada pelajar)"}
        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm" />
      <button onClick={batal} disabled={busy}
        className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
        {busy ? "…" : en ? "Confirm cancel" : "Sahkan batal"}
      </button>
      {msg && <span className="w-full text-xs text-rose-600">{msg}</span>}
    </div>
  );
}
