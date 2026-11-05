import Link from "next/link";
import { dbKohort } from "@/lib/prisma-kohort";
import { getT } from "@/lib/locale";
import { ringkasanKehadiranSemuaGuru, BAHAGIAN_GURU } from "@/lib/kehadiran-guru";
import { SemakKehadiranGuru } from "./SemakKehadiranGuru";

const back = "group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white";
const STATUS = ["Pending", "Approved", "Rejected"] as const;

export default async function AdminKehadiranGuruPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; jenis?: string }>;
}) {
  const db = await dbKohort(); // data kohort dipilih sahaja
  const { t } = await getT();
  const d = t.kehadiranGuru;
  const sp = await searchParams;
  const fStatus = sp.status === "semua" ? "" : STATUS.includes(sp.status as (typeof STATUS)[number]) ? sp.status! : "Pending";
  const fJenis = BAHAGIAN_GURU.some((b) => b.jenis === sp.jenis) ? sp.jenis! : "";

  const [ringkasan, rekod] = await Promise.all([
    ringkasanKehadiranSemuaGuru(),
    db.kehadiranGuru.findMany({
      where: {
        ...(fStatus ? { statusSemakan: fStatus } : {}),
        ...(fJenis ? { sesi: { jenisKoko: fJenis } } : {}),
      },
      include: {
        guru: { select: { nama: true } },
        sesi: { select: { namaUnit: true, jenisKoko: true, bilPerjumpaan: true, tarikh: true } },
      },
      orderBy: [{ sesi: { tarikh: "desc" } }, { createdAt: "desc" }],
      take: 500,
    }),
  ]);

  const rows = rekod.map((r) => ({
    id: r.id,
    guru: r.guru.nama,
    namaUnit: r.sesi.namaUnit,
    kod: BAHAGIAN_GURU.find((b) => b.jenis === r.sesi.jenisKoko)?.kod ?? r.sesi.jenisKoko,
    bil: r.sesi.bilPerjumpaan,
    tarikh: r.sesi.tarikh.toISOString(),
    statusHadir: r.statusHadir,
    catatan: r.catatan,
    statusSemakan: r.statusSemakan,
    komenAdmin: r.komenAdmin,
  }));

  const inp = "rounded-lg border border-slate-300 px-2 py-1.5 text-sm";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className={back}>{t.admin.back}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{d.adminTitle}</h1>
        <p className="text-sm text-slate-500">{d.adminSub}</p>
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{d.adminSummaryTitle}</h2>
        {ringkasan.length === 0 ? (
          <p className="text-sm text-slate-400">{d.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                  <th className="py-2 pr-3">{d.colTeacher}</th>
                  {BAHAGIAN_GURU.map((b) => <th key={b.kod} className="py-2 pr-3 text-center">{b.kod}</th>)}
                  <th className="py-2 pr-3 text-center">{d.colTotal}</th>
                  <th className="py-2 pr-3 text-center">{d.colPending}</th>
                  <th className="py-2 text-center">{d.colNotFilled}</th>
                </tr>
              </thead>
              <tbody>
                {ringkasan.map((g) => {
                  const hadir = Object.values(g.bahagian).reduce((a, b) => a + b.hadir, 0);
                  const jumlah = Object.values(g.bahagian).reduce((a, b) => a + b.jumlah, 0);
                  return (
                    <tr key={g.guruId} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-3 font-medium text-slate-700">{g.nama}</td>
                      {BAHAGIAN_GURU.map((b) => {
                        const x = g.bahagian[b.jenis];
                        return (
                          <td key={b.kod} className="py-2 pr-3 text-center text-slate-600">
                            {x.jumlah ? `${x.hadir}/${x.jumlah}` : "—"}
                          </td>
                        );
                      })}
                      <td className="py-2 pr-3 text-center font-semibold text-slate-800">{jumlah ? `${hadir}/${jumlah}` : "—"}</td>
                      <td className="py-2 pr-3 text-center">
                        {g.menunggu > 0 ? <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{g.menunggu}</span> : "—"}
                      </td>
                      <td className="py-2 text-center">
                        {g.belumIsi > 0 ? <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{g.belumIsi}</span> : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">{d.adminListTitle}</h2>
          <form method="get" className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-medium text-slate-600">{d.filterStatus}
              <select name="status" defaultValue={fStatus || "semua"} className={`${inp} mt-1 block`}>
                <option value="Pending">{d.stPending}</option>
                <option value="Approved">{d.stApproved}</option>
                <option value="Rejected">{d.stRejected}</option>
                <option value="semua">{d.all}</option>
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">{d.filterType}
              <select name="jenis" defaultValue={fJenis} className={`${inp} mt-1 block`}>
                <option value="">{d.allTypes}</option>
                {BAHAGIAN_GURU.map((b) => <option key={b.jenis} value={b.jenis}>{b.kod} ({b.jenis})</option>)}
              </select>
            </label>
            <button type="submit" className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-hover">{d.filterBtn}</button>
          </form>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400">{d.empty}</p>
        ) : (
          <SemakKehadiranGuru
            rows={rows}
            t={{
              colTeacher: d.colTeacher, colUnit: d.colUnit, colMeeting: d.colMeeting, colDate: d.colDate,
              colMyStatus: d.colMyStatus, colNote: d.colNote, colReview: d.colReview, colAction: d.colAction,
              present: d.present, absent: d.absent, approve: d.approve, reject: d.reject,
              approveSelected: d.approveSelected, rejectPrompt: d.rejectPrompt, networkError: d.networkError,
              stPending: d.stPending, stApproved: d.stApproved, stRejected: d.stRejected,
            }}
          />
        )}
      </section>
    </div>
  );
}
