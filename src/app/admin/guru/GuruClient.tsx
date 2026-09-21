"use client";
import { useState, type ReactNode } from "react";

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
type UnitOptions = Record<"Sukan" | "Kelab" | "Uniform" | "Perkhidmatan", string[]>;
interface GuruDict {
  jawatanKoko: { guruPenasihat: string; penolongKetuaGP: string; ketuaGP: string; penolongSU: string; pemantauKUPP: string; penyelaras: string };
  kategori: { kelab: string; sukan: string; uniform: string; perkhidmatan: string };
  peranan: { penasihat: string; ketuaPenasihat: string; penolongKetuaGP: string };
  statusAktif: string; unitDiselia: string; noUnitAssigned: string; unitNamePlaceholder: string; addUnit: string;
  deleteConfirmTpl: string; deleteFailed: string; networkError: string;
  saved: string; save: string; deleteBtn: string; deleting: string;
}

const AVATAR_PALETTE = [
  "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700", "bg-rose-100 text-rose-700", "bg-cyan-100 text-cyan-700",
];
function avatarColor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}
function initials(nama: string) {
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function IconPlus() {
  return <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5"><path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" /></svg>;
}
function IconClose() {
  return <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M4.3 4.3a1 1 0 011.4 0L10 8.6l4.3-4.3a1 1 0 111.4 1.4L11.4 10l4.3 4.3a1 1 0 01-1.4 1.4L10 11.4l-4.3 4.3a1 1 0 01-1.4-1.4L8.6 10 4.3 5.7a1 1 0 010-1.4z" clipRule="evenodd" /></svg>;
}
function IconCheck() {
  return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z" clipRule="evenodd" /></svg>;
}
function IconKey() {
  return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M15.5 2a4.5 4.5 0 00-4.42 5.34L2 16.4V19h2.6l1-1h1.9v-1.9h1.9l1.32-1.32A4.5 4.5 0 1015.5 2zm1 3a1 1 0 110 2 1 1 0 010-2z" /></svg>;
}
function IconTrash() {
  return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M8 2a1 1 0 00-1 1v1H4a1 1 0 100 2h.5l.7 10.1A2 2 0 007.2 18h5.6a2 2 0 002-1.9L15.5 6h.5a1 1 0 100-2h-3V3a1 1 0 00-1-1H8zm-.5 6a.75.75 0 011.5 0v6a.75.75 0 01-1.5 0V8zm4 0a.75.75 0 011.5 0v6a.75.75 0 01-1.5 0V8z" clipRule="evenodd" /></svg>;
}
function IconSave() {
  return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V6.41a1 1 0 00-.29-.7l-2.42-2.42A1 1 0 0013.59 3H4zm1 2h7v3H6V5H5zm9.5 10.5H5V11h9.5v4.5zM12 5.5a.5.5 0 01.5-.5H14v2.5a.5.5 0 01-.5.5H12v-2.5z" /></svg>;
}
function IconSpinner() {
  return <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 animate-spin"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="35 100" /></svg>;
}

function IconBtn({ onClick, disabled, title, tone, children }: { onClick: () => void; disabled?: boolean; title: string; tone: "brand" | "amber" | "red"; children: ReactNode }) {
  const tones = {
    brand: "bg-brand-light text-brand-dark ring-brand/20 hover:bg-brand hover:text-white",
    amber: "bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-500 hover:text-white",
    red: "bg-red-50 text-red-600 ring-red-200 hover:bg-red-600 hover:text-white",
  };
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ring-1 transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}>
      {children}
    </button>
  );
}

