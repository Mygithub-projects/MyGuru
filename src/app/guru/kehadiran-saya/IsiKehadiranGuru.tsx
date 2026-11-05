"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Dict {
  present: string; absent: string; reasonPlaceholder: string; submit: string; resubmit: string;
  saving: string; notStarted: string; networkError: string;
}

/** Borang ringkas guru: Hadir / Tidak Hadir (+ sebab) untuk satu perjumpaan. */
export function IsiKehadiranGuru({
  sesiId, bolehIsi, rekod, t,
}: {
  sesiId: string;
  bolehIsi: boolean;
  rekod: { statusHadir: boolean; catatan: string | null } | null;
  t: Dict;
}) {
  const router = useRouter();
  const [hadir, setHadir] = useState<boolean>(rekod?.statusHadir ?? true);
  const [catatan, setCatatan] = useState(rekod?.catatan ?? "");
  const [busy, setBusy] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);

  if (!bolehIsi) {
    if (!rekod) return <span className="text-xs text-slate-400">{t.notStarted}</span>;
    return (
      <span className="text-xs">
        <span className={`font-semibold ${rekod.statusHadir ? "text-green-700" : "text-red-700"}`}>
          {rekod.statusHadir ? t.present : t.absent}
        </span>
        {rekod.catatan && <span className="block text-slate-500">{rekod.catatan}</span>}
      </span>
    );
  }

  async function hantar() {
    setBusy(true);
    setRalat(null);
    try {
      const res = await fetch("/api/guru/kehadiran-saya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesiId, statusHadir: hadir, catatan: catatan || null }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) setRalat(json?.message ?? t.networkError);
      else router.refresh();
    } catch {
      setRalat(t.networkError);
    } finally {
      setBusy(false);
    }
  }

  const pil = (aktif: boolean, warna: string) =>
    `rounded-md px-2.5 py-1 text-xs font-semibold ring-1 transition ${
      aktif ? `${warna} text-white ring-transparent` : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50"
    }`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" disabled={busy} onClick={() => setHadir(true)} className={pil(hadir, "bg-emerald-600")}>{t.present}</button>
        <button type="button" disabled={busy} onClick={() => setHadir(false)} className={pil(!hadir, "bg-rose-600")}>{t.absent}</button>
        <button
          type="button"
          disabled={busy || (!hadir && !catatan.trim())}
          onClick={hantar}
          className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {busy ? t.saving : rekod ? t.resubmit : t.submit}
        </button>
      </div>
      {!hadir && (
        <input
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          maxLength={500}
          placeholder={t.reasonPlaceholder}
          className="w-full max-w-xs rounded-md border border-slate-300 px-2 py-1 text-xs"
        />
      )}
      {ralat && <span className="text-xs text-rose-600">{ralat}</span>}
    </div>
  );
}
