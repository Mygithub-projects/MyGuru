import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/locale";
import Link from "next/link";
import { getKehadiranSaya, BAHAGIAN_GURU } from "@/lib/kehadiran-guru";
import { IsiKehadiranGuru } from "./IsiKehadiranGuru";

function fmtTarikh(iso: string) {
  return new Intl.DateTimeFormat("ms-MY", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(iso));
}

const WARNA: Record<string, string> = { Uniform: "#059669", Sukan: "#d97706", Kelab: "#2563eb" };

const SAIZ_HALAMAN = 10;
const STATUS_TAPIS = ["semua", "belum", "Pending", "Approved"] as const;
type StatusTapis = (typeof STATUS_TAPIS)[number];

export default async function KehadiranSayaPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; jenis?: string; hal?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.guruId) redirect(session.role === "Admin" ? "/admin/kehadiran-guru" : "/login");

  const { t } = await getT();
  const d = t.kehadiranGuru;
  const { sesi: semuaSesi, ringkasan } = await getKehadiranSaya({ id: session.guruId });

  // Tapisan + paginasi (melalui URL supaya kekal selepas Hantar / muat semula)
  const sp = await searchParams;
  const fStatus: StatusTapis = STATUS_TAPIS.includes(sp.status as StatusTapis) ? (sp.status as StatusTapis) : "semua";
  const fJenis = BAHAGIAN_GURU.some((b) => b.jenis === sp.jenis) ? sp.jenis! : "";
  const perluIsi = (s: (typeof semuaSesi)[number]) => s.bolehIsi && (!s.rekod || s.rekod.statusSemakan === "Rejected");
  const ditapis = semuaSesi.filter((s) => {
    if (fJenis && s.jenisKoko !== fJenis) return false;
    if (fStatus === "belum") return perluIsi(s);
    if (fStatus === "Pending" || fStatus === "Approved") return s.rekod?.statusSemakan === fStatus;
    return true;
  });
  const jumlahHal = Math.max(1, Math.ceil(ditapis.length / SAIZ_HALAMAN));
  const hal = Math.min(jumlahHal, Math.max(1, parseInt(sp.hal ?? "1", 10) || 1));
  const mula = (hal - 1) * SAIZ_HALAMAN;
  const sesi = ditapis.slice(mula, mula + SAIZ_HALAMAN);

  const pautan = (p: { status?: string; jenis?: string; hal?: number }) => {
    const q = new URLSearchParams();
    const st = p.status ?? fStatus;
    const jn = p.jenis ?? fJenis;
    if (st !== "semua") q.set("status", st);
    if (jn) q.set("jenis", jn);
    if (p.hal && p.hal > 1) q.set("hal", String(p.hal));
    const s = q.toString();
    return s ? `/guru/kehadiran-saya?${s}` : "/guru/kehadiran-saya";
  };
  const bilStatus = (st: StatusTapis) =>
    semuaSesi.filter((s) => (!fJenis || s.jenisKoko === fJenis) &&
      (st === "semua" ? true : st === "belum" ? perluIsi(s) : s.rekod?.statusSemakan === st)).length;
  const labelStatus: Record<StatusTapis, string> = {
    semua: d.all, belum: d.fNeedAction, Pending: d.stPending, Approved: d.stApproved,
  };
  const chip = (aktif: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
      aktif ? "bg-slate-800 text-white ring-slate-800" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
    }`;

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
            {semuaSesi.length > 0 && (
              <div className="mb-4 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {STATUS_TAPIS.map((st) => (
                    <Link key={st} href={pautan({ status: st, hal: 1 })} scroll={false} className={chip(fStatus === st)}>
                      {labelStatus[st]} <span className="opacity-70">({bilStatus(st)})</span>
                    </Link>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={pautan({ jenis: "", hal: 1 })} scroll={false} className={chip(fJenis === "")}>{d.allTypes}</Link>
                  {BAHAGIAN_GURU.filter((b) => semuaSesi.some((s) => s.jenisKoko === b.jenis)).map((b) => (
                    <Link key={b.jenis} href={pautan({ jenis: b.jenis, hal: 1 })} scroll={false} className={chip(fJenis === b.jenis)}>
                      {b.kod} · {b.jenis}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {semuaSesi.length === 0 ? (
              <p className="text-sm text-slate-400">{d.noSessions}</p>
            ) : sesi.length === 0 ? (
              <p className="text-sm text-slate-400">{d.noMatch}</p>
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
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    {d.showing
                      .replace("{a}", String(mula + 1))
                      .replace("{b}", String(mula + sesi.length))
                      .replace("{n}", String(ditapis.length))}
                  </span>
                  {jumlahHal > 1 && (
                    <div className="flex items-center gap-1">
                      {hal > 1 ? (
                        <Link href={pautan({ hal: hal - 1 })} scroll={false} className={chip(false)}>{d.prev}</Link>
                      ) : (
                        <span className={`${chip(false)} opacity-40`}>{d.prev}</span>
                      )}
                      {Array.from({ length: jumlahHal }, (_, i) => i + 1).map((n) => (
                        <Link key={n} href={pautan({ hal: n })} scroll={false} className={chip(n === hal)}>{n}</Link>
                      ))}
                      {hal < jumlahHal ? (
                        <Link href={pautan({ hal: hal + 1 })} scroll={false} className={chip(false)}>{d.next}</Link>
                      ) : (
                        <span className={`${chip(false)} opacity-40`}>{d.next}</span>
                      )}
                    </div>
                  )}
                </div>
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
