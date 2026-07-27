import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getT } from "@/lib/locale";

export default async function LoginPage() {
  const { locale, t } = await getT();
  const institusi = process.env.NEXT_PUBLIC_INSTITUSI || "KTE (Prauniversiti) Desa Mahkota";
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-ink via-ink-2 to-brand-dark px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-3 flex justify-end">
          <LanguageToggle locale={locale} />
        </div>
        <div className="mb-6 flex flex-col items-center text-white">
          <Image
            src="/logo-kpm.png"
            alt="Logo KPM"
            width={80}
            height={80}
            className="mb-3 rounded-2xl bg-white p-1.5 shadow-lg ring-2 ring-white/30"
          />
          <h1 className="text-2xl font-bold tracking-tight text-white">MyGuru AI</h1>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold">Active Hands, Brilliant Minds</p>
          <p className="mt-1 text-sm text-white/85">{t.login.subtitle}</p>
          <p className="mt-0.5 text-xs text-white/70">{institusi}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <Suspense fallback={<p className="text-sm text-slate-400">{t.login.loading}</p>}>
            <LoginForm locale={locale} />
          </Suspense>
        </div>
        <p className="mt-4 text-center text-xs text-white/70">{t.login.footer}</p>
      </div>
    </div>
  );
}
