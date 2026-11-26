import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { AktivitiForm } from "./AktivitiForm";
import { EvidenUpload } from "./EvidenUpload";
import { getT } from "@/lib/locale";
import { unitSeliaanSU } from "@/lib/pelajar";
import { calonPeserta } from "@/lib/projek";
import { kohortPelajar } from "@/lib/kohort-pilihan";

export default async function AktivitiPage() {
  const session = await getSession();
  if (!session?.pelajarId) redirect("/login");
  const pid = session.pelajarId;
  const { t, locale } = await getT();
  const en = locale === "en";

  const [pencapaian, aktivitiLuar, koko] = await Promise.all([
    prisma.pencapaian.findMany({ where: { pelajarId: pid, OR: [{ kategori: null }, { kategori: { not: "ekstra" } }] }, orderBy: { createdAt: "desc" } }),
    prisma.aktivitiLuar.findMany({
      where: { pelajarId: pid },
      orderBy: { createdAt: "desc" },
      include: { guruPengiring: { select: { nama: true } } },
    }),
    prisma.kokurikulum.findMany({ where: { pelajarId: pid } }),
  ]);
  const tarikhStr = (d: Date | null) => (d ? d.toLocaleDateString("ms-MY") : "");
  const units = koko.filter((k) => k.namaUnitT6).map((k) => ({ jenisKoko: k.jenisKoko, namaUnit: k.namaUnitT6! }));

  // SU/NSU (butiran disahkan — lihat getSession): borang Aktiviti Unit untuk unit bidang yang diselia.
  const isSU = session.subRole === "SU" || session.subRole === "NSU";
  const namaUnitSU = isSU ? await unitSeliaanSU(pid, session.subRole) : [];
  const unitSU = units.filter((u) => namaUnitSU.includes(u.namaUnit) && u.jenisKoko !== "Perkhidmatan");
  const [calon, hantaranSU, penyertaan] = await Promise.all([
    unitSU.length ? calonPeserta(await kohortPelajar(pid)) : Promise.resolve([]),
    unitSU.length
      ? prisma.aktivitiUnit.findMany({ where: { setiausahaId: pid }, orderBy: { createdAt: "desc" }, take: 30, include: { _count: { select: { peserta: true } } } })
      : Promise.resolve([]),
    prisma.aktivitiUnitPeserta.findMany({
      where: { pelajarId: pid },
      orderBy: { aktiviti: { createdAt: "desc" } },
      include: { aktiviti: { select: { namaAktiviti: true, namaUnit: true, peringkat: true, tarikh: true, statusPengesahan: true } } },
    }),
  ]);
  const senaraiGuru = await prisma.guru.findMany({
    where: { statusAktif: true },
    select: { id: true, nama: true },
    orderBy: { nama: "asc" },
  });
  const kedLabel: Record<string, string> = en
    ? { Penyertaan: "Participation", Johan: "Champion", "Naib Johan": "Runner-up", Ketiga: "Third" }
    : { Penyertaan: "Penyertaan", Johan: "Johan", "Naib Johan": "Naib Johan", Ketiga: "Ketiga" };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.pelajar.backToDashboard}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.pelajar.activityTitle}</h1>
        <p className="text-sm text-slate-500">{t.pelajar.activitySubtitle}</p>
      </div>

      <AktivitiForm
        pelajarId={pid}
        units={units}
        guru={senaraiGuru}
        su={unitSU.length ? { units: unitSU, calon: calon.map((c) => ({ id: c.id, nama: c.nama, kelas: c.kelasT6 })) } : undefined}
      />

      {(hantaranSU.length > 0 || penyertaan.length > 0) && (
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{en ? "Unit Activities" : "Aktiviti Unit"}</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {hantaranSU.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">{en ? "Submitted by you (SU/NSU)" : "Dihantar oleh anda (SU/NSU)"}</h3>
                <div className="space-y-2">
                  {hantaranSU.map((a) => (
                    <div key={a.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-700">{a.namaAktiviti}</span>
                        <StatusBadge status={a.statusPengesahan} />
                      </div>
                      <p className="text-xs text-slate-400">
                        {a.namaUnit} · {a.peringkat === "Sekolah" ? (en ? "College" : "Kolej") : a.peringkat}{a.tarikh ? ` · ${tarikhStr(a.tarikh)}` : ""} · {a._count.peserta} {en ? "participants" : "peserta"}
                      </p>
                      {a.komenGuru && <p className="mt-1 text-xs text-amber-600">{t.pelajar.commentLabel}: {a.komenGuru}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {penyertaan.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">{en ? "Your participation" : "Penyertaan anda"}</h3>
                <div className="space-y-2">
                  {penyertaan.map((p) => (
                    <div key={p.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-700">{p.aktiviti.namaAktiviti}</span>
                        <StatusBadge status={p.aktiviti.statusPengesahan} />
                      </div>
                      <p className="text-xs text-slate-400">
                        {p.aktiviti.namaUnit} · {p.aktiviti.peringkat === "Sekolah" ? (en ? "College" : "Kolej") : p.aktiviti.peringkat} · {kedLabel[p.kedudukan] ?? p.kedudukan}
                        {p.aktiviti.statusPengesahan === "Approved"
                          ? ` · ${en ? "Involvement" : "Penglibatan"} ${p.markahPenglibatan} · ${en ? "Achievement" : "Pencapaian"} ${p.markahPencapaian}`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{t.pelajar.achievementSection}</h2>
          {pencapaian.length === 0 ? <p className="text-sm text-slate-400">{t.pelajar.noRecords}</p> : (
            <div className="space-y-2">
              {pencapaian.map((p) => (
                <div key={p.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-700">{p.namaPencapaian}</span>
                    <StatusBadge status={p.statusSemakan} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {p.namaUnit ? `${p.namaUnit} · ` : ""}{p.peringkat ?? ""}{p.tarikh ? ` · ${tarikhStr(p.tarikh)}` : ""} {p.statusSemakan === "Approved" ? `· ${p.markah} ${t.pelajar.commentLabel}` : ""}
                  </p>
                  {p.laporan && <p className="mt-1 line-clamp-3 text-xs text-slate-500">{p.laporan}</p>}
                  {p.komenGuru && <p className="mt-1 text-xs text-amber-600">{t.pelajar.commentLabel}: {p.komenGuru}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{t.pelajar.externalActivitiesSection}</h2>
          {aktivitiLuar.length === 0 ? <p className="text-sm text-slate-400">{t.pelajar.noRecords}</p> : (
            <div className="space-y-2">
              {aktivitiLuar.map((a) => (
                <div key={a.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-700">{a.namaAktiviti}</span>
                    <StatusBadge status={a.statusPengesahan} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {a.namaUnit ? `${a.namaUnit} · ` : ""}{a.peringkat}{a.tarikh ? ` · ${tarikhStr(a.tarikh)}` : ""}
                    {a.kedudukan ? ` · ${kedLabel[a.kedudukan] ?? a.kedudukan}` : ""}
                    {a.guruPengiring ? ` · ${en ? "Escort" : "Pengiring"}: ${a.guruPengiring.nama}` : ""}
                    {a.statusPengesahan === "Approved"
                      ? a.kedudukan
                        ? ` · ${en ? "Involvement" : "Penglibatan"} ${a.markahPenglibatan} · ${en ? "Achievement" : "Pencapaian"} ${a.markahPencapaian} · ${a.noSiriECert}`
                        : ` · ${a.markahLuar} ${t.pelajar.commentLabel} · ${a.noSiriECert}`
                      : ""}
                  </p>
                  {a.laporan && <p className="mt-1 line-clamp-3 text-xs text-slate-500">{a.laporan}</p>}
                  {a.komenGuru && <p className="mt-1 text-xs text-amber-600">{t.pelajar.commentLabel}: {a.komenGuru}</p>}
                  {a.statusPengesahan !== "Approved" && !a.lampiranSurat && !a.lampiranSijil && (
                    <EvidenUpload pelajarId={pid} aktivitiId={a.id} />
                  )}
                  {a.statusPengesahan === "Approved" && (
                    <a href={`/api/pelajar/${pid}/ecert/${a.id}`} target="_blank"
                      className="mt-2 inline-block rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-hover">
                      {t.pelajar.generateECert}
                    </a>
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
