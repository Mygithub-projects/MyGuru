"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { KuotaUnit, JenisDaftar } from "@/lib/had-unit";

interface Dict {
  formTitle: string; info: string; lockedTitle: string; lockedBody: string; full: string; closed: string;
  noLimit: string; registered: string; confirm: string; submit: string; submitting: string; networkError: string;
  selectPlaceholder: string;
}

// Borang pendaftaran SP/KP/BU sekali gus. Dikaburkan (tidak boleh diisi)
// apabila pelajar sudah berdaftar dalam ketiga-tiga bahagian.
export function DaftarUnitForm({
  pelajarId,
  kuota,
  berdaftar,
  label,
  t,
}: {
  pelajarId: string;
  kuota: KuotaUnit[];
  berdaftar: Partial<Record<JenisDaftar, string>>;
  label: Record<JenisDaftar, string>;
  t: Dict;
}) {
  const router = useRouter();
  const [pilihan, setPilihan] = useState<Partial<Record<JenisDaftar, string>>>({});
  const [sahkan, setSahkan] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const JENIS: JenisDaftar[] = ["Sukan", "Kelab", "Uniform"];
  const belum = JENIS.filter((j) => !berdaftar[j]);
  const dikunci = belum.length === 0;
  const lengkap = belum.every((j) => pilihan[j]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/pelajar/${pelajarId}/daftar-unit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pilihan),
      });
      const json = await res.json().catch(() => null);
      setMsg({ text: json?.message ?? t.networkError, ok: !!json?.success });
      if (json?.success) router.refresh();
    } catch {
      setMsg({ text: t.networkError, ok: false });
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:bg-slate-50";

  return (
    <section className="relative rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-600">{t.formTitle}</h2>
      <p className="mb-4 text-xs text-slate-500">{t.info}</p>

      {msg && (
        <div className={`mb-3 rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.text}
        </div>
      )}

      <form
        onSubmit={submit}
        inert={dikunci}
        className={`space-y-4 ${dikunci ? "pointer-events-none select-none opacity-40 blur-[1.5px]" : ""}`}
      >
        {JENIS.map((j) => {
          const unit = kuota.filter((k) => k.jenisKoko === j);
          return (
            <label key={j} className="block text-sm font-medium text-slate-700">
              {label[j]}
              {berdaftar[j] ? (
                <input value={`${berdaftar[j]} — ${t.registered}`} disabled className={`${input} mt-1`} />
              ) : (
                <select
                  value={pilihan[j] ?? ""}
                  onChange={(e) => setPilihan((p) => ({ ...p, [j]: e.target.value }))}
                  required
                  disabled={dikunci}
                  className={`${input} mt-1`}
                >
                  <option value="" disabled>{t.selectPlaceholder}</option>
                  {unit.map((u) => {
                    const penuh = u.had !== null && u.ahli >= u.had;
                    const status =
                      u.had === null ? t.noLimit : u.had === 0 ? t.closed : penuh ? t.full : `${u.ahli}/${u.had}`;
                    return (
                      <option key={u.namaUnit} value={u.namaUnit} disabled={penuh}>
                        {u.namaUnit} ({status})
                      </option>
                    );
                  })}
                </select>
              )}
            </label>
          );
        })}

        <label className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          <input type="checkbox" checked={sahkan} onChange={(e) => setSahkan(e.target.checked)} disabled={dikunci} className="mt-0.5 h-4 w-4 accent-brand" />
          <span>{t.confirm}</span>
        </label>

        <button
          type="submit"
          disabled={dikunci || busy || !sahkan || !lengkap}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? t.submitting : t.submit}
        </button>
      </form>

      {dikunci && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl">
          <div className="mx-6 rounded-lg bg-white/95 px-5 py-4 text-center shadow ring-1 ring-slate-200">
            <p className="font-semibold text-slate-800">🔒 {t.lockedTitle}</p>
            <p className="mt-1 text-xs text-slate-500">{t.lockedBody}</p>
          </div>
        </div>
      )}
    </section>
  );
}
