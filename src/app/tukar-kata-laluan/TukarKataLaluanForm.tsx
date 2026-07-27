"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface TukarKataLaluanDict {
  currentPassword: string; newPassword: string; confirmPassword: string;
  submit: string; submitting: string; mismatchError: string; networkError: string;
}

export function TukarKataLaluanForm({ t }: { t: TukarKataLaluanDict }) {
  const router = useRouter();
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [ulang, setUlang] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (baru !== ulang) { setError(t.mismatchError); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/tukar-kata-laluan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lama, baru }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.message); return; }
      router.replace(json.data.redirect || "/");
      router.refresh();
    } catch {
      setError(t.networkError);
    } finally {
      setBusy(false);
    }
  }

  const cls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</div>}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{t.currentPassword}</label>
        <input type="password" value={lama} onChange={(e) => setLama(e.target.value)} className={cls} required autoComplete="current-password" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{t.newPassword}</label>
        <input type="password" value={baru} onChange={(e) => setBaru(e.target.value)} className={cls} required minLength={6} autoComplete="new-password" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{t.confirmPassword}</label>
        <input type="password" value={ulang} onChange={(e) => setUlang(e.target.value)} className={cls} required minLength={6} autoComplete="new-password" />
      </div>
      <button type="submit" disabled={busy} className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60">
        {busy ? t.submitting : t.submit}
      </button>
    </form>
  );
}
