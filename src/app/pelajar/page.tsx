import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPelajarProfil } from "@/lib/pelajar";
import { StatusBadge } from "@/components/StatusBadge";
import { MarkahChart } from "@/components/MarkahChart";
import { senaraiUnitBerpenasihat } from "@/lib/unit-list";
import { getT } from "@/lib/locale";
import { UnitSection } from "./UnitSection";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default async function PelajarDashboard() {
  const session = await getSession();
  if (!session?.pelajarId) redirect("/login");

  const data = await getPelajarProfil(session.pelajarId);
  if (!data) redirect("/login");
  const { pelajar, markah, penyertaan, kehadiran } = data;
  const senarai = await senaraiUnitBerpenasihat();
  const { t } = await getT();
  const unitLabel: Record<string, string> = { Kelab: t.common.kelab, Sukan: t.common.sukan, Uniform: t.common.uniform };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t.pelajar.welcome} {pelajar.nama}</h1>
          <p className="text-sm text-slate-500">
            {pelajar.kelasT6} · {t.pelajar.icNo} {pelajar.noIc}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/pelajar/aktiviti" className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">{t.pelajar.linkAktiviti}</Link>
          {(session.subRole === "SU" || session.subRole === "NSU") && (
            <>
              <Link href="/pelajar/kehadiran" className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">{t.pelajar.linkKehadiran}</Link>
              <Link href="/pelajar/laporan" className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">{t.pelajar.linkLaporan}</Link>
              <Link href="/pelajar/jawatan" className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">{t.pelajar.linkJawatan}</Link>
            </>
          )}
          <a href={`/api/pelajar/${pelajar.id}/butiran-diri`} target="_blank" className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover">{t.pelajar.linkButiran}</a>
        </div>
      </div>

      {/* Ringkasan markah (T6) */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label={t.pelajar.scoreT6} value={`${pelajar.markahPajskT6 ?? "-"}`} sub={t.pelajar.systemComputed} />
        <Stat label={t.pelajar.pctT6} value={`${pelajar.peratusPajskT6 ?? "-"}%`} sub={t.pelajar.fullMarks100} />
        <Stat label={t.pelajar.gred} value={`${pelajar.gredPajskT6 ?? "-"}`} sub={t.pelajar.finalGrade} />
      </div>

      {/* Markah bagi setiap penyertaan (spec pelajar §1) */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
          {t.pelajar.marksByUnit}
        </h2>
        {penyertaan.length === 0 ? (
          <p className="text-sm text-slate-400">{t.guru.noMembers}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {penyertaan.map((p) => (
              <div key={p.jenisKoko} className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase text-brand-dark">{unitLabel[p.jenisKoko] ?? p.label}</p>
                <p className="mt-1 font-medium text-slate-800">{p.namaUnit}</p>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">{t.common.jawatan} {p.jawatan ? `(${p.jawatan})` : ""}</dt>
                    <dd className="font-semibold text-slate-700">{p.markahJawatan}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">{t.common.peringkat} {p.peringkat ? `(${p.peringkat})` : ""}</dt>
                    <dd className="font-semibold text-slate-700">{p.markahPeringkat}</dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1">
                    <dt className="font-semibold text-slate-600">{t.pelajar.participationTotal}</dt>
                    <dd className="font-bold text-brand-dark">{p.jumlah}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-[11px] text-slate-400">{t.pelajar.unitNote}</p>
      </section>

      {/* Kehadiran keseluruhan (spec pelajar §2) */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
          {t.pelajar.attendanceTitle}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t.pelajar.present} value={`${kehadiran.hadir} / ${kehadiran.jumlahSetahun}`} sub={`${kehadiran.direkod} ${t.pelajar.sessionsRecorded}`} />
          <Stat label={t.pelajar.attendancePct} value={`${kehadiran.peratus}%`} sub={t.pelajar.outOf30} />
          <Stat label={t.pelajar.attendanceMark} value={`${kehadiran.markah}`} sub={t.pelajar.fullMarks40} />
          <Stat label={t.pelajar.pajskContribution} value={`${kehadiran.markah}`} sub={t.pelajar.countedInT6} />
        </div>
      </section>

      {/* Carta pecahan markah (T6) */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-600">
          {t.pelajar.marksByCategory}
        </h2>
        <MarkahChart data={markah.map((m) => ({ ...m, kategori: t.pajsk[m.kunci] }))} />
      </section>

      {/* Unit kokurikulum semasa — pendaftaran/pertukaran via modal per-kategori */}
      <UnitSection
        pelajarId={pelajar.id}
        senarai={senarai}
        units={pelajar.kokurikulum.map((k) => ({
          jenisKoko: k.jenisKoko,
          namaUnitT5: k.namaUnitT5,
          namaUnitT6: k.namaUnitT6,
          jawatanT6: k.jawatanT6,
          peringkatT6: k.peringkatT6,
          statusPertukaran: k.statusPertukaran,
        }))}
      />

      {/* Pencapaian */}
      {pelajar.pencapaian.length > 0 && (
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
            {t.pelajar.achievements}
          </h2>
          <ul className="space-y-2">
            {pelajar.pencapaian.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm"
              >
                <span className="text-slate-700">{p.namaPencapaian}</span>
                <StatusBadge status={p.statusSemakan} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
