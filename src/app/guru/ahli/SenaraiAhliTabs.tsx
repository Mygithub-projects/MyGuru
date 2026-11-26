"use client";
import { Fragment, useState } from "react";
import { JawatanAssign } from "./JawatanAssign";
import { PecahanMarkah } from "./PecahanMarkah";
import { labelJawatan, type Locale } from "@/lib/i18n";

interface Ahli {
  pelajarId: string;
  nama: string;
  kelas: string | null;
  jawatan: string | null;
  markahJawatan: number;
  subRole: string;
  markahPajskT6: number | null;
  gred: string | null;
  statusButiran: string;
  unitSU: string[];
}
interface Unit {
  namaUnit: string;
  jenisKoko: string;
  bolehSahkan: boolean;
  bolehUrus: boolean;
  ahli: Ahli[];
}
interface Labels {
  name: string;
  kelas: string;
  currentPos: string;
  mark: string;
  setPos: string;
  members: string;
}
interface TabsDict {
  tabsAriaLabel: string; marksComputed: string; marksNotYet: string; downloadForm: string;
  jawatanAssign: { placeholder: string; assignTitle: string; networkError: string };
  butiranPelajar: {
    colLabel: string; statusPending: string; statusApproved: string;
    confirmBtn: string; confirming: string; networkError: string; notAllowed: string;
  };
}

// Hanya Ketua GP/Penolong Ketua GP unit itu boleh mengesahkan butiran pelajar
// (Guru Penasihat biasa & skop sekolah lihat sahaja) — `unit.bolehSahkan` dikira
// di pelayan ikut PERANAN_BOLEH_SAHKAN_BUTIRAN.

