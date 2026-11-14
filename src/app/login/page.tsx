import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getT } from "@/lib/locale";

export default async function LoginPage() {
  const { locale, t } = await getT();
  const institusi = process.env.NEXT_PUBLIC_INSTITUSI || "KTE (Prauniversiti) Desa Mahkota";
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-ink via-ink-2 to-brand-dark px-4 py-8 sm:py-12">
      {/* Hiasan latar */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.07)_1px,transparent_0)] [background-size:28px_28px]" />

      <div className="relative w-full max-w-5xl">
        <div className="mb-4 flex justify-end">
          <LanguageToggle locale={locale} />
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          {/* Panel jenama */}
          <div className="flex flex-col items-center text-center text-white lg:items-start lg:text-left">
            <Image
              src="/logo-kpm.png"
              alt="Logo KPM"
              width={112}
              height={112}
              priority
              className="mb-5 h-24 w-24 rounded-3xl bg-white p-2 shadow-2xl ring-4 ring-white/20 sm:h-28 sm:w-28"
            />
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">EzKokoT6</h1>
            <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-gold sm:text-base">Active Hands, Brilliant Minds</p>
            <p className="mt-4 text-lg font-medium text-white/90 sm:text-xl">{t.login.subtitle}</p>
            <p className="mt-1 text-sm text-white/70 sm:text-base">{institusi}</p>
            <ul className="mt-8 hidden space-y-3 lg:block">
              {t.login.highlights.map((h) => (
                <li key={h} className="flex items-center gap-3 text-base text-white/85">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/20 text-sm font-bold text-gold ring-1 ring-gold/40">✓</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {/* Kad log masuk */}
          <div className="mx-auto w-full max-w-lg">
            <div className="rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-white/10 sm:p-10">
              <Suspense fallback={<p className="text-sm text-slate-400">{t.login.loading}</p>}>
                <LoginForm locale={locale} />
              </Suspense>
            </div>
            <p className="mt-5 text-center text-sm text-white/70">{t.login.footer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
