"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Borang ringkas untuk pelajar memuat naik surat & sijil bagi rekod aktiviti
// luar yang dipilih oleh guru (Pending tanpa eviden lengkap).
export function EvidenUpload({
  pelajarId,
  aktivitiId,
  adaSurat,
  adaSijil,
}: {
  pelajarId: string;
  aktivitiId: string;
  adaSurat: boolean;
  adaSijil: boolean;
}) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [hantar, setHantar] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRalat(null);
    setHantar(true);
    try {
      const res = await fetch(`/api/pelajar/${pelajarId}/aktiviti-luar/${aktivitiId}`, {
        method: "PATCH",
        body: new FormData(e.currentTarget),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setRalat(json.message ?? "Ralat memuat naik.");
      } else {
        setBuka(false);
        router.refresh();
      }
    } catch {
      setRalat("Ralat rangkaian.");
    } finally {
      setHantar(false);
    }
  }

  if (!buka) {
    return (
      <button
        onClick={() => setBuka(true)}
        className="mt-2 inline-block rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200"
      >
        ⬆ Muat naik eviden (surat & sijil)
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3 text-xs">
      <label className="block">
        <span className="text-slate-500">Surat {adaSurat && "✓ (ada)"}</span>
        <input type="file" name="surat" className="mt-1 block w-full text-xs" />
      </label>
      <label className="block">
        <span className="text-slate-500">Sijil {adaSijil && "✓ (ada)"}</span>
        <input type="file" name="sijil" className="mt-1 block w-full text-xs" />
      </label>
      {ralat && <p className="text-rose-600">{ralat}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={hantar} className="rounded-md bg-blue-600 px-3 py-1 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {hantar ? "Memuat naik…" : "Simpan"}
        </button>
        <button type="button" onClick={() => setBuka(false)} className="rounded-md bg-slate-200 px-3 py-1 font-semibold text-slate-600 hover:bg-slate-300">
          Batal
        </button>
      </div>
    </form>
  );
}
