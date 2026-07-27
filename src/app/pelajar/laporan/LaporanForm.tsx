"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDict } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

interface Unit { jenisKoko: string; namaUnit: string; }
interface Projek { id: string; namaProjek: string; status: string; }
interface Sesi { id: string; namaUnit: string; bilPerjumpaan: number; }

export function LaporanForm({ units, projek, sesiList }: { units: Unit[]; projek: Projek[]; sesiList: Sesi[] }) {
  const router = useRouter();
  const locale = useLocale();
  const dict = getDict(locale);
  const t = dict.laporan;
  const common = dict.common;
  const unitLabel: Record<string, string> = {
    Sukan: common.sukan, Kelab: common.kelab, Uniform: common.uniform, Perkhidmatan: common.perkhidmatan,
  };
  const [tab, setTab] = useState<"mingguan" | "projek">("mingguan");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>, url: string, hantar: boolean) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    form.set("hantar", String(hantar));
    try {
      const res = await fetch(url, { method: "POST", body: form });
      const json = await res.json();
      setMsg({ text: json.message, ok: json.success });
      if (json.success) { (e.target as HTMLFormElement).reset(); router.refresh(); }
    } catch {
      setMsg({ text: t.networkError, ok: false });
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex gap-2">
        {(["mingguan", "projek"] as const).map((tabKey) => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === tabKey ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>
            {tabKey === "mingguan" ? t.tabWeekly : t.tabProject}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`mb-3 rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.text}
        </div>
      )}

      {tab === "mingguan" ? (
        <form onSubmit={(e) => submit(e, "/api/laporan/mingguan", true)} className="grid gap-3 sm:grid-cols-2">
          <select name="namaUnit" className={inputCls} required>
            {units.map((u, i) => <option key={i} value={u.namaUnit}>{unitLabel[u.jenisKoko] ?? u.jenisKoko}: {u.namaUnit}</option>)}
          </select>
          <input type="hidden" name="jenisKoko" value={units[0]?.jenisKoko ?? "Kelab"} />
          <input type="date" name="tarikh" className={inputCls} required />
          <input name="masa" placeholder={t.reportTimePlaceholder} className={inputCls} />
          <select name="sesiId" className={inputCls} defaultValue="">
            <option value="">{t.selectSessionOptional}</option>
            {sesiList.map((s) => <option key={s.id} value={s.id}>{s.namaUnit} · {t.sessionLabel} {s.bilPerjumpaan}</option>)}
          </select>
          <input name="lampiran" type="file" className={`${inputCls} file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1`} />
          <textarea name="aktiviti" placeholder={t.reportActivityPlaceholder} rows={3} className={`${inputCls} sm:col-span-2`} required />
          <div className="flex gap-2 sm:col-span-2">
            <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
              {busy ? t.loading : t.submitForReview}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={(e) => submit(e, "/api/laporan/projek", true)} className="grid gap-3 sm:grid-cols-2">
          <select name="projekId" className={inputCls} defaultValue="">
            <option value="">{t.newProjectOption}</option>
            {projek.map((p) => <option key={p.id} value={p.id}>{t.reportProjectOptionPrefix}{p.namaProjek}</option>)}
          </select>
          <input name="namaProjek" placeholder={t.projectNamePlaceholder} className={inputCls} />
          <div className="text-xs text-slate-500 sm:col-span-2">{t.reportUploadPrompt}</div>
          <label className="text-sm">{t.workPlanLabel}
            <input name="kertasKerja" type="file" className={`${inputCls} mt-1`} />
          </label>
          <label className="text-sm">{t.impactReportLabel}
            <input name="laporanImpak" type="file" className={`${inputCls} mt-1`} />
          </label>
          <select name="sesiId" className={inputCls} defaultValue="">
            <option value="">{t.selectSessionOptional}</option>
            {sesiList.map((s) => <option key={s.id} value={s.id}>{s.namaUnit} · {t.sessionLabel} {s.bilPerjumpaan}</option>)}
          </select>
          <input name="kewangan" placeholder={t.financialSummaryPlaceholder} className={inputCls} />
          <input name="kekuatan" placeholder={t.strengthPlaceholder} className={inputCls} />
          <textarea name="kelemahan" placeholder={t.weaknessPlaceholder} rows={2} className={`${inputCls} sm:col-span-2`} />
          <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 sm:col-span-2 sm:w-auto">
            {busy ? t.loading : t.submitForReview}
          </button>
        </form>
      )}
    </section>
  );
}
