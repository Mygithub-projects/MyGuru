"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDict } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

export function TukarUnitForm({
  pelajarId,
  unitSemasa,
}: {
  pelajarId: string;
  unitSemasa: { jenisKoko: string; namaUnitT6: string | null; statusPertukaran: string }[];
}) {
  const router = useRouter();
  const locale = useLocale();
  const dict = getDict(locale);
  const t = dict.pelajar;
  const common = dict.common;
  const [jenisKoko, setJenisKoko] = useState("Sukan");
  const [unitBaru, setUnitBaru] = useState("");
  const [sebab, setSebab] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const pilihan = unitSemasa.find((u) => u.jenisKoko === jenisKoko);
  const adaPending = unitSemasa.some((u) => u.statusPertukaran === "Pending");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/pelajar/${pelajarId}/tukar-unit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisKoko, unitBaru, sebab }),
      });
      const json = await res.json();
      setMsg({ text: json.message, ok: json.success });
      if (json.success) {
        setUnitBaru("");
        setSebab("");
        router.refresh();
      }
    } catch {
      setMsg({ text: t.transferNetworkError ?? t.activityForm.networkError, ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
        {t.transferFormTitle}
      </h2>

      {msg && (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{t.transferTypeLabel}</label>
        <select
          value={jenisKoko}
          onChange={(e) => setJenisKoko(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="Sukan">{common.sukan}</option>
          <option value="Kelab">{common.kelab}</option>
          <option value="Uniform">{common.uniform}</option>
          <option value="Perkhidmatan">{common.perkhidmatan}</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">
          {t.transferCurrentUnit} <strong>{pilihan?.namaUnitT6 ?? t.transferUnitNotRegistered}</strong>
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{t.transferNewUnitLabel}</label>
        <input
          value={unitBaru}
          onChange={(e) => setUnitBaru(e.target.value)}
          placeholder={t.transferExample}
          required
          minLength={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{t.transferReasonLabel}</label>
        <textarea
          value={sebab}
          onChange={(e) => setSebab(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={busy || adaPending}
        className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
      >
        {adaPending ? t.transferPending : busy ? t.activityForm.loading : t.transferSubmit}
      </button>
      {adaPending && (
        <p className="text-center text-xs text-amber-600">
          {t.transferPendingNotice}
        </p>
      )}
    </form>
  );
}
