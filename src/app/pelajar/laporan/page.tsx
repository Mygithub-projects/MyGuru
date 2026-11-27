import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { ringkasanSesi, sesiUntukUnit } from "@/lib/kehadiran";
import { getT } from "@/lib/locale";
import { SortToggle } from "@/components/SortToggle";
import { LaporanForm, type Semula } from "./LaporanForm";
import { huraiTeksLaporanOpr } from "@/lib/opr";
import { JAWATAN_PESERTA } from "@/lib/projek-jawatan";
import { calonPeserta, projekDiTag } from "@/lib/projek";

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; semula?: string }>;
}) {
  const session = await getSession();
  if (!session?.pelajarId) redirect("/login");
  const { t } = await getT();
  const sp = await searchParams;
  const arah: "asc" | "desc" = sp.sort === "lama" ? "asc" : "desc";

  const isSU = session.subRole === "SU" || session.subRole === "NSU";
  // Laporan Projek: pelajar yang di-tag SU/NSU projek oleh guru (walaupun bukan SU/NSU unit).
  const tags = await projekDiTag(session.pelajarId);
  if (!isSU && tags.length === 0) {
    return (
      <div className="space-y-4">
        <Link href="/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← {t.common.kembali}</Link>
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          {t.laporan.suNsuOnly}
        </div>
      </div>
    );
  }

  const koko = await prisma.kokurikulum.findMany({ where: { pelajarId: session.pelajarId } });
  const units = koko.filter((k) => k.namaUnitT6).map((k) => k.namaUnitT6!) as string[];

  const kohort = (await prisma.pelajar.findUnique({ where: { id: session.pelajarId }, select: { kohort: true } }))?.kohort ?? null;
  const [mingguan, projek, sesiList, calon] = await Promise.all([
    prisma.laporanMingguan.findMany({ where: { setiausahaId: session.pelajarId }, orderBy: { tarikh: arah } }),
    prisma.laporanProjek.findMany({
      where: { setiausahaId: session.pelajarId },
      orderBy: { createdAt: arah },
      include: {
        _count: { select: { peserta: true } },
        peserta: { select: { pelajarId: true, jawatan: true, pelajar: { select: { nama: true, kelasT6: true } } } },
      },
    }),
    isSU ? sesiUntukUnit(units, kohort) : Promise.resolve([]),
    tags.length ? calonPeserta(kohort) : Promise.resolve([]),
  ]);

  // Ringkasan kehadiran bagi sesi yang dipaut
  const sesiIds = [
    ...new Set([...mingguan, ...projek].map((r) => r.sesiId).filter(Boolean) as string[]),
  ];
  const ringkasan: Record<string, { hadir: number; total: number; peratus: number }> = {};
  await Promise.all(sesiIds.map(async (id) => { ringkasan[id] = await ringkasanSesi(id); }));

  // ?semula=<jenis>:<id> — betulkan laporan yang dikuiri; borang diisi dengan butiran asal.
  let semula: Semula | null = null;
  const [jenisSemula, idSemula] = (sp.semula ?? "").split(":");
  if (jenisSemula === "mingguan" && isSU) {
    const m = mingguan.find((x) => x.id === idSemula && x.statusSemakan === "Kuiri");
    if (m) {
      semula = {
        jenis: "mingguan", id: m.id, komen: m.komenGuru, namaProgram: m.namaProgram ?? "", projekId: "",
        peringkat: m.peringkat ?? "", tarikh: m.tarikh.toISOString().slice(0, 10), masa: m.masa ?? "",
        namaUnit: m.namaUnit ?? "", sesiId: m.sesiId ?? "", ...huraiTeksLaporanOpr(m.aktiviti), peserta: [],
      };
    }
  } else if (jenisSemula === "projek") {
    const p = projek.find((x) => x.id === idSemula && x.statusPengesahan === "Kuiri");
    const tag = p && tags.find((x) => x.projek.id === p.projekId);
    if (p && tag) {
      const ajk = new Set([session.pelajarId, ...tag.projek.tag.map((g) => g.pelajar.id)]);
      semula = {
        jenis: "projek", id: p.id, komen: p.komenGuru, namaProgram: "", projekId: tag.projek.id,
        peringkat: p.peringkatProjek ?? "", tarikh: p.tarikh ? p.tarikh.toISOString().slice(0, 10) : "", masa: "",
        namaUnit: p.namaUnit ?? "", sesiId: "", ...huraiTeksLaporanOpr(p.laporan ?? ""),
        // AJK (jawatan ditetapkan guru) ditambah semula oleh pelayan — hanya peserta biasa diisi.
        peserta: p.peserta
          .filter((x) => !ajk.has(x.pelajarId) && (JAWATAN_PESERTA as readonly string[]).includes(x.jawatan))
          .map((x) => ({ id: x.pelajarId, nama: x.pelajar.nama, kelas: x.pelajar.kelasT6, jawatan: x.jawatan })),
      };
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← {t.common.kembali}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.laporan.title}</h1>
        <p className="text-sm text-slate-500">{t.laporan.sub}</p>
      </div>

      <LaporanForm
        units={koko.filter((k) => k.namaUnitT6).map((k) => ({ jenisKoko: k.jenisKoko, namaUnit: k.namaUnitT6! }))}
        sesiList={sesiList.map((s) => ({ id: s.id, namaUnit: s.namaUnit, bilPerjumpaan: s.bilPerjumpaan }))}
        bolehMingguan={isSU}
        pelajarId={session.pelajarId}
        projek={tags.map((x) => ({
          id: x.projek.id,
          nama: x.projek.nama,
          units: x.projek.units,
          peranan: x.peranan,
          ajk: x.projek.tag.map((g) => ({ id: g.pelajar.id, nama: g.pelajar.nama, kelas: g.pelajar.kelasT6, peranan: g.peranan })),
        }))}
        calon={calon.map((c) => ({ id: c.id, nama: c.nama, kelas: c.kelasT6 }))}
        semula={semula}
      />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">{t.laporan.title}</h2>
        <SortToggle t={t.common.sortToggle} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{t.laporan.weekly}</h2>
          {mingguan.length === 0 ? <Empty message={t.laporan.noRecords} /> : (
            <div className="space-y-2">
              {mingguan.map((m) => (
                <div key={m.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{m.namaProgram ?? m.aktiviti}</span>
                    <StatusBadge status={m.statusSemakan} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {[m.namaUnit, m.peringkat, new Date(m.tarikh).toLocaleDateString("ms-MY"), m.masa].filter(Boolean).join(" · ")}
                    {m.lampiran ? ` ${t.laporan.attachmentLabel}` : ""}
                  </p>
                  {m.namaProgram && <p className="mt-1 line-clamp-3 text-xs text-slate-500">{m.aktiviti}</p>}
                  <Kehadiran sesiId={m.sesiId} r={ringkasan} labelHadir={t.laporan.reportAttendanceLabel} labelLihat={t.laporan.reportViewSession} />
                  {m.statusSemakan === "Kuiri" ? (
                    <Dikuiri komen={m.komenGuru} href={isSU ? `/pelajar/laporan?semula=mingguan:${m.id}#borang-laporan` : null} t={t.laporan} />
                  ) : m.komenGuru && <p className="mt-1 text-xs text-amber-600">{t.laporan.comment}: {m.komenGuru}</p>}
                  {m.statusSemakan === "Approved" && (
                    <a href={`/api/laporan/mingguan/${m.id}/pdf`} className="mt-1 inline-block text-xs font-semibold text-brand-dark hover:underline">{t.laporan.downloadVerified}</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{t.laporan.project}</h2>
          {projek.length === 0 ? <Empty message={t.laporan.noRecords} /> : (
            <div className="space-y-2">
              {projek.map((p) => (
                <div key={p.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{p.namaProjek}</span>
                    <StatusBadge status={p.statusPengesahan} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {[p.namaUnit, p.peringkatProjek, p.jawatanProjek, p.tarikh ? new Date(p.tarikh).toLocaleDateString("ms-MY") : null, p._count.peserta ? `${p._count.peserta} peserta` : null].filter(Boolean).join(" · ")}
                    {p.failKertasKerja || p.failLaporanImpak ? ` ${t.laporan.attachmentLabel}` : ""}
                  </p>
                  {p.laporan && <p className="mt-1 line-clamp-3 text-xs text-slate-500">{p.laporan}</p>}
                  <Kehadiran sesiId={p.sesiId} r={ringkasan} labelHadir={t.laporan.reportAttendanceLabel} labelLihat={t.laporan.reportViewSession} />
                  {p.statusPengesahan === "Kuiri" ? (
                    <Dikuiri
                      komen={p.komenGuru}
                      href={tags.some((x) => x.projek.id === p.projekId) ? `/pelajar/laporan?semula=projek:${p.id}#borang-laporan` : null}
                      t={t.laporan}
                    />
                  ) : p.komenGuru && <p className="mt-1 text-xs text-amber-600">{t.laporan.comment}: {p.komenGuru}</p>}
                  {p.statusPengesahan === "Approved" && (
                    <a href={`/api/laporan/projek/${p.id}/pdf`} className="mt-1 inline-block text-xs font-semibold text-brand-dark hover:underline">{t.laporan.downloadVerified}</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Kehadiran({
  sesiId,
  r,
  labelHadir,
  labelLihat,
}: {
  sesiId: string | null;
  r: Record<string, { hadir: number; total: number; peratus: number }>;
  labelHadir: string;
  labelLihat: string;
}) {
  if (!sesiId || !r[sesiId]) return null;
  const s = r[sesiId];
  return (
    <p className="mt-1 flex items-center gap-2 text-xs">
      <span className="rounded bg-brand-light px-1.5 py-0.5 font-semibold text-brand-dark">
        {labelHadir}: {s.hadir}/{s.total} ({s.peratus}%)
      </span>
      <Link href="/pelajar/kehadiran" className="text-brand-dark hover:underline">{labelLihat}</Link>
    </p>
  );
}

function Empty({ message }: { message: string }) {
  return <p className="text-sm text-slate-400">{message}</p>;
}

/** Kotak laporan dikuiri: komen guru + butang betulkan & hantar semula. */
function Dikuiri({ komen, href, t }: {
  komen: string | null;
  href: string | null;
  t: { queriedTitle: string; comment: string; fixResubmit: string };
}) {
  return (
    <div className="mt-2 rounded-md bg-orange-50 px-2.5 py-2 text-xs text-orange-800 ring-1 ring-orange-200">
      <p className="font-semibold">⚠ {t.queriedTitle}</p>
      {komen && <p className="mt-0.5">{t.comment}: {komen}</p>}
      {href && (
        <Link href={href} className="mt-1.5 inline-block rounded-md bg-orange-600 px-2.5 py-1 font-semibold text-white hover:bg-orange-700">
          {t.fixResubmit}
        </Link>
      )}
    </div>
  );
}
