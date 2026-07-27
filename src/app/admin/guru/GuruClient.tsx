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
interface GuruDict {
  jawatanKoko: { guruPenasihat: string; penolongKetuaGP: string; ketuaGP: string; penolongSU: string; pemantauKUPP: string; penyelaras: string };
  kategori: { kelab: string; sukan: string; uniform: string; perkhidmatan: string };
  peranan: { penasihat: string; ketuaPenasihat: string };
  statusAktif: string; unitDiselia: string; noUnitAssigned: string; unitNamePlaceholder: string; addUnit: string;
  deleteConfirmTpl: string; deleteFailed: string; networkError: string;
  saved: string; save: string; deleteBtn: string; deleting: string;
}

export function GuruClient({ guru: initial, t }: { guru: G[]; t: GuruDict }) {
  const JAWATAN = [
    { v: "GuruPenasihat", l: t.jawatanKoko.guruPenasihat },
    { v: "PenolongKetuaGP", l: t.jawatanKoko.penolongKetuaGP },
    { v: "KetuaGP", l: t.jawatanKoko.ketuaGP },
    { v: "PenolongSU", l: t.jawatanKoko.penolongSU },
    { v: "PemantauKUPP", l: t.jawatanKoko.pemantauKUPP },
    { v: "Penyelaras", l: t.jawatanKoko.penyelaras },
  ];
  const JENIS = [
    { v: "Kelab", l: t.kategori.kelab }, { v: "Sukan", l: t.kategori.sukan }, { v: "Uniform", l: t.kategori.uniform },
    { v: "Perkhidmatan", l: t.kategori.perkhidmatan },
  ];
  const PERANAN = [{ v: "Penasihat", l: t.peranan.penasihat }, { v: "KetuaPenasihat", l: t.peranan.ketuaPenasihat }];
  const [rows, setRows] = useState<G[]>(initial);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

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
    if (!window.confirm(t.deleteConfirmTpl.replace("{nama}", g.nama))) {
      return;
    }
    setDeletingId(g.id);
    try {
      const res = await fetch(`/api/admin/guru/${g.id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((r) => r.filter((x) => x.id !== g.id));
      } else {
        const j = await res.json().catch(() => ({}));
        window.alert(j.message ?? t.deleteFailed);
      }
    } catch {
      window.alert(t.networkError);
    } finally {
      setDeletingId(null);
    }
  }

  async function resetKataLaluan(g: G) {
    if (!window.confirm(`Reset kata laluan "${g.nama}"?\n\nKata laluan akan ditetapkan semula kepada No. IC guru. Guru dipaksa menukar kata laluan semasa log masuk berikutnya.`)) {
      return;
    }
    setResettingId(g.id);
    try {
      const res = await fetch(`/api/admin/guru/${g.id}/reset-kata-laluan`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      window.alert(j.message ?? (res.ok ? "Kata laluan direset kepada No. IC." : "Gagal reset kata laluan."));
    } catch {
      window.alert(t.networkError);
    } finally {
      setResettingId(null);
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
              {t.statusAktif}
            </label>
          </div>

          <label className="block max-w-xs text-xs font-medium text-slate-600">Jawatan Koko
            <select value={g.jawatanKoko} onChange={(e) => upd(g.id, "jawatanKoko", e.target.value)} className={`${inp} mt-1`}>
              {JAWATAN.map((j) => <option key={j.v} value={j.v}>{j.l}</option>)}
            </select>
          </label>

          <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium text-slate-600">{t.unitDiselia}</p>
            {g.penasihatKelab.length === 0 && (
              <p className="mb-2 rounded-md bg-slate-50 px-2 py-1.5 text-xs text-slate-400">{t.noUnitAssigned}</p>
            )}
            <div className="space-y-2">
              {g.penasihatKelab.map((u, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select value={u.jenisKoko} onChange={(e) => updUnit(g.id, i, "jenisKoko", e.target.value)} className={`${inp} w-28`}>
                    {JENIS.map((j) => <option key={j.v} value={j.v}>{j.l}</option>)}
                  </select>
                  <input value={u.namaUnit} onChange={(e) => updUnit(g.id, i, "namaUnit", e.target.value)} placeholder={t.unitNamePlaceholder} className={`${inp} min-w-[12rem] flex-1`} />
                  <select value={u.peranan} onChange={(e) => updUnit(g.id, i, "peranan", e.target.value)} className={`${inp} w-40`}>
                    {PERANAN.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
                  </select>
                  <button onClick={() => buangUnit(g.id, i)} className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-600 hover:text-white">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => tambahUnit(g.id)} className="mt-2 rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">{t.addUnit}</button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => padam(g)} disabled={deletingId === g.id}
                className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-600 hover:text-white disabled:opacity-50">
                {deletingId === g.id ? t.deleting : t.deleteBtn}
              </button>
              <button onClick={() => resetKataLaluan(g)} disabled={resettingId === g.id}
                title="Reset kata laluan kepada No. IC"
                className="rounded-md bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-500 hover:text-white disabled:opacity-50">
                {resettingId === g.id ? "Menetapkan…" : "Reset KL"}
              </button>
            </div>
            <button onClick={() => simpan(g)} disabled={savingId === g.id}
              className="rounded-md bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
              {savingId === g.id ? "..." : savedId === g.id ? t.saved : t.save}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
