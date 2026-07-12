import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/locale";
import { PelajarClient } from "./PelajarClient";

export default async function PelajarAdminPage() {
  const raw = await prisma.pelajar.findMany({
    orderBy: { nama: "asc" },
    select: {
      id: true, nama: true, noIc: true, kelasT6: true,
      markahPajskT6: true, peratusPajskT6: true, statusAktif: true,
      kokurikulum: { select: { jenisKoko: true, namaUnitT6: true } },
    },
  });

  const unitOf = (koko: { jenisKoko: string; namaUnitT6: string | null }[], jenis: string) =>
    koko.find((k) => k.jenisKoko === jenis)?.namaUnitT6 ?? null;

  const pelajar = raw.map((p) => ({
    id: p.id,
    nama: p.nama,
    noIc: p.noIc,
    kelasT6: p.kelasT6,
    markahPajskT6: p.markahPajskT6,
    peratusPajskT6: p.peratusPajskT6,
    statusAktif: p.statusAktif,
    kelab: unitOf(p.kokurikulum, "Kelab"),
    sukan: unitOf(p.kokurikulum, "Sukan"),
    badan: unitOf(p.kokurikulum, "Uniform"),
  }));

  const { locale, t } = await getT();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← {t.common.kembali}</Link>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-800">{t.admin.pelajarTitle}</h1>
          <div className="flex shrink-0 gap-2">
            <a href="/api/admin/pelajar/eksport" className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">{t.admin.downloadAll}</a>
            <Link href="/admin/pelajar/tambah" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">{t.admin.actAddStudent}</Link>
          </div>
        </div>
        <p className="text-sm text-slate-500">{t.admin.pelajarSub}</p>
      </div>
      <PelajarClient pelajar={pelajar} locale={locale} />
    </div>
  );
}
