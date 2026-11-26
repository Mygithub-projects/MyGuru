"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RekodDisahkan as Rekod } from "@/lib/batal-pengesahan";

export function RekodDisahkan({ rows, en }: { rows: Rekod[]; en: boolean }) {
  const [cari, setCari] = useState("");
  const q = cari.trim().toLowerCase();
  const paparan = q
    ? rows.filter((r) => [r.tajuk, r.pelajar, r.unit, r.pengesah].some((x) => x?.toLowerCase().includes(q)))
    : rows;

  return (
    <section className="space-y-3">
      <input value={cari} onChange={(e) => setCari(e.target.value)}
        placeholder={en ? "Search name, unit, verifier…" : "Cari nama, unit, pengesah…"}
        className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm" />
      {paparan.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
          {en ? "No verified records you can cancel." : "Tiada rekod disahkan yang boleh anda batalkan."}
        </p>
      ) : (
        <ul className="space-y-2">
          {paparan.map((r) => <Baris key={r.id} r={r} en={en} />)}
        </ul>
      )}
    </section>
  );
}

function Baris({ r, en }: { r: Rekod; en: boolean }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [sebab, setSebab] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function batal() {
    if (!sebab.trim()) { setMsg({ text: en ? "State the reason." : "Nyatakan sebab pembatalan.", ok: false }); return; }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/pengesahan/batal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenis: r.jenis, id: r.id, sebab: sebab.trim() }),
      });
      const json = await res.json().catch(() => null);
      setMsg({ text: json?.message ?? `${en ? "Request failed" : "Permintaan gagal"} (${res.status})`, ok: !!json?.success });
      if (json?.success) router.refresh();
    } catch {
      setMsg({ text: en ? "Network error." : "Ralat rangkaian.", ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{r.pelajar ?? r.tajuk}</p>
          {r.pelajar && <p className="text-sm text-slate-700">{r.tajuk}</p>}
          <p className="text-xs text-slate-500">
            {r.unit ?? "-"}
            {" · "}{en ? "Verified by" : "Disahkan oleh"}: {r.pengesah ?? (en ? "not recorded" : "tidak direkod")}
            {r.tarikhSahkan ? ` · ${new Date(r.tarikhSahkan).toLocaleDateString("ms-MY")}` : ""}
          </p>
        </div>
        {!buka && (
          <button onClick={() => setBuka(true)}
            className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100">
            {en ? "Cancel verification" : "Batal pengesahan"}
          </button>
        )}
      </div>
      {buka && (
        <div className="mt-2 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-2">
          <label className="min-w-[14rem] flex-1 text-xs font-semibold text-slate-600">
            {en ? "Reason (sent to the student)" : "Sebab (dihantar kepada pelajar)"}
            <input value={sebab} onChange={(e) => setSebab(e.target.value)} maxLength={500} autoFocus
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm font-normal" />
          </label>
          <button onClick={batal} disabled={busy}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
            {busy ? "…" : en ? "Confirm cancel" : "Sahkan pembatalan"}
          </button>
          <button onClick={() => { setBuka(false); setMsg(null); }} disabled={busy}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            {en ? "Back" : "Kembali"}
          </button>
        </div>
      )}
      {msg && <p className={`mt-1 text-xs ${msg.ok ? "text-emerald-700" : "text-rose-600"}`}>{msg.text}</p>}
    </li>
  );
}
