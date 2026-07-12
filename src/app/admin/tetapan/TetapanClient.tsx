"use client";
import { useState } from "react";

interface Item { id: string; kategori: string; namaItem: string; nilaiMarkah: number; }

export function TetapanClient({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const kategori = [...new Set(items.map((i) => i.kategori))];

  function setNilai(id: string, nilai: number) {
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, nilaiMarkah: nilai } : i)));
  }

  async function simpan() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/tetapan/formula", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ id: i.id, nilaiMarkah: i.nilaiMarkah })) }),
      });
      const json = await res.json();
      setMsg({ text: json.message, ok: json.success });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.text}
        </div>
      )}
      {kategori.map((kat) => (
        <section key={kat} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{kat}</h2>
          <div className="space-y-2">
            {items.filter((i) => i.kategori === kat).map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                <span className="text-sm text-slate-700">{i.namaItem}</span>
                <input type="number" min={0} max={200} value={i.nilaiMarkah}
                  onChange={(e) => setNilai(i.id, Number(e.target.value))}
                  className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm" />
              </div>
            ))}
          </div>
        </section>
      ))}
      <button onClick={simpan} disabled={busy}
        className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
        {busy ? "Menyimpan..." : "Simpan Tetapan"}
      </button>
    </div>
  );
}
