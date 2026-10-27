"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { InfoKohort } from "@/lib/kohort-urus";
import type { Locale } from "@/lib/i18n";

const tkh = (iso: string) => new Date(iso).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" });

export function KohortClient({
  senarai,
  seterusnya,
  hariIni,
  locale,
}: {
  senarai: InfoKohort[];
  seterusnya: string;
  hariIni: string;
  locale: Locale;
}) {
  const L = (ms: string, en: string) => (locale === "en" ? en : ms);
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [nama, setNama] = useState(seterusnya);
  const [mula, setMula] = useState(hariIni);

  async function hantar(method: "POST" | "PATCH", body: object, kunci: string) {
    setBusy(kunci);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/kohort", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const aktif = senarai.filter((k) => k.status === "Aktif");
  const inp = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      {/* Peringatan kitaran: bulan ke-8 sedia kohort baharu; bulan ke-18 tamatkan */}
      {aktif.filter((k) => k.fasa !== "awal").map((k) => (
        <div
          key={k.nama}
          className={`rounded-xl px-4 py-3 text-sm ring-1 ${k.fasa === "patutTamat" ? "bg-rose-50 text-rose-800 ring-rose-200" : "bg-amber-50 text-amber-800 ring-amber-200"}`}
        >
          {k.fasa === "patutTamat"
            ? L(`${k.nama} telah melepasi 18 bulan (jangka tamat ${tkh(k.jangkaTamat)}). Tamatkan & arkib kohort ini supaya data tidak bertindan.`,
                `${k.nama} has passed 18 months (expected end ${tkh(k.jangkaTamat)}). End & archive it so data does not overlap.`)
            : L(`${k.nama} kini bulan ke-${k.bulanKe}/18. Kohort baharu masuk mulai bulan ke-8 — pastikan ${seterusnya} didaftarkan dan disediakan.`,
                `${k.nama} is now in month ${k.bulanKe}/18. A new cohort enters from month 8 — make sure ${seterusnya} is registered and set up.`)}
        </div>
      ))}

      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.text}
        </div>
      )}

      <section className="overflow-x-auto rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{L("Kohort", "Cohorts")}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="py-2 pr-3">{L("Kohort", "Cohort")}</th>
              <th className="py-2 pr-3">{L("Tarikh mula", "Start date")}</th>
              <th className="py-2 pr-3">{L("Kitaran", "Cycle")}</th>
              <th className="py-2 pr-3">{L("Jangka tamat", "Expected end")}</th>
              <th className="py-2 pr-3 text-right">{L("Pelajar", "Students")}</th>
              <th className="py-2 pr-3">{L("Status", "Status")}</th>
              <th className="py-2 text-right">{L("Tindakan", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {senarai.map((k) => (
              <tr key={k.nama} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-3 font-semibold text-slate-800">{k.nama}</td>
                <td className="py-2 pr-3">
                  <input
                    type="date"
                    defaultValue={k.tarikhMula.slice(0, 10)}
                    aria-label={L("Tarikh mula", "Start date")}
                    onBlur={(e) => e.target.value && e.target.value !== k.tarikhMula.slice(0, 10) &&
                      hantar("PATCH", { tindakan: "tarikh", nama: k.nama, tarikhMula: e.target.value }, `t-${k.nama}`)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                  />
                </td>
                <td className="py-2 pr-3">
                  {k.status === "Aktif" ? (
                    <div className="w-36">
                      <div className="mb-0.5 text-xs text-slate-600">{L("Bulan", "Month")} {k.bulanKe}/18</div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full ${k.fasa === "patutTamat" ? "bg-rose-500" : k.fasa === "sediaBaharu" ? "bg-amber-500" : "bg-brand"}`}
                          style={{ width: `${(k.bulanKe / 18) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">{k.tarikhTamat ? `${L("Diarkib", "Archived")} ${tkh(k.tarikhTamat)}` : "—"}</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-xs text-slate-600">{tkh(k.jangkaTamat)}</td>
                <td className="py-2 pr-3 text-right">{k.status === "Aktif" ? k.pelajar : `${k.pelajarAktif}/${k.pelajar}`}</td>
                <td className="py-2 pr-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${k.status === "Aktif" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {k.status === "Aktif" ? L("Aktif", "Active") : L("Diarkib", "Archived")}
                  </span>
                </td>
                <td className="py-2 text-right">
                  {k.status === "Aktif" ? (
                    <button
                      disabled={busy !== null}
                      onClick={() => {
                        if (confirm(L(
                          `Tamatkan & arkib ${k.nama}? ${k.pelajar} pelajar akan dinyahaktif dan tidak boleh log masuk. Data & markah disimpan.`,
                          `End & archive ${k.nama}? ${k.pelajar} students will be deactivated and cannot log in. Data & marks are kept.`,
                        ))) hantar("PATCH", { tindakan: "tamat", nama: k.nama }, `x-${k.nama}`);
                      }}
                      className="rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      {busy === `x-${k.nama}` ? "…" : L("Tamatkan & Arkib", "End & Archive")}
                    </button>
                  ) : (
                    <button
                      disabled={busy !== null}
                      onClick={() => hantar("PATCH", { tindakan: "aktif", nama: k.nama }, `a-${k.nama}`)}
                      className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                    >
                      {busy === `a-${k.nama}` ? "…" : L("Aktifkan semula", "Reactivate")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-600">{L("Daftar Kohort Baharu", "Register New Cohort")}</h2>
        <p className="mb-3 text-xs text-slate-500">
          {L("Kohort baharu masuk pada bulan ke-8 kohort semasa. Setiap kohort berada dalam sistem selama 18 bulan.",
             "A new cohort enters in month 8 of the current cohort. Each cohort stays in the system for 18 months.")}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-slate-600">{L("Nama kohort", "Cohort name")}
            <input value={nama} onChange={(e) => setNama(e.target.value)} className={`${inp} mt-1 block w-40`} />
          </label>
          <label className="text-xs font-medium text-slate-600">{L("Tarikh mula", "Start date")}
            <input type="date" value={mula} onChange={(e) => setMula(e.target.value)} className={`${inp} mt-1 block`} />
          </label>
          <button
            disabled={busy !== null || !nama || !mula}
            onClick={() => hantar("POST", { nama, tarikhMula: mula }, "baru")}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {busy === "baru" ? "…" : L("Daftar Kohort", "Register Cohort")}
          </button>
        </div>

        <ol className="mt-5 space-y-1.5 text-sm text-slate-700">
          <li className="font-semibold text-slate-600">{L("Langkah selepas daftar kohort baharu:", "Steps after registering a new cohort:")}</li>
          <li>1. <Link href={`/admin/tetapan?kohort=${encodeURIComponent(nama)}`} className="font-semibold text-brand-dark hover:underline">{L("Tetapkan had ahli unit", "Set unit member limits")}</Link> {L("(boleh salin daripada kohort semasa)", "(can copy from current cohort)")}</li>
          <li>2. {L("Pilih kohort baharu di header, kemudian tetapkan", "Select the new cohort in the header, then set")} <Link href="/admin/tetapan" className="font-semibold text-brand-dark hover:underline">{L("jumlah aktiviti kehadiran", "attendance activity totals")}</Link></li>
          <li>3. <Link href="/admin/import" className="font-semibold text-brand-dark hover:underline">{L("Import pelajar baharu", "Import new students")}</Link> {L("dengan tag kohort ini", "tagged with this cohort")}</li>
          <li>4. {L("Pelajar log masuk & daftar unit SP/KP/BU; SU/NSU membuka sesi perjumpaan sendiri (#1, #2… bermula semula).",
                     "Students log in & register SP/KP/BU units; SU/NSU open their own meetings (#1, #2… restart).")}</li>
          <li>5. {L("Pada bulan ke-18, tamatkan & arkib kohort lama di atas.", "At month 18, end & archive the old cohort above.")}</li>
        </ol>
      </section>
    </div>
  );
}
