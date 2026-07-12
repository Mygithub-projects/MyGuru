"use client";
import { useState } from "react";

interface Penugasan {
  namaUnit: string;
  jenisKoko: string;
  peranan: string;
}
interface G {
  id: string;
  nama: string;
  email: string | null;
  jawatanKoko: string;
  statusAktif: boolean;
  penasihatKelab: Penugasan[];
}

const JAWATAN: { v: string; l: string }[] = [
  { v: "GuruPenasihat", l: "Guru Penasihat" },
  { v: "PenolongKetuaGP", l: "Penolong Ketua GP" },
  { v: "KetuaGP", l: "Ketua Guru Penasihat" },
  { v: "PenolongSU", l: "Penolong SU Kokurikulum" },
  { v: "PemantauKUPP", l: "Pemantau (KUPP)" },
  { v: "Penyelaras", l: "Penyelaras Kokurikulum" },
];
const JENIS = ["Kelab", "Sukan", "Uniform"];
const PERANAN = ["Penasihat", "KetuaPenasihat"];

export function GuruClient({ guru: initial }: { guru: G[] }) {
  const [rows, setRows] = useState<G[]>(initial);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function upd(id: string, field: "jawatanKoko" | "statusAktif", value: string | boolean) {
    setRows((r) => r.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  }
  function updUnit(id: string, i: number, field: keyof Penugasan, value: string) {
    setRows((r) =>
      r.map((g) =>
        g.id === id
          ? { ...g, penasihatKelab: g.penasihatKelab.map((u, j) => (j === i ? { ...u, [field]: value } : u)) }
          : g
      )
    );
  }
  function tambahUnit(id: string) {
    setRows((r) =>
      r.map((g) =>
        g.id === id
          ? { ...g, penasihatKelab: [...g.penasihatKelab, { namaUnit: "", jenisKoko: "Kelab", peranan: "Penasihat" }] }
          : g
      )
    );
  }
  function buangUnit(id: string, i: number) {
    setRows((r) =>
      r.map((g) => (g.id === id ? { ...g, penasihatKelab: g.penasihatKelab.filter((_, j) => j !== i) } : g))
    );
  }

  async function simpan(g: G) {
    setSavingId(g.id);
    setSavedId(null);
    try {
      const res = await fetch(`/api/admin/guru/${g.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jawatanKoko: g.jawatanKoko,
          statusAktif: g.statusAktif,
          penasihatKelab: g.penasihatKelab.filter((u) => u.namaUnit.trim().length > 0),
        }),
      });
      if (res.ok) { setSavedId(g.id); setTimeout(() => setSavedId(null), 1500); }
    } finally {
      setSavingId(null);
    }
  }

  async function padam(g: G) {
    if (!window.confirm(`Padam guru "${g.nama}"?\n\nTindakan ini KEKAL dan akan memadam akaun log masuk guru serta penugasan unitnya. Tidak boleh dibatalkan.`)) {
      return;
    }
    setDeletingId(g.id);
    try {
      const res = await fetch(`/api/admin/guru/${g.id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((r) => r.filter((x) => x.id !== g.id));
      } else {
        const j = await res.json().catch(() => ({}));
        window.alert(j.message ?? "Gagal memadam guru.");
      }
    } catch {
      window.alert("Ralat rangkaian.");
    } finally {
      setDeletingId(null);
    }
  }

  const inp = "w-full rounded-md border border-slate-300 px-2 py-1 text-sm";

  return (
    <div className="space-y-3">
      {rows.map((g) => (
        <div key={g.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-800">{g.nama}</p>
              <p className="truncate text-xs text-slate-400">{g.email}</p>
            </div>
            <label className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
              <input type="checkbox" checked={g.statusAktif} onChange={(e) => upd(g.id, "statusAktif", e.target.checked)} className="h-4 w-4 accent-brand" />
              Aktif
            </label>
          </div>

          <label className="block max-w-xs text-xs font-medium text-slate-600">Jawatan Koko
            <select value={g.jawatanKoko} onChange={(e) => upd(g.id, "jawatanKoko", e.target.value)} className={`${inp} mt-1`}>
              {JAWATAN.map((j) => <option key={j.v} value={j.v}>{j.l}</option>)}
            </select>
          </label>

          <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium text-slate-600">Unit Diselia (Kelab / Sukan / Badan Beruniform)</p>
            {g.penasihatKelab.length === 0 && (
              <p className="mb-2 rounded-md bg-slate-50 px-2 py-1.5 text-xs text-slate-400">Tiada unit ditugaskan. Guru ini tidak dapat melihat/mengesahkan mana-mana pelajar.</p>
            )}
            <div className="space-y-2">
              {g.penasihatKelab.map((u, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select value={u.jenisKoko} onChange={(e) => updUnit(g.id, i, "jenisKoko", e.target.value)} className={`${inp} w-28`}>
                    {JENIS.map((j) => <option key={j} value={j}>{j}</option>)}
                  </select>
                  <input value={u.namaUnit} onChange={(e) => updUnit(g.id, i, "namaUnit", e.target.value)} placeholder="Nama unit (cth: Kelab Komputer)" className={`${inp} min-w-[12rem] flex-1`} />
                  <select value={u.peranan} onChange={(e) => updUnit(g.id, i, "peranan", e.target.value)} className={`${inp} w-40`}>
                    {PERANAN.map((p) => <option key={p} value={p}>{p === "KetuaPenasihat" ? "Ketua Penasihat" : "Penasihat"}</option>)}
                  </select>
                  <button onClick={() => buangUnit(g.id, i)} className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-600 hover:text-white">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => tambahUnit(g.id)} className="mt-2 rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">➕ Tambah unit</button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button onClick={() => padam(g)} disabled={deletingId === g.id}
              className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-600 hover:text-white disabled:opacity-50">
              {deletingId === g.id ? "Memadam…" : "Padam"}
            </button>
            <button onClick={() => simpan(g)} disabled={savingId === g.id}
              className="rounded-md bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
              {savingId === g.id ? "..." : savedId === g.id ? "✓ Disimpan" : "Simpan"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
