import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGuruDashboard, getStatusPilihanT6, getLaporanDisahkan } from "@/lib/guru";
import { getT } from "@/lib/locale";
import { guruSeluruhSekolah, unitSeliaan } from "@/lib/workflow";
import { cadangMarkahPencapaian, labelStatusPilihanT6 } from "@/lib/pajsk";
import { StatusBadge } from "@/components/StatusBadge";
import { AiInsights } from "@/components/AiInsights";
import { HeroBanner } from "@/components/HeroBanner";
import { StatCard } from "@/components/StatCard";
import { ReviewPanel } from "./ReviewPanel";
import { LivePending } from "./LivePending";
import { CadanganAiPanel, type CadanganRow } from "./CadanganAiPanel";
import type { CadanganAgent } from "@prisma/client";

function fmtTarikh(d: Date) {
  return new Intl.DateTimeFormat("ms-MY", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

/** Lengkapkan satu CadanganAgent dengan nama pelajar + label rujukan utk paparan. */
async function enrichCadangan(c: CadanganAgent): Promise<CadanganRow> {
  let pelajarNama: string | null = null;
  let rujukanLabel = c.jenis;

  if (c.jenis === "RECALC") {
    const p = await prisma.pelajar.findUnique({ where: { id: c.rujukanId }, select: { nama: true } });
    pelajarNama = p?.nama ?? null;
    rujukanLabel = "Kira semula markah PAJSK T6";
  } else if (c.jenis === "UNIT_TRANSFER") {
    const log = await prisma.logPertukaran.findUnique({
      where: { id: c.rujukanId },
      include: { pelajar: { select: { nama: true } } },
    });
    pelajarNama = log?.pelajar.nama ?? null;
    rujukanLabel = log ? `${log.jenisKoko}: ${log.unitLama ?? "-"} → ${log.unitBaru}` : "Pertukaran unit";
  } else if (c.jenis === "ACHIEVEMENT") {
    const pen = await prisma.pencapaian.findUnique({
      where: { id: c.rujukanId },
      include: { pelajar: { select: { nama: true } } },
    });
    if (pen) {
      pelajarNama = pen.pelajar.nama;
      rujukanLabel = `Pencapaian: ${pen.namaPencapaian}`;
    } else {
      const akt = await prisma.aktivitiLuar.findUnique({
        where: { id: c.rujukanId },
        include: { pelajar: { select: { nama: true } } },
      });
      if (akt) {
        pelajarNama = akt.pelajar.nama;
        rujukanLabel = `Aktiviti luar: ${akt.namaAktiviti}`;
      }
    }
  } else if (c.jenis === "ECERT") {
    const akt = await prisma.aktivitiLuar.findUnique({
      where: { id: c.rujukanId },
      include: { pelajar: { select: { nama: true } } },
    });
    pelajarNama = akt?.pelajar.nama ?? null;
    rujukanLabel = akt ? `e-Cert: ${akt.namaAktiviti}` : "Jana e-Cert";
  }

  return {
    id: c.id,
    jenis: c.jenis,
    keputusan: c.keputusan,
    justifikasi: c.justifikasi,
    dicipta: c.dicipta.toISOString(),
    pelajarNama,
    rujukanLabel,
  };
}

export default async function GuruDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Admin melihat halaman guru: skop seluruh sekolah, tiada profil guru.
  const guru = session.guruId
    ? await prisma.guru.findUnique({ where: { id: session.guruId } })
    : null;

  if (!guru && session.role !== "Admin") redirect("/login");

  // Untuk Admin tanpa profil guru, bina objek skop seluruh sekolah.
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

  const seluruh = guruSeluruhSekolah(guruEff);
  const units = await unitSeliaan(guruEff);
  const {
    pencapaian, aktivitiLuar, pertukaran, laporanMingguan, laporanProjek, sesiKehadiran, cadanganJawatan,
  } = await getGuruDashboard(guruEff);

  const bilPelajar = seluruh
    ? await prisma.pelajar.count()
    : units.length
    ? (await prisma.kokurikulum.findMany({
        where: { namaUnitT6: { in: units } },
        select: { pelajarId: true },
        distinct: ["pelajarId"],
      })).length
    : 0;

  const statusT6 = await getStatusPilihanT6(guruEff);
  const laporanDisahkan = await getLaporanDisahkan(guruEff);
  const { t, locale } = await getT();

  // Dokumen laporan disahkan: kumpulkan ikut kelab (namaUnit), isih ikut tarikh
  // (terbaharu dahulu) dalam setiap kumpulan. Laporan mingguan & projek dicampur.
  type DokRow = {
    id: string;
    tajuk: string;
    namaUnit: string | null;
    setiausaha: string;
    tarikh: string;
    jenis: "mingguan" | "projek";
  };
  const semuaDok: DokRow[] = [
    ...laporanDisahkan.mingguan.map((m) => ({ ...m, jenis: "mingguan" as const })),
    ...laporanDisahkan.projek.map((p) => ({ ...p, jenis: "projek" as const })),
  ];
  const grupDokMap = new Map<string, DokRow[]>();
  for (const d of semuaDok) {
    const key = d.namaUnit ?? "-";
    if (!grupDokMap.has(key)) grupDokMap.set(key, []);
    grupDokMap.get(key)!.push(d);
  }
  // ISO string isih leksikografik = kronologi; songsang utk terbaharu dahulu.
  const grupDok = [...grupDokMap.entries()]
    .map(([namaUnit, rows]) => ({
      namaUnit,
      rows: rows.sort((a, b) => b.tarikh.localeCompare(a.tarikh)),
    }))
    .sort((a, b) => a.namaUnit.localeCompare(b.namaUnit, "ms"));

  // Cadangan AI menunggu kelulusan (skop: guru-sekolah/admin lihat semua;
  // guru biasa lihat yang dialamatkan kepadanya).
  const cadanganRaw = await prisma.cadanganAgent.findMany({
    where: seluruh ? { status: "Pending" } : { status: "Pending", untukSemakan: session.userId },
    orderBy: { dicipta: "desc" },
  });
  const cadanganAi = await Promise.all(cadanganRaw.map(enrichCadangan));

  const totalPending =
    pencapaian.length +
    aktivitiLuar.length +
    pertukaran.length +
    laporanMingguan.length +
    laporanProjek.length +
    sesiKehadiran.length +
    cadanganJawatan.length;

  return (
    <div className="space-y-6">
      <HeroBanner
        heading={`${t.guru.dashboardTitle} — ${guruEff.nama}`}
        subheading={`${t.guru.position}: ${guruEff.jawatanKoko}`}
        scopeLabel={seluruh ? t.guru.scopeSchool : t.guru.scopeUnit}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t.guru.cardStudents} value={bilPelajar} />
        <StatCard label={t.guru.cardPending} value={totalPending} tone={totalPending > 0 ? "warn" : "default"} />
        <StatCard label={t.guru.cardClub} value={guruEff.kelabDiselia ?? "-"} small />
        <StatCard label={t.guru.cardSportBb} value={guruEff.sukanDiselia ?? guruEff.badanDiselia ?? "-"} small />
      </div>

      <LivePending t={t.guru.livePending} />

      <AiInsights units={seluruh ? undefined : units} />

      <CadanganAiPanel cadangan={cadanganAi} t={t.guru.cadanganAiPanel} />

      <ReviewPanel
        pencapaian={pencapaian.map((p) => ({
          id: p.id,
          namaPencapaian: p.namaPencapaian,
          kategori: p.kategori,
          peringkat: p.peringkat,
          markahCadangan: cadangMarkahPencapaian(p.peringkat),
          pelajar: p.pelajar,
        }))}
        aktivitiLuar={aktivitiLuar}
        pertukaran={pertukaran}
        laporanMingguan={laporanMingguan.map((l) => ({ id: l.id, tajuk: l.aktiviti, setiausaha: l.setiausaha }))}
        laporanProjek={laporanProjek.map((l) => ({ id: l.id, tajuk: l.namaProjek, setiausaha: l.setiausaha }))}
        sesiKehadiran={sesiKehadiran.map((s) => ({ id: s.id, namaUnit: s.namaUnit, jenisKoko: s.jenisKoko, bilPerjumpaan: s.bilPerjumpaan }))}
        cadanganJawatan={cadanganJawatan.map((c) => ({ id: c.id, jenisKoko: c.jenisKoko, jawatanBaru: c.jawatanBaru, markahJawatan: c.markahJawatan, pelajar: c.pelajar }))}
        t={t.guru.reviewPanel}
      />

      {/* Status Pilihan Unit T6 */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
          {t.guru.statusPilihan}
        </h2>
        {statusT6.mode === "ringkasan" ? (
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusT6.counts).map(([s, n]) => (
              <span key={s} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <StatusBadge status={s} label={labelStatusPilihanT6(s, locale)} /> <strong className="text-slate-700">{n}</strong>
              </span>
            ))}
          </div>
        ) : statusT6.rows.length === 0 ? (
          <p className="text-sm text-slate-400">{t.guru.noMembers}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                  <th className="py-2 pr-3">{t.header.roleStudent}</th>
                  <th className="py-2 pr-3">Unit</th>
                  <th className="py-2 pr-3">{t.common.jawatan}</th>
                  <th className="py-2">{t.common.status}</th>
                </tr>
              </thead>
              <tbody>
                {statusT6.rows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 font-medium text-slate-700">{r.nama}</td>
                    <td className="py-2 pr-3 text-slate-600">{r.jenisKoko}: {r.namaUnit}</td>
                    <td className="py-2 pr-3 text-slate-600">{r.jawatan}</td>
                    <td className="py-2"><StatusBadge status={r.status} label={labelStatusPilihanT6(r.status, locale)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Dokumen laporan yang telah disahkan — boleh muat turun (spec guru §6) */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
          {t.guru.verifiedDocs}
        </h2>
        {semuaDok.length === 0 ? (
          <p className="text-sm text-slate-400">{t.guru.noVerifiedDocs}</p>
        ) : (
          <div className="space-y-4">
            {grupDok.map((g) => (
              <div key={g.namaUnit}>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.namaUnit}</h3>
                <ul className="space-y-2">
                  {g.rows.map((l) => (
                    <li key={`${l.jenis}-${l.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm">
                      <span className="text-slate-700">
                        <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{l.jenis === "mingguan" ? t.guru.weekly : t.guru.project}</span>
                        {l.tajuk} <span className="text-xs text-slate-400">· {fmtTarikh(new Date(l.tarikh))} · {l.setiausaha}</span>
                      </span>
                      <a href={`/api/laporan/${l.jenis}/${l.id}/pdf`} className="shrink-0 text-xs font-semibold text-brand-dark hover:underline">{t.common.muatTurun}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
