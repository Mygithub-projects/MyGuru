import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getT } from "@/lib/locale";

const display = "font-[family-name:var(--font-display)]";

export default async function LoginPage() {
  const { locale, t } = await getT();
  const institusi = process.env.NEXT_PUBLIC_INSTITUSI || "KTE (Prauniversiti) Desa Mahkota";
  return (
    <div className="ez-bg relative flex flex-1 items-center justify-center overflow-hidden px-4 py-8 sm:py-12">
      {/* Jalur serong seperti blok perisai logo */}
      <div aria-hidden className="ez-slash -left-40 top-0 hidden h-full gap-3 lg:flex">
        <i className="w-28 bg-ez-red/80" />
        <i className="w-14 bg-ez-flame/70" />
        <i className="w-6 bg-ez-amber/60" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:26px_26px]" />

      <div className="relative w-full max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-ez-cream/70 transition hover:text-ez-cream">← Laman utama</Link>
          <LanguageToggle locale={locale} />
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          {/* Panel jenama */}
          <div className="flex flex-col items-center text-center text-ez-cream lg:items-start lg:pl-10 lg:text-left">
            <div className="relative mb-4">
              <div aria-hidden className="absolute inset-4 rounded-full bg-ez-flame/45 blur-3xl" />
              <Image
                src="/logo-ezkoko.webp"
                alt="Logo EzKoko KTEDM"
                width={260}
                height={277}
                priority
                className="relative h-36 w-auto drop-shadow-[0_16px_24px_rgba(0,0,0,0.55)] sm:h-44 lg:h-56"
              />
            </div>
            <h1 className={`${display} text-5xl font-extrabold uppercase italic leading-none sm:text-6xl`}>
              EzKoko<span className="ez-flame-text pr-1">T6</span>
            </h1>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-ez-amber sm:text-sm">Active Hands, Brilliant Minds</p>
            <p className="mt-4 text-lg font-medium text-ez-cream/90">{t.login.subtitle}</p>
            <p className="mt-0.5 text-sm text-ez-cream/60">{institusi}</p>
            <ul className="mt-7 hidden space-y-3 lg:block">
              {t.login.highlights.map((h) => (
                <li key={h} className="flex items-center gap-3 text-base text-ez-cream/85">
                  <span className="flex h-6 w-6 shrink-0 -skew-x-12 items-center justify-center rounded-sm bg-ez-red text-xs font-bold text-white">
                    <span className="skew-x-12">✓</span>
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {/* Kad log masuk */}
          <div className="mx-auto w-full max-w-lg">
            <div className="relative overflow-hidden rounded-2xl bg-ez-cream p-6 shadow-2xl ring-4 ring-black/40 sm:p-9">
              <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-ez-red via-ez-flame to-ez-amber" />
              <Suspense fallback={<p className="text-sm text-slate-400">{t.login.loading}</p>}>
                <LoginForm locale={locale} />
              </Suspense>
            </div>
            <p className="mt-5 text-center text-sm text-ez-cream/60">{t.login.footer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
