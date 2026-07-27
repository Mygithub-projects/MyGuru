"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

/**
 * Togol susunan tarikh (§4): Terkini dahulu (default) ↔ Terlama dahulu.
 * Menyimpan pilihan dalam query param `?sort=` supaya kekal konsisten dengan
 * SSR & pagination (halaman server membaca param ini dan membalik orderBy).
 */
interface SortToggleDict { newest: string; oldest: string; ariaLabel: string }

export function SortToggle({ paramName = "sort", t }: { paramName?: string; t: SortToggleDict }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = sp.get(paramName) === "lama" ? "lama" : "baru";

  function set(v: "baru" | "lama") {
    const params = new URLSearchParams(sp.toString());
    if (v === "baru") params.delete(paramName);
    else params.set(paramName, v);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const base = "rounded-md px-3 py-1 text-xs font-semibold transition";
  const on = "bg-white text-brand-dark shadow-sm";
  const off = "text-slate-500 hover:text-slate-700";
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label={t.ariaLabel}>
      <button type="button" onClick={() => set("baru")} aria-pressed={current === "baru"} className={`${base} ${current === "baru" ? on : off}`}>
        {t.newest}
      </button>
      <button type="button" onClick={() => set("lama")} aria-pressed={current === "lama"} className={`${base} ${current === "lama" ? on : off}`}>
        {t.oldest}
      </button>
    </div>
  );
}
