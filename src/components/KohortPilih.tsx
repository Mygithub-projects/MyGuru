"use client";
import { useRouter } from "next/navigation";

/** Pemilih kohort (Admin & Guru). Simpan dalam cookie & muat semula — semua halaman baca cookie ini. */
export function KohortPilih({
  kohort,
  senarai,
  label,
  labelArkib,
}: {
  kohort: string | null;
  senarai: { nama: string; status: string }[];
  label: string;
  labelArkib: string;
}) {
  const router = useRouter();
  if (senarai.length === 0) return null;

  function pilih(k: string) {
    document.cookie = `kohort=${encodeURIComponent(k)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <label className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
      <span className="hidden sm:inline">{label}</span>
      <select
        value={kohort ?? ""}
        onChange={(e) => pilih(e.target.value)}
        aria-label={label}
        className="rounded bg-white px-1.5 py-0.5 text-xs font-bold text-ink outline-none ring-1 ring-slate-200"
      >
        {senarai.map((k) => (
          <option key={k.nama} value={k.nama}>
            {k.nama}{k.status !== "Aktif" ? ` (${labelArkib})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
