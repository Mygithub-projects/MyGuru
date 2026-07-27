"use client";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/** Penukar bahasa BM ⇄ EN. Simpan pilihan dalam cookie & muat semula (server components baca cookie). */
export function LanguageToggle({ locale, onLight }: { locale: Locale; onLight?: boolean }) {
  const router = useRouter();

  function pilih(l: Locale) {
    if (l === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  const base = "px-2 py-1 text-[11px] font-bold rounded transition";
  const containerCls = onLight
    ? "flex items-center overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200"
    : "flex items-center overflow-hidden rounded-md bg-white/10 ring-1 ring-white/20";
  const selectedCls = onLight ? "bg-ink text-white" : "bg-white text-ink";
  const unselectedCls = onLight ? "text-slate-500 hover:text-slate-700" : "text-white/80 hover:text-white";

  return (
    <div className={containerCls} role="group" aria-label="Bahasa / Language">
      <button
        type="button"
        onClick={() => pilih("ms")}
        className={`${base} ${locale === "ms" ? selectedCls : unselectedCls}`}
        aria-pressed={locale === "ms"}
      >
        BM
      </button>
      <button
        type="button"
        onClick={() => pilih("en")}
        className={`${base} ${locale === "en" ? selectedCls : unselectedCls}`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
