"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDict } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { PERINGKAT } from "@/lib/enums";

interface Unit { jenisKoko: string; namaUnit: string; }
interface Sesi { id: string; namaUnit: string; bilPerjumpaan: number; }

// Nilai mesti sepadan dengan MARKAH_PROJEK_JAWATAN / markahProjekPeringkat (src/lib/pajsk.ts).
const JAWATAN_PROJEK = [
  "Pengurus Projek", "Pengerusi", "Timbalan Pengerusi", "Naib Pengerusi", "Setiausaha",
  "Bendahari", "Penolong Setiausaha", "Penolong Bendahari", "Ahli Jawatankuasa", "Ahli",
];

export function LaporanForm({ units, sesiList }: { units: Unit[]; sesiList: Sesi[] }) {
  const router = useRouter();
  const locale = useLocale();
  const dict = getDict(locale);
  const t = dict.laporan;
  const f = dict.pelajar.activityForm;
  const common = dict.common;
  const unitLabel: Record<string, string> = {
    Sukan: common.sukan, Kelab: common.kelab, Uniform: common.uniform, Perkhidmatan: common.perkhidmatan,
  };
  const [tab, setTab] = useState<"mingguan" | "projek">("mingguan");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>, url: string) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
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

      {/* Templat sama seperti borang aktiviti pelajar. Laporan Projek menambah
          Jawatan dalam projek (markah Projek — Jawatan). */}
      <form
        key={tab}
        onSubmit={(e) => submit(e, tab === "mingguan" ? "/api/laporan/mingguan" : "/api/laporan/projek")}
        className="grid gap-3 sm:grid-cols-2"
      >
        <label className="text-sm">{f.programName}
          <input name={tab === "mingguan" ? "namaProgram" : "namaProjek"} className={`${inputCls} mt-1`} required />
        </label>
        <label className="text-sm">{f.levelLabel}
          <select name={tab === "mingguan" ? "peringkat" : "peringkatProjek"} className={`${inputCls} mt-1`} required defaultValue="Sekolah">
            {PERINGKAT.map((p) => <option key={p} value={p}>{p === "Sekolah" ? f.collegeLevel : p}</option>)}
          </select>
        </label>
        <label className="text-sm">{f.dateLabel}
          <input type="date" name="tarikh" className={`${inputCls} mt-1`} required />
        </label>
        <label className="text-sm">{f.unitLabel}
          <select name="namaUnit" className={`${inputCls} mt-1`} required defaultValue="">
            <option value="" disabled>{f.unitPlaceholder}</option>
            {units.map((u, i) => <option key={i} value={u.namaUnit}>{unitLabel[u.jenisKoko] ?? u.jenisKoko}: {u.namaUnit}</option>)}
          </select>
        </label>
        {tab === "projek" && (
          <label className="text-sm">{t.positionLabel}
            <select name="jawatanProjek" className={`${inputCls} mt-1`} required defaultValue="">
              <option value="" disabled>{t.projectPositionPlaceholder}</option>
              {JAWATAN_PROJEK.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </label>
        )}
        <label className="text-sm">{t.sessionLinkLabel}
          <select name="sesiId" className={`${inputCls} mt-1`} defaultValue="">
            <option value="">{t.selectSessionOptional}</option>
            {sesiList.map((s) => <option key={s.id} value={s.id}>{s.namaUnit} · {t.sessionLabel} {s.bilPerjumpaan}</option>)}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">{f.reportLabel}
          <textarea name="laporan" rows={4} maxLength={4000} className={`${inputCls} mt-1`} required />
        </label>
        <label className="text-sm sm:col-span-2">{f.evidenceLabel}
          <input name="eviden" type="file" className={`${inputCls} mt-1`} required />
        </label>
        <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 sm:w-auto">
          {busy ? t.loading : t.submitForReview}
        </button>
      </form>
    </section>
  );
}
