"use client";
import { useMemo, useRef, useState } from "react";

export interface CalonPelajar { id: string; nama: string; kelas: string | null; }

const HAD_PAPAR = 60;

/**
 * Pilih pelajar: klik kotak untuk buka senarai (nama + kelas), taip untuk
 * menapis ikut nama atau kelas, klik nama untuk pilih.
 */
export function CariPelajar({
  pelajar,
  kecuali,
  onPilih,
  placeholder,
  tiadaPadanan,
}: {
  pelajar: CalonPelajar[];
  kecuali: Set<string>;
  onPilih: (p: CalonPelajar) => void;
  placeholder: string;
  tiadaPadanan: string;
}) {
  const [q, setQ] = useState("");
  const [buka, setBuka] = useState(false);
  const bekas = useRef<HTMLDivElement>(null);

  const padan = useMemo(() => {
    const k = q.trim().toLowerCase();
    return pelajar.filter((p) => !kecuali.has(p.id) && (!k || `${p.nama} ${p.kelas ?? ""}`.toLowerCase().includes(k)));
  }, [q, pelajar, kecuali]);
  const hasil = padan.slice(0, HAD_PAPAR);

  return (
    <div
      ref={bekas}
      className="relative"
      onBlur={(e) => { if (!bekas.current?.contains(e.relatedTarget as Node | null)) setBuka(false); }}
    >
      <input
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setBuka(true); }}
        onFocus={() => setBuka(true)}
        onClick={() => setBuka(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); if (hasil.length === 1) { onPilih(hasil[0]); setQ(""); } }
          if (e.key === "Escape") setBuka(false);
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {buka && (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200">
          {hasil.length === 0 ? (
            <li className="px-3 py-2 text-slate-400">{tiadaPadanan}</li>
          ) : hasil.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onPilih(p); setQ(""); setBuka(false); }}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-brand-light"
              >
                <span className="truncate text-slate-700">{p.nama}</span>
                <span className="shrink-0 text-xs text-slate-400">{p.kelas ?? "-"}</span>
              </button>
            </li>
          ))}
          {padan.length > HAD_PAPAR && (
            <li className="px-3 py-1.5 text-xs text-slate-400">+{padan.length - HAD_PAPAR} … taip nama/kelas untuk tapis</li>
          )}
        </ul>
      )}
    </div>
  );
}
