"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface PelajarRingkas {
  id: string;
  nama: string;
  kelasT6: string | null;
  /** Unit pelajar ikut jenisKoko (Kelab/Uniform/Sukan/Perkhidmatan), sudah ditapis ikut skop guru. */
  unit: Record<string, string>;
}

// Empat bahagian PAJSK: KP, BU, SP, UP.
const BAHAGIAN = ["Kelab", "Uniform", "Sukan", "Perkhidmatan"] as const;
type Bahagian = (typeof BAHAGIAN)[number];
interface PemilihanDict {
  detailsTitle: string; competitionName: string; competitionNamePlaceholder: string;
  level: string; dateOptional: string;
  selectStudents: string; selectedSuffix: string; searchPlaceholder: string;
  selectAll: string; noMatch: string; submitBtnTpl: string; submittingBtn: string;
  footerNote: string; errNameRequired: string; errNoSelection: string; errGeneric: string; networkError: string;
  levels: { zonDaerah: string; daerah: string; negeri: string; kebangsaan: string; antarabangsa: string };
  bahagian: Record<Bahagian, string>;
  allUnits: string; noUnitInSection: string;
}

export function PemilihanForm({ pelajar, t }: { pelajar: PelajarRingkas[]; t: PemilihanDict }) {
  const router = useRouter();
  // Peringkat pertandingan (tanpa "Sekolah" — pemilihan ini untuk mewakili keluar).
  // Nilai (v) kekal BM — dihantar ke API; label (l) diterjemah untuk paparan.
  const PERINGKAT_PERTANDINGAN = [
    { v: "Zon/Daerah", l: t.levels.zonDaerah },
    { v: "Daerah", l: t.levels.daerah },
    { v: "Negeri", l: t.levels.negeri },
    { v: "Kebangsaan", l: t.levels.kebangsaan },
    { v: "Antarabangsa", l: t.levels.antarabangsa },
  ];
  const [namaAktiviti, setNamaAktiviti] = useState("");
  const [peringkat, setPeringkat] = useState<string>("Negeri");
  const [tarikh, setTarikh] = useState("");
  const [carian, setCarian] = useState("");
  const [bahagian, setBahagian] = useState<Bahagian>(
    () => BAHAGIAN.find((b) => pelajar.some((p) => p.unit[b])) ?? "Kelab"
  );
  const [unitPilih, setUnitPilih] = useState("");
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [hantar, setHantar] = useState(false);
  const [mesej, setMesej] = useState<{ ok: boolean; teks: string } | null>(null);

  const bilangan = useMemo(() => {
    const out = {} as Record<Bahagian, number>;
    for (const b of BAHAGIAN) out[b] = pelajar.filter((p) => p.unit[b]).length;
    return out;
  }, [pelajar]);

  const dalamBahagian = useMemo(() => pelajar.filter((p) => p.unit[bahagian]), [pelajar, bahagian]);
  const senaraiUnit = useMemo(
    () => [...new Set(dalamBahagian.map((p) => p.unit[bahagian]))].sort((a, b) => a.localeCompare(b)),
    [dalamBahagian, bahagian]
  );

  const ditapis = useMemo(() => {
    const q = carian.trim().toLowerCase();
    return dalamBahagian.filter(
      (p) =>
        (!unitPilih || p.unit[bahagian] === unitPilih) &&
        (!q ||
          p.nama.toLowerCase().includes(q) ||
          (p.kelasT6 ?? "").toLowerCase().includes(q) ||
          p.unit[bahagian].toLowerCase().includes(q))
    );
  }, [dalamBahagian, bahagian, unitPilih, carian]);

  function tukarBahagian(b: Bahagian) {
    setBahagian(b);
    setUnitPilih("");
  }

  function toggle(id: string) {
    setDipilih((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function pilihSemua() {
    setDipilih((prev) => {
      const next = new Set(prev);
      const semuaDipilih = ditapis.every((p) => next.has(p.id));
      if (semuaDipilih) ditapis.forEach((p) => next.delete(p.id));
      else ditapis.forEach((p) => next.add(p.id));
      return next;
    });
  }

  async function submit() {
    setMesej(null);
    if (namaAktiviti.trim().length < 2) {
      setMesej({ ok: false, teks: t.errNameRequired });
      return;
    }
    if (dipilih.size === 0) {
      setMesej({ ok: false, teks: t.errNoSelection });
      return;
    }
    setHantar(true);
    try {
      const res = await fetch("/api/guru/pemilihan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaAktiviti: namaAktiviti.trim(),
          peringkat,
          tarikh: tarikh || undefined,
          pelajarIds: [...dipilih],
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMesej({ ok: false, teks: json.message ?? t.errGeneric });
      } else {
        setMesej({ ok: true, teks: json.message });
        setDipilih(new Set());
        setNamaAktiviti("");
        setTarikh("");
        router.refresh();
      }
    } catch {
      setMesej({ ok: false, teks: t.networkError });
    } finally {
      setHantar(false);
    }
  }

  const semuaDitapisDipilih = ditapis.length > 0 && ditapis.every((p) => dipilih.has(p.id));

  return (
    <div className="space-y-5">
      {/* Butiran pertandingan */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{t.detailsTitle}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="sm:col-span-1 block">
            <span className="text-xs font-medium text-slate-500">{t.competitionName}</span>
            <input
              value={namaAktiviti}
              onChange={(e) => setNamaAktiviti(e.target.value)}
              placeholder={t.competitionNamePlaceholder}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">{t.level}</span>
            <select
              value={peringkat}
              onChange={(e) => setPeringkat(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {PERINGKAT_PERTANDINGAN.map((p) => (
                <option key={p.v} value={p.v}>{p.l}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">{t.dateOptional}</span>
            <input
              type="date"
              value={tarikh}
              onChange={(e) => setTarikh(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      {/* Senarai pelajar */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
            {t.selectStudents} <span className="text-slate-400">({dipilih.size} {t.selectedSuffix})</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={unitPilih}
              onChange={(e) => setUnitPilih(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value="">{t.allUnits}</option>
              {senaraiUnit.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <input
              value={carian}
              onChange={(e) => setCarian(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
        </div>

        {/* Tab bahagian KP / BU / SP / UP */}
        <div className="mb-3 flex flex-wrap gap-2">
          {BAHAGIAN.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => tukarBahagian(b)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                bahagian === b
                  ? "bg-blue-600 text-white ring-blue-600"
                  : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50"
              }`}
            >
              {t.bahagian[b]} <span className="opacity-70">({bilangan[b]})</span>
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <input type="checkbox" checked={semuaDitapisDipilih} onChange={pilihSemua} className="h-4 w-4" />
            <span className="font-semibold text-slate-600">{t.selectAll} ({ditapis.length})</span>
          </div>
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {ditapis.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50">
                  <input type="checkbox" checked={dipilih.has(p.id)} onChange={() => toggle(p.id)} className="h-4 w-4" />
                  <span className="font-medium text-slate-700">{p.nama}</span>
                  <span className="text-xs text-slate-400">{p.kelasT6 ?? "-"}</span>
                  <span className="ml-auto text-xs text-slate-500">{p.unit[bahagian]}</span>
                </label>
              </li>
            ))}
            {ditapis.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-slate-400">
                {dalamBahagian.length === 0 ? t.noUnitInSection : t.noMatch}
              </li>
            )}
          </ul>
        </div>
      </section>

      {mesej && (
        <p className={`rounded-md px-4 py-2 text-sm ${mesej.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {mesej.teks}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={hantar}
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {hantar ? t.submittingBtn : t.submitBtnTpl.replace("{n}", String(dipilih.size || ""))}
        </button>
        <span className="text-xs text-slate-400">
          {t.footerNote}
        </span>
      </div>
    </div>
  );
}
