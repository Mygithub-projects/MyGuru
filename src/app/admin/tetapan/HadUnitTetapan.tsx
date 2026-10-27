"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { KuotaUnit, JenisDaftar } from "@/lib/had-unit";

interface Dict {
  title: string; sub: string; kohort: string; show: string; unit: string; members: string; limit: string;
  save: string; saving: string; noLimit: string; networkError: string;
  current: string; next: string; other: string; copyFrom: string; copied: string;
}

// Had ahli setiap unit SP/KP/BU bagi satu kohort. Kosong = tiada had; 0 = ditutup.
export function HadUnitTetapan({
  kohort,
  tabKohort,
  semasa,
  seterusnya,
  salinDari,
  kuota,
  label,
  t,
}: {
  kohort: string;
  tabKohort: string[];
  semasa: string;
  seterusnya: string;
  /** Had kohort semasa — untuk diisi terus ke kohort lain (cth kohort seterusnya). */
  salinDari: { kohort: string; had: Record<string, number> } | null;
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

      {/* Tab kohort: semasa, kohort yang sudah ada had, dan kohort seterusnya (pengambilan pertengahan tahun) */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-600">{t.kohort}:</span>
        {tabKohort.map((k) => (
          <Link
            key={k}
            href={`/admin/tetapan?kohort=${encodeURIComponent(k)}`}
            scroll={false}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
              k === kohort ? "bg-brand text-white ring-brand" : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50"
            }`}
          >
            {k === seterusnya && k !== kohort ? "+ " : ""}{k}
            {k === semasa ? ` (${t.current})` : k === seterusnya ? ` (${t.next})` : ""}
          </Link>
        ))}
        <form method="get" className="flex items-center gap-1">
          <input name="kohort" placeholder={t.other} required pattern="(STPM|stpm) ?\d{4}|\d{4}" className={`${inp} w-32`} aria-label={t.other} />
          <button type="submit" className="rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold text-white hover:bg-ink-2">{t.show}</button>
        </form>
      </div>

      {salinDari && (
        <button
          type="button"
          onClick={() => {
            setNilai(Object.fromEntries(kuota.map((k) => [k.namaUnit, salinDari.had[k.namaUnit] === undefined ? "" : String(salinDari.had[k.namaUnit])])));
            setMsg({ text: t.copied, ok: true });
          }}
          className="mb-4 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        >
          {t.copyFrom} {salinDari.kohort}
        </button>
      )}

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
                          className="w-24 rounded border border-slate-300 px-2 py-1 text-right text-sm placeholder:text-xs"
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
