"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dict } from "@/lib/i18n";
import type { SenaraiUnit } from "@/lib/unit-list";
import { LABEL_PERANAN, PERANAN_PROJEK } from "@/lib/projek-jawatan";
import { CariPelajar, type CalonPelajar } from "./CariPelajar";
import { StatusBadge } from "./StatusBadge";

type T = Dict["laporan"]["projekUrus"];
interface Tag { pelajarId: string; nama: string; kelas: string | null; peranan: string; }
interface ProjekRow { id: string; nama: string; units: string[]; dibuatOleh: string | null; laporan: string[]; tag: Tag[]; }

const JENIS = ["Kelab", "Sukan", "Uniform", "Perkhidmatan"] as const;

async function hantar(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return (await res.json()) as { success: boolean; message: string };
}

function PilihUnit({ unit, seliaan, nilai, onChange }: {
  unit: SenaraiUnit; seliaan: string[] | null; nilai: string[]; onChange: (v: string[]) => void;
}) {
  const togol = (u: string) => onChange(nilai.includes(u) ? nilai.filter((x) => x !== u) : [...nilai, u]);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {JENIS.map((j) => (
        <fieldset key={j} className="rounded-lg border border-slate-200 p-2">
          <legend className="px-1 text-xs font-semibold text-slate-500">{j}</legend>
          <div className="max-h-48 space-y-0.5 overflow-auto">
            {unit[j].map((u) => (
              <label key={u} className="flex items-center gap-2 text-xs text-slate-700">
                <input type="checkbox" checked={nilai.includes(u)} onChange={() => togol(u)} />
                <span className={seliaan?.includes(u) ? "font-semibold text-brand-dark" : ""}>{u}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export function ProjekUrus({ projek, pelajar, unit, seliaan, t }: {
  projek: ProjekRow[]; pelajar: CalonPelajar[]; unit: SenaraiUnit; seliaan: string[] | null; t: T;
}) {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [units, setUnits] = useState<string[]>(seliaan?.length === 1 ? seliaan : []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function laksana(fn: () => Promise<{ success: boolean; message: string }>, selepas?: () => void) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fn();
      setMsg({ text: r.message, ok: r.success });
      if (r.success) { selepas?.(); router.refresh(); }
    } catch {
      setMsg({ text: t.networkError, ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>{msg.text}</div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); laksana(() => hantar("/api/projek", "POST", { nama, units }), () => { setNama(""); setUnits([]); }); }}
        className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
      >
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">{t.newTitle}</h2>
        <label className="block text-sm">{t.nameLabel}
          <input value={nama} onChange={(e) => setNama(e.target.value)} maxLength={200} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <div className="text-sm">
          {t.unitsLabel} ({units.length}){seliaan && <span className="ml-2 text-xs font-semibold text-brand-dark">■ {t.myUnits}</span>}
          <div className="mt-1"><PilihUnit unit={unit} seliaan={seliaan} nilai={units} onChange={setUnits} /></div>
        </div>
        <button disabled={busy || !nama.trim() || units.length === 0} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
          {busy ? t.creating : t.create}
        </button>
      </form>

      {projek.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">{t.empty}</p>
      ) : projek.map((p) => (
        <KadProjek key={`${p.id}:${p.tag.map((x) => x.pelajarId + x.peranan).join(",")}`} p={p} pelajar={pelajar} unit={unit} seliaan={seliaan} t={t} busy={busy} laksana={laksana} />
      ))}
    </div>
  );
}

function KadProjek({ p, pelajar, unit, seliaan, t, busy, laksana }: {
  p: ProjekRow; pelajar: CalonPelajar[]; unit: SenaraiUnit; seliaan: string[] | null; t: T; busy: boolean;
  laksana: (fn: () => Promise<{ success: boolean; message: string }>, selepas?: () => void) => Promise<void>;
}) {
  const [peranan, setPeranan] = useState<string>("Pengerusi");
  const [edit, setEdit] = useState(false);
  const [unitsEdit, setUnitsEdit] = useState(p.units);
  // Perubahan AJK disimpan setempat dahulu; dihantar sekali gus dengan butang "Simpan AJK".
  const [ajk, setAjk] = useState<Tag[]>(p.tag);
  const sig = (a: Tag[]) => a.map((x) => `${x.pelajarId}:${x.peranan}`).sort().join("|");
  const berubah = sig(ajk) !== sig(p.tag);
  const kecuali = new Set(ajk.map((x) => x.pelajarId));
  const kiraStatus = p.laporan.reduce<Record<string, number>>((m, s) => ({ ...m, [s]: (m[s] ?? 0) + 1 }), {});

  return (
    <article className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-800">{p.nama}</h2>
          {p.dibuatOleh && <p className="text-xs text-slate-400">{t.createdBy}: {p.dibuatOleh}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">{t.reports}: {p.laporan.length}</span>
          {Object.entries(kiraStatus).map(([s, n]) => <span key={s} className="inline-flex items-center gap-1"><StatusBadge status={s} />×{n}</span>)}
          {p.laporan.length === 0 && (
            <button type="button" disabled={busy}
              onClick={() => { if (confirm(t.confirmDelete)) laksana(() => hantar(`/api/projek/${p.id}`, "DELETE")); }}
              className="rounded-md px-2 py-1 font-semibold text-red-600 hover:bg-red-50">{t.deleteProject}</button>
          )}
        </div>
      </div>

      {edit ? (
        <div className="space-y-2">
          <PilihUnit unit={unit} seliaan={seliaan} nilai={unitsEdit} onChange={setUnitsEdit} />
          <div className="flex gap-2">
            <button type="button" disabled={busy || unitsEdit.length === 0}
              onClick={() => laksana(() => hantar(`/api/projek/${p.id}`, "PATCH", { nama: p.nama, units: unitsEdit }), () => setEdit(false))}
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{t.save}</button>
            <button type="button" onClick={() => { setEdit(false); setUnitsEdit(p.units); }}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{t.cancel}</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {p.units.map((u) => (
            <span key={u} className={`rounded-full px-2 py-0.5 text-xs ${seliaan?.includes(u) ? "bg-brand-light font-semibold text-brand-dark" : "bg-slate-100 text-slate-600"}`}>{u}</span>
          ))}
          <button type="button" onClick={() => setEdit(true)} className="text-xs font-semibold text-brand-dark hover:underline">{t.editUnits}</button>
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{t.tagTitle}</h3>
        <p className="mb-1 text-xs text-slate-400">{t.tagHint}</p>
        {ajk.length === 0 ? <p className="text-sm text-slate-400">{t.noTag}</p> : (
          <ul className="divide-y divide-slate-100 text-sm">
            {ajk.map((x) => (
              <li key={x.pelajarId} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                <span className="min-w-0 truncate text-slate-700">{x.nama} <span className="text-xs text-slate-400">({x.kelas ?? "-"})</span></span>
                <span className="flex items-center gap-2">
                  <select value={x.peranan} disabled={busy} aria-label={t.roleLabel}
                    onChange={(e) => { const v = e.target.value; setAjk((a) => a.map((y) => y.pelajarId === x.pelajarId ? { ...y, peranan: v } : y)); }}
                    className="rounded border border-slate-300 px-1.5 py-0.5 text-xs">
                    {PERANAN_PROJEK.map((r) => <option key={r} value={r}>{LABEL_PERANAN[r]}</option>)}
                  </select>
                  <button type="button" disabled={busy}
                    onClick={() => setAjk((a) => a.filter((y) => y.pelajarId !== x.pelajarId))}
                    className="text-xs font-semibold text-red-600 hover:underline">{t.remove}</button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex items-start gap-2">
          <select value={peranan} onChange={(e) => setPeranan(e.target.value)} aria-label={t.roleLabel}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            {PERANAN_PROJEK.map((r) => <option key={r} value={r}>{LABEL_PERANAN[r]}</option>)}
          </select>
          <div className="flex-1">
            <CariPelajar pelajar={pelajar} kecuali={kecuali} placeholder={`${t.addTag} ${LABEL_PERANAN[peranan]}: ${t.searchStudent}`} tiadaPadanan="—"
              onPilih={(s) => setAjk((a) => [...a, { pelajarId: s.id, nama: s.nama, kelas: s.kelas, peranan }])} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" disabled={busy || !berubah}
            onClick={() => laksana(() => hantar(`/api/projek/${p.id}/tag`, "PUT", { ajk: ajk.map((x) => ({ pelajarId: x.pelajarId, peranan: x.peranan })) }))}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
            {busy ? t.saving : t.saveAjk}
          </button>
          {berubah ? (
            <>
              <span className="text-xs font-semibold text-amber-600">● {t.unsaved}</span>
              <button type="button" disabled={busy} onClick={() => setAjk(p.tag)} className="text-xs text-slate-500 hover:underline">{t.cancel}</button>
            </>
          ) : p.tag.length > 0 && (
            <span className="text-xs font-semibold text-emerald-700">✓ {t.saved}</span>
          )}
        </div>
      </div>
    </article>
  );
}
