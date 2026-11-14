"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDict, type Locale } from "@/lib/i18n";
import { type Role } from "@/lib/enums";

// Susunan tab seperti diminta: Pentadbir → Guru → Pelajar.
const ROLE_TABS: readonly Role[] = ["Admin", "Guru", "Pelajar"];


export function LoginForm({ locale = "ms" }: { locale?: Locale }) {
  const t = getDict(locale).login;
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<Role>("Pelajar");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Label/petunjuk medan pengenalan berbeza ikut peranan yang dipilih.
  const perRole: Record<Role, { label: string; nama: string; placeholder: string; hint: string }> = {
    Pelajar: { label: t.identifierPelajar, nama: t.rolePelajar, placeholder: t.placeholderPelajar, hint: t.hintPelajar },
    Guru: { label: t.identifierGuru, nama: t.roleGuru, placeholder: t.placeholderGuru, hint: t.hintGuru },
    Admin: { label: t.identifierAdmin, nama: t.roleAdmin, placeholder: t.placeholderAdmin, hint: t.hintAdmin },
  };
  const semasa = perRole[role];

  function pilihRole(r: Role) {
    if (r === role) return;
    setRole(r);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, role }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || t.failed);
        return;
      }
      const dari = params.get("dari");
      router.replace(dari || json.data.redirect || "/");
      router.refresh();
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 sm:text-3xl">{t.heading}</h2>
        <p className="mt-1 text-sm text-slate-500">{t.welcome}</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">{t.roleLabel}</label>
        <div
          className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1.5 ring-1 ring-slate-200"
          role="group"
          aria-label={t.roleLabel}
        >
          {ROLE_TABS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => pilihRole(r)}
              aria-pressed={role === r}
              className={`rounded-lg px-2 py-2.5 text-sm font-bold transition ${
                role === r
                  ? "bg-brand text-white shadow-md"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              {perRole[r].nama}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-slate-500">{semasa.hint}</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="identifier" className="mb-1.5 block text-sm font-semibold text-slate-700">
          {semasa.label}
        </label>
        <input
          id="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          placeholder={semasa.placeholder}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/20"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">{t.password}</label>
        <div className="relative">
          <input
            id="password"
            type={lihat ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-300 py-3 pl-4 pr-12 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/20"
            required
          />
          <button
            type="button"
            onClick={() => setLihat((v) => !v)}
            aria-label={lihat ? t.hidePassword : t.showPassword}
            aria-pressed={lihat}
            title={lihat ? t.hidePassword : t.showPassword}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-brand focus:text-brand focus:outline-none"
          >
            {lihat ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-brand py-3.5 text-base font-bold text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-xl disabled:translate-y-0 disabled:opacity-60"
      >
        {loading ? t.submitting : t.submit}
      </button>
      <p className="text-center text-sm text-slate-500">{t.forgotPassword}</p>
    </form>
  );
}
