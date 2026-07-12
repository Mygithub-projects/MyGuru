import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getKehadiranGuru } from "@/lib/guru";
import { getT } from "@/lib/locale";
import { SortToggle } from "@/components/SortToggle";

function fmtTarikh(d: Date) {
  return new Intl.DateTimeFormat("ms-MY", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export default async function KehadiranGuruPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const arah: "asc" | "desc" = (await searchParams).sort === "lama" ? "asc" : "desc";

  const guru = session.guruId
    ? await prisma.guru.findUnique({ where: { id: session.guruId } })
    : null;
  if (!guru && session.role !== "Admin") redirect("/login");

  const guruEff =
    guru ??
    ({
      id: session.userId,
      nama: "Pentadbir",
      jawatanKoko: "Penyelaras",
      kelabDiselia: null,
      sukanDiselia: null,
      badanDiselia: null,
    } as NonNullable<typeof guru>);

  const sesi = await getKehadiranGuru(guruEff, arah);
  const { t } = await getT();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t.guru.attendanceTitle}</h1>
          <p className="text-sm text-slate-500">
            {t.guru.attendanceSub}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SortToggle />
          <Link href="/guru" className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
            ← {t.common.dashboard}
          </Link>
        </div>
      </div>

      {sesi.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
          {t.guru.noSessions}
        </p>
      ) : (
        sesi.map((s) => (
          <section key={s.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold uppercase text-brand-dark">
                  {s.jenisKoko}
                </span>
                {s.namaUnit} · {t.guru.meeting} #{s.bilPerjumpaan}
                <span className="text-xs font-normal text-slate-400">{fmtTarikh(s.tarikh)}</span>
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                  {t.common.hadir} {s.hadir}/{s.jumlah}
                </span>
                <span
                  className={`rounded-md px-2 py-1 font-semibold ${
                    s.disahkan ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {s.disahkan ? t.common.disahkan : t.common.belumDisahkan}
                </span>
              </div>
            </div>
            {s.ahli.length === 0 ? (
              <p className="text-sm text-slate-400">{t.guru.noAttendance}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                      <th className="py-2 pr-3">{t.guru.colName}</th>
                      <th className="py-2 pr-3">{t.guru.colClass}</th>
                      <th className="py-2">{t.pelajar.linkKehadiran}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.ahli.map((a, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pr-3 font-medium text-slate-700">{a.nama}</td>
                        <td className="py-2 pr-3 text-slate-600">{a.kelas ?? "-"}</td>
                        <td className="py-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                              a.hadir ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {a.hadir ? t.common.hadir : t.common.tidakHadir}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}
