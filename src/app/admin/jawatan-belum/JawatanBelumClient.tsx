"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { UnitBelum, GuruUnitRingkas } from "@/lib/jawatan-belum";
import type { Locale } from "@/lib/i18n";

type Isu = "semua" | "jawatan" | "sah" | "cadangan";

const LABEL_PERANAN: Record<string, string> = { KetuaPenasihat: "GKP", PenolongKetuaGP: "PGKP", Penasihat: "GP", Pemantau: "GPm" };

export function JawatanBelumClient({ units, locale }: { units: UnitBelum[]; locale: Locale }) {
  const L = (ms: string, en: string) => (locale === "en" ? en : ms);
  const router = useRouter();
  const [bahagian, setBahagian] = useState("");
  const [isu, setIsu] = useState<Isu>("jawatan");
  const [cari, setCari] = useState("");
  const [buka, setBuka] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const jenisAda = useMemo(() => [...new Set(units.map((u) => u.jenisKoko))].sort(), [units]);

  const tapis = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return units
      .filter((u) => !bahagian || u.jenisKoko === bahagian)
      .map((u) => {
        const pelajar = u.pelajar.filter(
          (p) =>
            (isu === "semua" ||
              (isu === "jawatan" && p.tiadaJawatan) ||
              (isu === "sah" && p.belumSah) ||
              (isu === "cadangan" && !!p.cadanganPending)) &&
            (!q ||
              p.nama.toLowerCase().includes(q) ||
              p.noIc.includes(q) ||
              u.namaUnit.toLowerCase().includes(q) ||
              [...u.gkp, ...u.penasihat].some((g) => g.nama.toLowerCase().includes(q))),
        );
        return { ...u, pelajar };
      })
      .filter((u) => u.pelajar.length > 0);
  }, [units, bahagian, isu, cari]);

  const jumlah = useMemo(
    () => ({
      jawatan: units.reduce((s, u) => s + u.bilTiadaJawatan, 0),
      sah: units.reduce((s, u) => s + u.bilBelumSah, 0),
      cadangan: units.reduce((s, u) => s + u.bilCadangan, 0),
      tanpaGkp: units.filter((u) => u.gkp.length === 0).length,
    }),
    [units],
  );

  async function maklum(namaUnit: string[] | null, kunci: string) {
    const bil = namaUnit?.length ?? units.length;
    if (!confirm(L(`Hantar peringatan kepada GKP/PGKP bagi ${bil} unit?`, `Send reminder to Head/Asst. Head Advisors of ${bil} unit(s)?`))) return;
    setBusy(kunci);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/jawatan-belum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(namaUnit ? { namaUnit } : {}),
      });
      const json = await res.json().catch(() => null);
      setMsg({ text: json?.message ?? L("Ralat rangkaian", "Network error"), ok: !!json?.success });
      if (json?.success) router.refresh();
    } catch {
      setMsg({ text: L("Ralat rangkaian", "Network error"), ok: false });
    } finally {
      setBusy(null);
    }
  }

  async function salin(u: UnitBelum) {
    const penerima = u.gkp.length ? u.gkp : u.penasihat;
    const teks = [
      `Assalamualaikum ${penerima.map((g) => g.nama).join(" / ") || "Cikgu"},`,
      ``,
      `Mohon tindakan bagi unit *${u.namaUnit}* (${u.jenisKoko}) dalam EzKokoT6:`,
      ...u.pelajar.map((p, i) => {
        const isuP = [
          p.tiadaJawatan && "jawatan belum ditetapkan",
          p.belumSah && "butiran belum disahkan",
          p.cadanganPending && `cadangan "${p.cadanganPending}" menunggu`,
        ].filter(Boolean).join("; ");
        return `${i + 1}. ${p.nama}${p.kelasT6 ? ` (${p.kelasT6})` : ""} — ${isuP}`;
      }),
      ``,
      `Sila kemaskini di menu Senarai Ahli. Terima kasih.`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(teks);
      setMsg({ text: L(`Mesej untuk ${u.namaUnit} disalin — tampal ke WhatsApp/e-mel.`, `Message for ${u.namaUnit} copied.`), ok: true });
    } catch {
      setMsg({ text: L("Gagal menyalin ke papan klip.", "Could not copy to clipboard."), ok: false });
    }
  }

  const toggle = (k: string) =>
    setBuka((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });

  const inp = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

  if (units.length === 0) {
    return (
      <div className="rounded-xl bg-emerald-50 p-6 text-center text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
        ✓ {L("Semua ahli unit telah ditetapkan jawatan dan disahkan.", "All unit members have positions set and verified.")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kad label={L("Belum ditag jawatan", "No position set")} nilai={jumlah.jawatan} tone="rose" aktif={isu === "jawatan"} onClick={() => setIsu("jawatan")} />
        <Kad label={L("Butiran belum disahkan", "Details not verified")} nilai={jumlah.sah} tone="amber" aktif={isu === "sah"} onClick={() => setIsu("sah")} />
        <Kad label={L("Cadangan jawatan menunggu", "Pending proposals")} nilai={jumlah.cadangan} tone="sky" aktif={isu === "cadangan"} onClick={() => setIsu("cadangan")} />
        <Kad label={L("Unit tiada GKP/PGKP", "Units without Head Advisor")} nilai={jumlah.tanpaGkp} tone="slate" />
      </div>

      {/* Penapis + tindakan */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <label className="text-xs font-semibold uppercase text-slate-500">
          {L("Bahagian", "Section")}
          <select value={bahagian} onChange={(e) => setBahagian(e.target.value)} className={`${inp} mt-1 block`}>
            <option value="">{L("Semua", "All")}</option>
            {jenisAda.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase text-slate-500">
          {L("Isu", "Issue")}
          <select value={isu} onChange={(e) => setIsu(e.target.value as Isu)} className={`${inp} mt-1 block`}>
            <option value="jawatan">{L("Belum ditag jawatan", "No position set")}</option>
            <option value="sah">{L("Butiran belum disahkan", "Details not verified")}</option>
            <option value="cadangan">{L("Cadangan menunggu", "Pending proposal")}</option>
            <option value="semua">{L("Semua isu", "All issues")}</option>
          </select>
        </label>
        <label className="min-w-[12rem] flex-1 text-xs font-semibold uppercase text-slate-500">
          {L("Cari pelajar / unit / guru", "Search student / unit / teacher")}
          <input value={cari} onChange={(e) => setCari(e.target.value)} className={`${inp} mt-1 block w-full`} placeholder={L("Nama, No. KP…", "Name, IC…")} />
        </label>
        <button
          onClick={() => maklum(tapis.map((u) => u.namaUnit), "semua")}
          disabled={busy !== null || tapis.length === 0}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {busy === "semua" ? L("Menghantar…", "Sending…") : L(`🔔 Maklum GKP/PGKP (${tapis.length} unit)`, `🔔 Notify advisors (${tapis.length} units)`)}
        </button>
      </div>

      {msg && (
        <p className={`rounded-lg px-4 py-2 text-sm font-semibold ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{msg.text}</p>
      )}

      {tapis.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">{L("Tiada pelajar sepadan dengan penapis.", "No students match the filters.")}</p>
      )}

      {/* Senarai unit */}
      <div className="space-y-3">
        {tapis.map((u) => {
          const k = `${u.jenisKoko}|${u.namaUnit}`;
          const terbuka = buka.has(k);
          return (
            <section key={k} className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-start gap-3 p-4">
                <button onClick={() => toggle(k)} className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-semibold uppercase text-brand-dark">{u.jenisKoko}</p>
                  <p className="font-bold text-slate-800">{terbuka ? "▾" : "▸"} {u.namaUnit}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{u.jumlahAhli} {L("ahli", "members")}</span>
                    {u.bilTiadaJawatan > 0 && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-700">{u.bilTiadaJawatan} {L("tiada jawatan", "no position")}</span>}
                    {u.bilBelumSah > 0 && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">{u.bilBelumSah} {L("belum sah", "unverified")}</span>}
                    {u.bilCadangan > 0 && <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-700">{u.bilCadangan} {L("cadangan", "proposals")}</span>}
                  </div>
                </button>
                <div className="min-w-[14rem] text-xs">
                  {u.gkp.length > 0 ? (
                    <SenaraiGuru guru={u.gkp} />
                  ) : (
                    <>
                      <p className="font-semibold text-rose-600">⚠ {L("Tiada GKP/PGKP ditetapkan", "No Head Advisor assigned")}</p>
                      {u.penasihat.length > 0 && <SenaraiGuru guru={u.penasihat} />}
                    </>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => salin(u)} className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                    📋 {L("Salin mesej", "Copy message")}
                  </button>
                  <button
                    onClick={() => maklum([u.namaUnit], k)}
                    disabled={busy !== null || (u.gkp.length === 0 && u.penasihat.length === 0)}
                    className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-2 disabled:opacity-50"
                  >
                    {busy === k ? "…" : `🔔 ${L("Maklum", "Notify")}`}
                  </button>
                </div>
              </div>
              {terbuka && (
                <div className="overflow-x-auto border-t border-slate-100 px-4 pb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                        <th className="py-2 pr-3">#</th>
                        <th className="py-2 pr-3">{L("Nama", "Name")}</th>
                        <th className="py-2 pr-3">{L("No. KP", "IC No.")}</th>
                        <th className="py-2 pr-3">{L("Kelas", "Class")}</th>
                        <th className="py-2 pr-3">{L("Jawatan T6", "T6 Position")}</th>
                        <th className="py-2">{L("Status", "Status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {u.pelajar.map((p, i) => (
                        <tr key={p.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-2 pr-3 text-slate-400">{i + 1}</td>
                          <td className="py-2 pr-3 font-medium text-slate-800">{p.nama}</td>
                          <td className="py-2 pr-3 text-slate-500">{p.noIc}</td>
                          <td className="py-2 pr-3 text-slate-500">{p.kelasT6 ?? "—"}</td>
                          <td className="py-2 pr-3">{p.tiadaJawatan ? <span className="font-semibold text-rose-600">{L("Belum ditetapkan", "Not set")}</span> : p.jawatanT6}</td>
                          <td className="py-2 text-xs">
                            <div className="flex flex-wrap gap-1">
                              {p.belumSah && <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-700">{L("Belum sah", "Unverified")}</span>}
                              {p.cadanganPending && <span className="rounded bg-sky-100 px-1.5 py-0.5 font-semibold text-sky-700">{L("Cadangan", "Proposed")}: {p.cadanganPending}</span>}
                              {!p.belumSah && !p.cadanganPending && <span className="text-slate-400">—</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function SenaraiGuru({ guru }: { guru: GuruUnitRingkas[] }) {
  return (
    <ul className="space-y-0.5">
      {guru.map((g) => (
        <li key={g.id} className="text-slate-600">
          <span className="mr-1 rounded bg-brand-light px-1 py-0.5 text-[10px] font-bold text-brand-dark">{LABEL_PERANAN[g.peranan] ?? g.peranan}</span>
          {g.nama}
          {g.email && (
            <a href={`mailto:${g.email}`} className="ml-1 text-brand-dark hover:underline" title={g.email}>✉</a>
          )}
        </li>
      ))}
    </ul>
  );
}

function Kad({ label, nilai, tone, aktif, onClick }: { label: string; nilai: number; tone: "rose" | "amber" | "sky" | "slate"; aktif?: boolean; onClick?: () => void }) {
  const warna = { rose: "text-rose-600", amber: "text-amber-600", sky: "text-sky-600", slate: "text-slate-700" }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`rounded-xl bg-white p-4 text-left shadow-sm ring-1 transition ${aktif ? "ring-2 ring-brand" : "ring-slate-200"} ${onClick ? "hover:ring-brand/50" : "cursor-default"}`}
    >
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${warna}`}>{nilai}</p>
    </button>
  );
}
