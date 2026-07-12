"use client";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/** Penukar bahasa BM ⇄ EN. Simpan pilihan dalam cookie & muat semula (server components baca cookie). */
export function LanguageToggle({ locale }: { locale: Locale }) {
  const router = useRouter();

  function pilih(l: Locale) {
    if (l === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  const base = "px-1.5 py-0.5 text-[11px] font-bold rounded transition";
  return (
    <div
      className="flex items-center overflow-hidden rounded-md bg-white/10 ring-1 ring-white/20"
      role="group"
      aria-label="Bahasa / Language"
    >
      <button
        type="button"
        onClick={() => pilih("ms")}
        className={`${base} ${locale === "ms" ? "bg-white text-ink" : "text-white/80 hover:text-white"}`}
        aria-pressed={locale === "ms"}
      >
        BM
      </button>
      <button
        type="button"
        onClick={() => pilih("en")}
        className={`${base} ${locale === "en" ? "bg-white text-ink" : "text-white/80 hover:text-white"}`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
