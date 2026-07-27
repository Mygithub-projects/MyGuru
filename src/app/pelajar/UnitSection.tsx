"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/components/StatusBadge";
import { statusPilihanT6, labelStatusPilihanT6 } from "@/lib/pajsk";
import { getDict } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

interface U {
  jenisKoko: string;
  namaUnitT5: string | null;
  namaUnitT6: string | null;
  jawatanT6: string | null;
  peringkatT6: string | null;
  statusPertukaran: string;
}

const KATEGORI = [
  { v: "Sukan" },
  { v: "Kelab" },
  { v: "Uniform" },
  { v: "Perkhidmatan" },
];

type Senarai = Record<string, string[]>;

export function UnitSection({ pelajarId, senarai, units }: { pelajarId: string; senarai: Senarai; units: U[] }) {
  const router = useRouter();
  const locale = useLocale();
  const dict = getDict(locale);
  const t = dict.pelajar;
  const common = dict.common;
  const [openJenis, setOpenJenis] = useState<string | null>(null);
  const [pilihan, setPilihan] = useState(""); // unit dipilih dari dropdown
  const [sebab, setSebab] = useState("");
  const [sahkan, setSahkan] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const unitBaru = pilihan;
  const opsyen = openJenis ? senarai[openJenis] ?? [] : [];

  // Gabung 4 kategori tetap dengan baris sedia ada
  const LABEL_JENIS: Record<string, string> = {
    Sukan: common.sukan, Kelab: common.kelab, Uniform: common.uniform, Perkhidmatan: common.perkhidmatan,
  };
  const kategori = KATEGORI.map((k) => ({
    ...k,
    label: LABEL_JENIS[k.v] ?? k.v,
    unit: units.find((u) => u.jenisKoko === k.v) ?? null,
  }));

  const semasa = openJenis ? units.find((u) => u.jenisKoko === openJenis) ?? null : null;
  const mode = semasa?.namaUnitT6 ? "Pertukaran" : "Pendaftaran";
  const modalTitle = mode === "Pendaftaran" ? t.unitDialogTitleRegister : t.unitDialogTitleChange;
  const pending = semasa?.statusPertukaran === "Pending";

  function buka(jenis: string) {
    setOpenJenis(jenis);
    setPilihan("");
    setSebab("");
    setSahkan(false);
    setMsg(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!openJenis) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/pelajar/${pelajarId}/tukar-unit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisKoko: openJenis, unitBaru, sebab }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg({ text: t.unitRequestSuccess, ok: true });
        setPilihan("");
        setSebab("");
        setSahkan(false);
        router.refresh();
      } else {
        setMsg({ text: json.message, ok: false });
      }
    } catch {
      setMsg({ text: t.activityForm.networkError, ok: false });
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";
  const bolehHantar = !busy && !pending && unitBaru.trim().length >= 2 && (mode === "Pendaftaran" || sahkan);

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">{t.unitSectionTitle}</h2>
        <Link href="/pelajar/tukar-unit" className="text-xs font-semibold text-brand-dark hover:underline">{t.unitHistoryLink}</Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kategori.map((k) => {
          const u = k.unit;
          const berdaftar = !!u?.namaUnitT6;
          return (
            <div key={k.v} className="flex flex-col rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase text-brand-dark">
                {k.label}{k.v === "Perkhidmatan" && <span className="ml-1 font-normal normal-case text-slate-400">({common.pilihan})</span>}
              </p>
              <p className="mt-1 font-medium text-slate-800">{u?.namaUnitT6 ?? t.unitNotRegistered}</p>
              {berdaftar && <p className="text-xs text-slate-500">{u?.jawatanT6} · {u?.peringkatT6}</p>}
              <div className="mt-2 flex items-center justify-between gap-2">
                {(() => {
                  const kod = u ? statusPilihanT6(u) : "Belum Pilih";
                  return <StatusBadge status={kod} label={labelStatusPilihanT6(kod, locale)} />;
                })()}
                <button
                  onClick={() => buka(k.v)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold text-white ${berdaftar ? "bg-ink hover:bg-ink-2" : "bg-brand hover:bg-brand-hover"}`}
                >
                  {berdaftar ? t.unitChange : t.unitRegister}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={openJenis !== null} onClose={() => setOpenJenis(null)} title={modalTitle} closeLabel={dict.common.modalClose}>
        <form onSubmit={submit} className="space-y-4">
          {msg && (
            <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
              {msg.text}
            </div>
          )}

          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {t.unitCurrentUnitLabel} <strong>{semasa?.namaUnitT6 ?? t.unitNotRegistered}</strong>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {mode === "Pendaftaran" ? t.transferNewUnitLabel : t.transferNewUnitLabel}
            </label>
            {opsyen.length === 0 ? (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
                {t.unitNoAdvisorMessage}
              </p>
            ) : (
              <select value={pilihan} onChange={(e) => setPilihan(e.target.value)} required className={input} autoFocus>
                <option value="" disabled>{t.unitSelectPlaceholder}</option>
                {opsyen.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
            <p className="mt-1 text-[11px] text-slate-400">{t.unitNotes}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.unitReasonLabel}</label>
            <textarea value={sebab} onChange={(e) => setSebab(e.target.value)} rows={2} className={input} />
          </div>

          {mode === "Pertukaran" && (
            <label className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
              <input type="checkbox" checked={sahkan} onChange={(e) => setSahkan(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" />
              <span>{t.unitConfirmReplace.replace("{unit}", semasa?.namaUnitT6 ?? "")}</span>
            </label>
          )}

          <p className="text-xs text-slate-500">
            ℹ️ {t.unitApplyInfo}
          </p>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpenJenis(null)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">{t.unitCancel}</button>
            <button type="submit" disabled={!bolehHantar} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">
              {pending ? t.unitRequestPending : busy ? t.activityForm.loading : (mode === "Pendaftaran" ? t.unitRegister : t.unitChange)}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
