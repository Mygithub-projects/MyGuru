"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface TukarKataLaluanDict {
  currentPassword: string; newPassword: string; confirmPassword: string;
  submit: string; submitting: string; mismatchError: string; networkError: string;
  showPassword: string; hidePassword: string;
}

const inputCls =
  "w-full rounded-lg border border-slate-300 py-2 pl-3 pr-11 text-sm outline-none focus:border-ez-flame focus:ring-2 focus:ring-ez-flame/30";

function MedanKataLaluan({
  id, label, value, onChange, autoComplete, minLength, showLabel, hideLabel,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  autoComplete: string; minLength?: number; showLabel: string; hideLabel: string;
}) {
  const [lihat, setLihat] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={lihat ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
          required
          minLength={minLength}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setLihat((v) => !v)}
          aria-label={lihat ? hideLabel : showLabel}
          aria-pressed={lihat}
          title={lihat ? hideLabel : showLabel}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-slate-400 transition hover:text-ez-red focus:text-ez-red focus:outline-none"
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
  );
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

  const eye = { showLabel: t.showPassword, hideLabel: t.hidePassword };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</div>}
      <MedanKataLaluan id="kl-lama" label={t.currentPassword} value={lama} onChange={setLama} autoComplete="current-password" {...eye} />
      <MedanKataLaluan id="kl-baru" label={t.newPassword} value={baru} onChange={setBaru} autoComplete="new-password" minLength={6} {...eye} />
      <MedanKataLaluan id="kl-ulang" label={t.confirmPassword} value={ulang} onChange={setUlang} autoComplete="new-password" minLength={6} {...eye} />
      <button type="submit" disabled={busy} className="w-full rounded-lg bg-ez-red py-2.5 text-sm font-semibold text-white hover:bg-ez-red-hover disabled:opacity-60">
        {busy ? t.submitting : t.submit}
      </button>
    </form>
  );
}
