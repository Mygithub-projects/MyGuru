"use client";
import { useState } from "react";

interface P { id: string; nama: string; noIc: string; jantina: string | null; kaum: string | null; agama: string | null; }

const KAUM = ["Melayu", "Cina", "India", "Lain-lain"];
const AGAMA = ["Islam", "Buddha", "Hindu", "Kristian", "Lain-lain"];

export function DemografiClient({ pelajar: initial }: { pelajar: P[] }) {
  const [rows, setRows] = useState(initial);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  function update(id: string, field: keyof P, value: string) {
    setRows((r) => r.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  async function simpan(p: P) {
    setSavingId(p.id);
    setSavedId(null);
    try {
      const res = await fetch(`/api/admin/demografi/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jantina: p.jantina || null, kaum: p.kaum || null, agama: p.agama || null }),
      });
      if (res.ok) { setSavedId(p.id); setTimeout(() => setSavedId(null), 1500); }
    } finally {
      setSavingId(null);
    }
  }

  const sel = "rounded-md border border-slate-300 px-2 py-1 text-sm";

  return (
    <div className="overflow-x-auto rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
            <th className="py-2 pr-3">Nama</th>
            <th className="py-2 pr-3">Jantina</th>
            <th className="py-2 pr-3">Kaum</th>
            <th className="py-2 pr-3">Agama</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-b border-slate-100 last:border-0">
              <td className="py-2 pr-3">
                <span className="font-medium text-slate-700">{p.nama}</span>
                <span className="block text-xs text-slate-400">{p.noIc}</span>
              </td>
              <td className="py-2 pr-3">
                <select className={sel} value={p.jantina ?? ""} onChange={(e) => update(p.id, "jantina", e.target.value)}>
                  <option value="">—</option>
                  <option value="L">L</option>
                  <option value="P">P</option>
                </select>
              </td>
              <td className="py-2 pr-3">
                <select className={sel} value={p.kaum ?? ""} onChange={(e) => update(p.id, "kaum", e.target.value)}>
                  <option value="">—</option>
                  {KAUM.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </td>
              <td className="py-2 pr-3">
                <select className={sel} value={p.agama ?? ""} onChange={(e) => update(p.id, "agama", e.target.value)}>
                  <option value="">—</option>
                  {AGAMA.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </td>
              <td className="py-2">
                <button onClick={() => simpan(p)} disabled={savingId === p.id}
                  className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
                  {savingId === p.id ? "..." : savedId === p.id ? "✓" : "Simpan"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
