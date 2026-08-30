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
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800">{t.heading}</h2>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t.roleLabel}</label>
        <div
          className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 ring-1 ring-slate-200"
          role="group"
          aria-label={t.roleLabel}
        >
          {ROLE_TABS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => pilihRole(r)}
              aria-pressed={role === r}
              className={`rounded-md px-2 py-2 text-xs font-bold transition ${
                role === r
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              {perRole[r].nama}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">{semasa.hint}</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {semasa.label}
        </label>
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          placeholder={semasa.placeholder}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{t.password}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
      >
        {loading ? t.submitting : t.submit}
      </button>
      <p className="text-center text-xs text-slate-500">{t.forgotPassword}</p>
    </form>
  );
}