export function GuruClient({ guru: initial, unitOptions, t }: { guru: G[]; unitOptions: UnitOptions; t: GuruDict }) {
  const JAWATAN = [
    { v: "GuruPenasihat", l: t.jawatanKoko.guruPenasihat },
    { v: "PenolongSU", l: t.jawatanKoko.penolongSU },
    { v: "PemantauKUPP", l: t.jawatanKoko.pemantauKUPP },
    { v: "Penyelaras", l: t.jawatanKoko.penyelaras },
  ];
  const JENIS = [
    { v: "Kelab", l: t.kategori.kelab }, { v: "Sukan", l: t.kategori.sukan }, { v: "Uniform", l: t.kategori.uniform },
    { v: "Perkhidmatan", l: t.kategori.perkhidmatan },
  ];
  const PERANAN = [
    { v: "Penasihat", l: t.peranan.penasihat },
    { v: "KetuaPenasihat", l: t.peranan.ketuaPenasihat },
    { v: "PenolongKetuaGP", l: t.peranan.penolongKetuaGP },
  ];
  const [rows, setRows] = useState<G[]>(initial);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  function pilihanUnit(jenis: string, semasa: string): string[] {
    const asas = unitOptions[jenis as keyof UnitOptions] ?? [];
    return semasa && !asas.includes(semasa) ? [semasa, ...asas] : asas;
  }

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
  function updUnitJenis(id: string, i: number, value: string) {
    setRows((r) =>
      r.map((g) =>
        g.id === id
          ? { ...g, penasihatKelab: g.penasihatKelab.map((u, j) => (j === i ? { ...u, jenisKoko: value, namaUnit: "" } : u)) }
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
    setSavingIds((s) => new Set(s).add(g.id));
    setSavedIds((s) => { const n = new Set(s); n.delete(g.id); return n; });
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
      if (res.ok) {
        setLastSavedAt(new Date());
        setSavedIds((s) => new Set(s).add(g.id));
        setTimeout(() => setSavedIds((s) => { const n = new Set(s); n.delete(g.id); return n; }), 1500);
      }
      return res.ok;
    } finally {
      setSavingIds((s) => { const n = new Set(s); n.delete(g.id); return n; });
    }
  }

  async function simpanSemua() {
    setSavingAll(true);
    try {
      await Promise.all(rows.map((g) => simpan(g)));
    } finally {
      setSavingAll(false);
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

  const sel = "rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700">Senarai Guru</p>
          <p className="text-xs text-slate-400">
            {lastSavedAt
              ? `Terakhir disimpan: ${lastSavedAt.toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" })}, ${lastSavedAt.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" })}`
              : "Belum disimpan lagi"}
          </p>
        </div>
        <button onClick={simpanSemua} disabled={savingAll}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">
          {savingAll ? <IconSpinner /> : <IconSave />}
          {savingAll ? "Menyimpan…" : "Simpan Semua"}
        </button>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Guru</th>
            <th className="px-4 py-3">Jawatan Koko</th>
            <th className="px-4 py-3">{t.statusAktif}</th>
            <th className="px-4 py-3">{t.unitDiselia}</th>
            <th className="px-4 py-3 text-right">Tindakan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((g) => (
            <tr key={g.id} className="align-top transition-colors hover:bg-slate-50/70">
              <td className="min-w-[12rem] px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(g.id)}`}>
                    {initials(g.nama)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{g.nama}</p>
                    <p className="truncate text-xs text-slate-400">{g.email}</p>
                  </div>
                </div>
              </td>
              <td className="min-w-[10rem] px-4 py-3">
                <select value={g.jawatanKoko} onChange={(e) => upd(g.id, "jawatanKoko", e.target.value)} className={`${sel} w-full`}>
                  {JAWATAN.map((j) => <option key={j.v} value={j.v}>{j.l}</option>)}
                </select>
              </td>
              <td className="px-4 py-3">
                <label className="inline-flex cursor-pointer select-none items-center gap-2">
                  <span className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-slate-300 transition-colors has-[:checked]:bg-emerald-500">
                    <input type="checkbox" checked={g.statusAktif} onChange={(e) => upd(g.id, "statusAktif", e.target.checked)} className="peer sr-only" />
                    <span className="ml-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
                  </span>
                  <span className="whitespace-nowrap text-xs font-medium text-slate-600">{g.statusAktif ? t.statusAktif : "Tidak Aktif"}</span>
                </label>
              </td>
              <td className="min-w-[30rem] px-4 py-3">
                {g.penasihatKelab.length === 0 && (
                  <p className="mb-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-400">{t.noUnitAssigned}</p>
                )}
                <div className="space-y-1.5">
                  {g.penasihatKelab.map((u, i) => (
                    <div key={i} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/60 p-1.5">
                      <select value={u.jenisKoko} onChange={(e) => updUnitJenis(g.id, i, e.target.value)} className={`${sel} w-24 shrink-0 text-xs`}>
                        {JENIS.map((j) => <option key={j.v} value={j.v}>{j.l}</option>)}
                      </select>
                      <select value={u.namaUnit} onChange={(e) => updUnit(g.id, i, "namaUnit", e.target.value)} className={`${sel} min-w-0 flex-1 text-xs`}>
                        {!u.namaUnit && <option value="">{t.unitNamePlaceholder}</option>}
                        {pilihanUnit(u.jenisKoko, u.namaUnit).map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <select value={u.peranan} onChange={(e) => updUnit(g.id, i, "peranan", e.target.value)} className={`${sel} w-28 shrink-0 text-xs`}>
                        {PERANAN.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
                      </select>
                      <button onClick={() => buangUnit(g.id, i)} title="Buang unit ini"
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200 transition hover:bg-red-500 hover:text-white hover:ring-red-500">
                        <IconClose />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => tambahUnit(g.id)}
                  className="mt-2 inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-brand hover:bg-brand-light hover:text-brand-dark">
                  <IconPlus />{t.addUnit}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1.5">
                  <IconBtn onClick={() => simpan(g)} disabled={savingIds.has(g.id)} title={t.save} tone="brand">
                    {savingIds.has(g.id) ? <IconSpinner /> : savedIds.has(g.id) ? <IconCheck /> : <IconSave />}
                  </IconBtn>
                  <IconBtn onClick={() => resetKataLaluan(g)} disabled={resettingId === g.id} title="Reset kata laluan kepada No. IC" tone="amber">
                    <IconKey />
                  </IconBtn>
                  <IconBtn onClick={() => padam(g)} disabled={deletingId === g.id} title={t.deleteBtn} tone="red">
                    <IconTrash />
                  </IconBtn>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
