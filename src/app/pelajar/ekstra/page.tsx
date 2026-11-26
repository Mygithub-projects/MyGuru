import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { getT } from "@/lib/locale";
import { urlFail } from "@/lib/fail-url";
import { EkstraForm } from "./EkstraForm";

// Tab pelajar: Ekstra Kurikulum (Anugerah Khas). Markah ekstra keseluruhan =
// MAX(jawatan Unit Perkhidmatan, anugerah diluluskan), had 10.
export default async function EkstraPage() {
  const session = await getSession();
  if (!session?.pelajarId) redirect("/login");
  const pid = session.pelajarId;
  const { t, locale } = await getT();
  const en = locale === "en";

  const [rekod, pelajar, up] = await Promise.all([
    prisma.pencapaian.findMany({ where: { pelajarId: pid, kategori: "ekstra" }, orderBy: { createdAt: "desc" } }),
    prisma.pelajar.findUnique({ where: { id: pid }, select: { markahEkstra: true } }),
    prisma.kokurikulum.findFirst({ where: { pelajarId: pid, jenisKoko: "Perkhidmatan", namaUnitT6: { not: null } }, select: { namaUnitT6: true, jawatanT6: true, markahJawatanT6: true } }),
  ]);
  const statusLabel: Record<string, string> = en
    ? { Pending: "Awaiting verification", Approved: "Verified", Kuiri: "Query" }
    : { Pending: "Menunggu pengesahan", Approved: "Disahkan", Kuiri: "Kuiri" };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.pelajar.backToDashboard}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{en ? "Extra-Curricular" : "Ekstra Kurikulum"}</h1>
        <p className="text-sm text-slate-500">
          {en
            ? "Bonus marks (max 10): the higher of your Service Unit position and your verified special awards."
            : "Markah bonus (maks 10): yang tertinggi antara jawatan Unit Perkhidmatan dan anugerah khas yang disahkan."}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase text-slate-500">{en ? "Current extra-curricular mark" : "Markah Ekstra semasa"}</p>
          <p className="mt-1 text-2xl font-bold text-brand-dark">{pelajar?.markahEkstra ?? 0} <span className="text-sm font-medium text-slate-400">/ 10</span></p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase text-slate-500">{en ? "Service Unit" : "Unit Perkhidmatan"}</p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {up ? `${up.namaUnitT6} — ${up.jawatanT6 ?? "-"} (${up.markahJawatanT6 ?? 0})` : (en ? "Not registered" : "Tiada")}
          </p>
        </div>
      </section>

      <EkstraForm pelajarId={pid} />

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{en ? "My submissions" : "Penghantaran saya"}</h2>
        {rekod.length === 0 ? (
          <p className="text-sm text-slate-400">{en ? "No submissions yet." : "Belum ada penghantaran."}</p>
        ) : (
          <ul className="space-y-2">
            {rekod.map((r) => {
              const sijil = urlFail(r.lampiranEviden);
              return (
                <li key={r.id} className="rounded-lg border border-slate-100 px-3 py-2.5 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">{r.namaPencapaian}</p>
                      <p className="text-xs text-slate-500">
                        {r.peringkat ?? "-"} · {r.tarikh ? r.tarikh.toLocaleDateString("ms-MY") : "-"} · {r.tempat ?? "-"}
                      </p>
                    </div>
                    <StatusBadge status={r.statusSemakan} label={statusLabel[r.statusSemakan] ?? r.statusSemakan} />
                  </div>
                  {r.statusSemakan === "Approved" && (
                    <p className="mt-1 text-xs text-emerald-700">
                      ✓ {r.perkaraEkstra ?? "-"} — <span className="font-semibold">{r.markah} {en ? "marks" : "markah"}</span>
                    </p>
                  )}
                  {r.statusSemakan === "Kuiri" && r.komenGuru && (
                    <p className="mt-1 text-xs text-orange-700">{en ? "Query:" : "Kuiri:"} {r.komenGuru} {en ? "— please submit again with corrections." : "— sila hantar semula dengan pembetulan."}</p>
                  )}
                  {sijil && (
                    <a href={sijil} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-brand-dark hover:underline">
                      {en ? "View certificate" : "Lihat sijil"}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