function SahkanButiranCell({
  pelajarId,
  status,
  boleh,
  t,
}: {
  pelajarId: string;
  status: string;
  boleh: boolean;
  t: TabsDict["butiranPelajar"];
}) {
  const [state, setState] = useState(status);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (state === "Approved") {
    return <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">✓ {t.statusApproved}</span>;
  }
  if (!boleh) {
    return <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700" title={t.notAllowed}>{t.statusPending}</span>;
  }

  const sahkan = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/pelajar/${pelajarId}/sahkan-butiran`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message ?? t.networkError);
      setState("Approved");
    } catch {
      setErr(t.networkError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={sahkan}
        disabled={busy}
        className="rounded-md bg-brand px-2 py-1 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {busy ? t.confirming : t.confirmBtn}
      </button>
      {err && <span className="text-xs text-red-500">{err}</span>}
    </div>
  );
}

// §5 — senarai pelajar dashboard guru: pilih Bahagian (KP/BU/SP/UP) dan Unit
// melalui dropdown, kemudian papar kiraan, status ringkas & jadual ahli unit itu.
export function SenaraiAhliTabs({
  units,
  labels,
  t,
  locale,
  unitLabel,
}: {
  units: Unit[];
  labels: Labels;
  t: TabsDict;
  jawatanKoko: string;
  locale: Locale;
  unitLabel?: Record<string, string>;
}) {
  // Bahagian: KP (Kelab/Persatuan), BU (Badan Beruniform), SP (Sukan/Permainan), UP (Unit Perkhidmatan).
  const BAHAGIAN: { jenis: string; kod: string }[] = [
    { jenis: "Kelab", kod: "KP" },
    { jenis: "Uniform", kod: "BU" },
    { jenis: "Sukan", kod: "SP" },
    { jenis: "Perkhidmatan", kod: "UP" },
  ];
  const adaBahagian = BAHAGIAN.filter((b) => units.some((u) => u.jenisKoko === b.jenis));
  const [bahagian, setBahagian] = useState<string>(adaBahagian[0]?.jenis ?? "");
  const dalamBahagian = units.filter((u) => u.jenisKoko === bahagian);
  const [namaAktif, setNamaAktif] = useState<string>(dalamBahagian[0]?.namaUnit ?? units[0]?.namaUnit ?? "");
  const unit = units.find((u) => u.namaUnit === namaAktif && u.jenisKoko === bahagian) ?? dalamBahagian[0] ?? units[0];
  const [pecahan, setPecahan] = useState<string | null>(null);
  if (!unit) return null;

  const lengkap = unit.ahli.filter((a) => (a.markahPajskT6 ?? 0) > 0).length;
  const belum = unit.ahli.length - lengkap;
  const labelBahagian = (jenis: string, kod: string) =>
    `${kod} — ${locale === "ms" ? jenis : unitLabel?.[jenis] ?? jenis}`;
  const selCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  return (
    <div className="space-y-4">
      {/* Pilih bahagian (KP/BU/SP/UP) → pilih unit dalam bahagian itu */}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]" aria-label={t.tabsAriaLabel}>
        <label className="text-xs font-semibold uppercase text-slate-500">
          {locale === "ms" ? "Bahagian" : "Section"}
          <select
            value={bahagian}
            onChange={(e) => {
              const j = e.target.value;
              setBahagian(j);
              setNamaAktif(units.find((u) => u.jenisKoko === j)?.namaUnit ?? "");
            }}
            className={`${selCls} mt-1`}
          >
            {adaBahagian.map((b) => (
              <option key={b.jenis} value={b.jenis}>
                {labelBahagian(b.jenis, b.kod)} ({units.filter((u) => u.jenisKoko === b.jenis).length})
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase text-slate-500">
          {locale === "ms" ? "Unit" : "Unit"}
          <select value={unit.namaUnit} onChange={(e) => setNamaAktif(e.target.value)} className={`${selCls} mt-1`}>
            {dalamBahagian.map((u) => (
              <option key={u.namaUnit} value={u.namaUnit}>
                {u.namaUnit} ({u.ahli.length})
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Status ringkas unit aktif */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-600">
          {unit.ahli.length} {labels.members}
        </span>
        <span className="rounded-md bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">
          ✓ {lengkap} {t.marksComputed}
        </span>
        {!unit.bolehUrus && (
          <span className="rounded-md bg-violet-100 px-2 py-1 font-semibold text-violet-700">
            👁 {locale === "ms" ? "Pemantau — lihat sahaja" : "Monitor — view only"}
          </span>
        )}
        {belum > 0 && (
          <span className="rounded-md bg-amber-100 px-2 py-1 font-semibold text-amber-700">
            ⏳ {belum} {t.marksNotYet}
          </span>
        )}
        <a
          href={`/api/borang-rumusan?unit=${encodeURIComponent(unit.namaUnit)}`}
          className="ml-auto rounded-md bg-ink px-3 py-1.5 font-semibold text-white hover:bg-ink-2"
        >
          {t.downloadForm}
        </a>
      </div>

      {/* Jadual ahli unit aktif */}
      <div className="overflow-x-auto rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <th className="py-2 pr-3">{labels.name}</th>
              <th className="py-2 pr-3">{labels.kelas}</th>
              <th className="py-2 pr-3">{labels.currentPos}</th>
              <th className="py-2 pr-3">{labels.mark}</th>
              <th className="py-2 pr-3">{t.butiranPelajar.colLabel}</th>
              <th className="py-2">{labels.setPos}</th>
            </tr>
          </thead>
          <tbody>
            {unit.ahli.map((a) => (
              <Fragment key={a.pelajarId}>
              <tr className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-3 font-medium text-slate-700">
                  {a.nama}
                  {a.subRole !== "Pelajar" && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                      {a.subRole}
                    </span>
                  )}
                  {a.unitSU.length > 0 && (
                    <span className="mt-0.5 block text-[11px] font-normal text-slate-500">
                      ({a.subRole} {a.unitSU.join(", ")})
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3 text-slate-600">{a.kelas ?? "-"}</td>
                <td className="py-2 pr-3 text-slate-600">{a.jawatan ? labelJawatan(a.jawatan, locale) : "-"}</td>
                <td className="py-2 pr-3 text-slate-600">
                  {a.markahJawatan}
                  {a.markahPajskT6 != null && (
                    <span className="ml-2 text-xs text-slate-400">
                      · {a.markahPajskT6}/100{a.gred ? ` (${a.gred})` : ""}
                    </span>
                  )}
                  <button
                    onClick={() => setPecahan(pecahan === a.pelajarId ? null : a.pelajarId)}
                    className="ml-2 text-xs font-semibold text-brand-dark hover:underline"
                    aria-expanded={pecahan === a.pelajarId}
                  >
                    {pecahan === a.pelajarId
                      ? locale === "en" ? "Hide" : "Tutup"
                      : locale === "en" ? "Breakdown" : "Pecahan"}
                  </button>
                </td>
                <td className="py-2 pr-3">
                  <SahkanButiranCell
                    pelajarId={a.pelajarId}
                    status={a.statusButiran}
                    boleh={unit.bolehSahkan}
                    t={t.butiranPelajar}
                  />
                </td>
                <td className="py-2">
                  {unit.bolehUrus ? (
                    <JawatanAssign pelajarId={a.pelajarId} jenisKoko={unit.jenisKoko} current={a.jawatan} t={t.jawatanAssign} locale={locale} />
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
              {pecahan === a.pelajarId && (
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <td colSpan={6} className="px-2 py-2">
                    <PecahanMarkah pelajarId={a.pelajarId} unitAktif={unit.namaUnit} en={locale === "en"} />
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
