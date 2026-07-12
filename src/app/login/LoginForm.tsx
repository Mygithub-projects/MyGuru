"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDict, type Locale } from "@/lib/i18n";

export function LoginForm({ locale = "ms" }: { locale?: Locale }) {
  const t = getDict(locale).login;
  const router = useRouter();
  const params = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
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
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {t.identifier}
        </label>
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          placeholder="cth: 080917074685"
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
    </form>
  );
}
