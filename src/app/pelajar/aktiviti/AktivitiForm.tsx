"use client";
import { useState } from "react";
import { getDict } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import type { CalonPelajar } from "@/components/CariPelajar";
import { AktivitiUnitForm } from "./AktivitiUnitForm";
import { AktivitiLuarForm } from "./AktivitiLuarForm";

interface Unit { jenisKoko: string; namaUnit: string; }

export function AktivitiForm({
  pelajarId,
  units,
  guru,
  su,
}: {
  pelajarId: string;
  units: Unit[];
  /** Senarai guru aktif — pilihan Guru Pengiring (Aktiviti Luar). */
  guru: { id: string; nama: string }[];
  /** SU/NSU sahaja: unit seliaan (bukan Perkhidmatan) & calon peserta. */
  su?: { units: Unit[]; calon: CalonPelajar[] };
}) {
  const locale = useLocale();
  const dict = getDict(locale);
  const t = dict.pelajar;
  const common = dict.common;
  const unitLabel: Record<string, string> = {
    Sukan: common.sukan, Kelab: common.kelab, Uniform: common.uniform, Perkhidmatan: common.perkhidmatan,
  };
  // Aktiviti kolej didaftar oleh SU/NSU melalui tab "Aktiviti Unit". Pelajar biasa
  // hanya ada tab Aktiviti Luar. Kedua-dua tab menjana OPR sebagai eviden.
  const [tab, setTab] = useState<"luar" | "unit">(su ? "unit" : "luar");
  const tabs = su ? (["unit", "luar"] as const) : (["luar"] as const);
  const labelTab = (k: string) =>
    k === "unit" ? (locale === "en" ? "Unit Activity (SU/NSU)" : "Aktiviti Unit (SU/NSU)") : t.activityTabs.externalActivities;

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex gap-2">
        {tabs.map((tabKey) => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === tabKey ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>
            {labelTab(tabKey)}
          </button>
        ))}
      </div>

      {tab === "unit" && su ? (
        <AktivitiUnitForm units={su.units} calon={su.calon} />
      ) : (
        <AktivitiLuarForm pelajarId={pelajarId} units={units} guru={guru} unitLabel={unitLabel} />
      )}
    </section>
  );
}
