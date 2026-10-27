"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { KuotaUnit, JenisDaftar } from "@/lib/had-unit";

interface Dict {
  title: string; sub: string; kohort: string; show: string; unit: string; members: string; limit: string;
  save: string; saving: string; noLimit: string; networkError: string;
}

// Had ahli setiap unit SP/KP/BU bagi satu kohort. Kosong = tiada had; 0 = ditutup.
export function HadUnitTetapan({
  kohort,
  kohortList,
  kuota,
  label,
  t,
}: {
  kohort: string;
  kohortList: string[];
  kuota: KuotaUnit[];
  label: Record<JenisDaftar, string>;
  t: Dict;
}) {
  const router = useRouter();
  const [nilai, setNilai] = useState<Record<string, string>>(
    Object.fromEntries(kuota.map((k) => [k.namaUnit, k.had === null ? "" : String(k.had)])),
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function simpan() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/had-unit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kohort,
          had: kuota.map((k) => {
            const v = nilai[k.namaUnit]?.trim();
            return { jenisKoko: k.jenisKoko, namaUnit: k.namaUnit, had: v ? Number(v) : null };
          }),
        }),
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

  const inp = "rounded-lg border border-slate-300 px-2 py-1.5 text-sm";
  const JENIS: JenisDaftar[] = ["Sukan", "Kelab", "Uniform"];

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">{t.title}</h2>
      <p className="mb-4 text-xs text-slate-500">{t.sub}</p>

      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <label className="text-xs font-medium text-slate-600">{t.kohort}
          <input name="kohort" list="had-kohort" defaultValue={kohort} required className={`${inp} mt-1 block w-40`} />
          <datalist id="had-kohort">
            {kohortList.map((k) => <option key={k} value={k} />)}
          </datalist>
        </label>
        <button type="submit" className="rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-ink-2">{t.show}</button>
      </form>

      <div className="grid gap-4 lg:grid-cols-3">
        {JENIS.map((j) => (
          <div key={j} className="rounded-lg border border-slate-200">
            <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-brand-dark">{label[j]}</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-slate-400">
                  <th className="px-3 py-1.5">{t.unit}</th>
                  <th className="px-2 py-1.5 text-right">{t.members}</th>
                  <th className="px-3 py-1.5 text-right">{t.limit}</th>
                </tr>
              </thead>
              <tbody>
                {kuota.filter((k) => k.jenisKoko === j).map((k) => {
                  const had = nilai[k.namaUnit] ? Number(nilai[k.namaUnit]) : null;
                  const penuh = had !== null && k.ahli >= had;
                  return (
                    <tr key={k.namaUnit} className="border-t border-slate-100">
                      <td className="px-3 py-1.5 text-slate-700">{k.namaUnit}</td>
                      <td className={`px-2 py-1.5 text-right ${penuh ? "font-semibold text-rose-600" : "text-slate-500"}`}>{k.ahli}</td>
                      <td className="px-3 py-1.5 text-right">
                        <input
                          type="number"
                          min={0}
                          max={1000}
                          value={nilai[k.namaUnit] ?? ""}
                          onChange={(e) => setNilai((v) => ({ ...v, [k.namaUnit]: e.target.value }))}
                          placeholder={t.noLimit}
                          aria-label={`${t.limit} ${k.namaUnit}`}
                          className="w-20 rounded border border-slate-300 px-2 py-1 text-right text-sm"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={simpan}
          disabled={busy}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {busy ? t.saving : `${t.save} — ${kohort}`}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-brand-dark" : "text-red-700"}`}>{msg.text}</span>}
      </div>
    </section>
  );
}
