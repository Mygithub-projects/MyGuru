import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { getKehadiranSaya } from "@/lib/kehadiran-guru";
import { IsiKehadiranGuru } from "./IsiKehadiranGuru";

function fmtTarikh(iso: string) {
  return new Intl.DateTimeFormat("ms-MY", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(iso));
}

const WARNA: Record<string, string> = { Uniform: "#059669", Sukan: "#d97706", Kelab: "#2563eb" };

export default async function KehadiranSayaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.guruId) redirect(session.role === "Admin" ? "/admin/kehadiran-guru" : "/login");

  const { t } = await getT();
  const d = t.kehadiranGuru;
  const { sesi, ringkasan } = await getKehadiranSaya({ id: session.guruId });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{d.guruTitle}</h1>
        <p className="text-sm text-slate-500">{d.guruSub}</p>
      </div>

      {ringkasan.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">{d.noUnits}</p>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{d.summaryTitle}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {ringkasan.map((r) => (
                <div key={r.jenis} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: WARNA[r.jenis] }}>
                      {r.kod}
                    </span>
                    <span className="truncate text-xs text-slate-500" title={r.units.join(", ")}>{r.units.join(", ") || "—"}</span>
                  </div>
                  <p className="mt-2 text-3xl font-bold" style={{ color: WARNA[r.jenis] }}>
                    {r.hadirDisahkan}
                    <span className="ml-1 text-sm font-medium text-slate-500">{d.presentVerified}</span>
                  </p>
                  <p className="text-xs text-slate-500">{d.ofMeetings.replace("{n}", String(r.jumlahPerjumpaan))}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {r.menunggu > 0 && (
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">{r.menunggu} {d.pending}</span>
                    )}
                    {r.belumIsi > 0 && (
                      <span className="rounded-md bg-red-100 px-2 py-0.5 font-semibold text-red-700">{r.belumIsi} {d.notFilled}</span>
                    )}
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-600">{d.datesTitle}</p>
                  {r.tarikhHadir.length === 0 ? (
                    <p className="text-xs text-slate-400">{d.noDates}</p>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.tarikhHadir.map((x, i) => (
                        <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">{fmtTarikh(x)}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{d.listTitle}</h2>
            {sesi.length === 0 ? (
              <p className="text-sm text-slate-400">{d.noSessions}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                      <th className="py-2 pr-3">{d.colUnit}</th>
                      <th className="py-2 pr-3">{d.colMeeting}</th>
                      <th className="py-2 pr-3">{d.colDate}</th>
                      <th className="py-2 pr-3">{d.colReview}</th>
                      <th className="py-2">{d.colMyStatus}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sesi.map((s) => (
                      <tr key={s.sesiId} className="border-b border-slate-100 align-top last:border-0">
                        <td className="py-2 pr-3">
                          <span className="font-medium text-slate-700">{s.namaUnit}</span>
                          <span className="block text-[11px] uppercase text-slate-400">{s.jenisKoko}</span>
                        </td>
                        <td className="py-2 pr-3 text-slate-600">#{s.bilPerjumpaan}</td>
                        <td className="whitespace-nowrap py-2 pr-3 text-slate-600">{fmtTarikh(s.tarikh)}</td>
                        <td className="py-2 pr-3">
                          <StatusSemakan s={s.rekod?.statusSemakan} d={d} />
                          {s.rekod?.komenAdmin && (
                            <span className="mt-1 block text-xs text-slate-500">{d.adminNote}: {s.rekod.komenAdmin}</span>
                          )}
                        </td>
                        <td className="py-2">
                          <IsiKehadiranGuru
                            sesiId={s.sesiId}
                            bolehIsi={s.bolehIsi}
                            rekod={s.rekod ? { statusHadir: s.rekod.statusHadir, catatan: s.rekod.catatan } : null}
                            t={{
                              present: d.present, absent: d.absent, reasonPlaceholder: d.reasonPlaceholder,
                              submit: d.submit, resubmit: d.resubmit, saving: d.saving, notStarted: d.notStarted,
                              networkError: d.networkError,
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatusSemakan({
  s, d,
}: {
  s?: string;
  d: { notYet: string; stPending: string; stApproved: string; stRejected: string };
}) {
  const map: Record<string, [string, string]> = {
    Pending: [d.stPending, "bg-amber-100 text-amber-700"],
    Approved: [d.stApproved, "bg-green-100 text-green-700"],
    Rejected: [d.stRejected, "bg-red-100 text-red-700"],
  };
  const [label, kelas] = s ? map[s] ?? [s, "bg-slate-100 text-slate-600"] : [d.notYet, "bg-slate-100 text-slate-500"];
  return <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${kelas}`}>{label}</span>;
}
