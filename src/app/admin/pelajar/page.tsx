import Link from "next/link";
import { dbKohort } from "@/lib/prisma-kohort";
import { getT } from "@/lib/locale";
import { buangKurungan } from "@/lib/pajsk";
import { PelajarClient } from "./PelajarClient";

export default async function PelajarAdminPage() {
  const db = await dbKohort(); // data kohort dipilih sahaja
  const raw = await db.pelajar.findMany({
    orderBy: { nama: "asc" },
    select: {
      id: true, nama: true, noIc: true, kelasT6: true,
      markahPajskT6: true, peratusPajskT6: true, statusAktif: true,
      kokurikulum: { select: { jenisKoko: true, namaUnitT6: true, jawatanT6: true } },
    },
  });

  const unitOf = (koko: { jenisKoko: string; namaUnitT6: string | null }[], jenis: string) =>
    koko.find((k) => k.jenisKoko === jenis)?.namaUnitT6 ?? null;

  // Tag jawatan di bawah nama: hanya jawatan sebenar (bukan "Ahli ..."), markah
  // dalam kurungan dari import lama dibuang. Susunan ikut bidang.
  const SUSUNAN = ["Uniform", "Kelab", "Sukan", "Perkhidmatan"];
  // Seragamkan huruf: import lama simpan "NAIB SETIAUSAHA", sistem "Naib Setiausaha".
  const AKRONIM = new Set(["AJK", "PRS", "UKT", "UPP", "ICT"]);
  const kemas = (s: string) =>
    s.split(/\s+/).map((w) => (AKRONIM.has(w.toUpperCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(" ");
  const jawatanOf = (koko: { jenisKoko: string; namaUnitT6: string | null; jawatanT6: string | null }[]) =>
    koko
      .map((k) => ({ jenis: k.jenisKoko, unit: k.namaUnitT6, jawatan: kemas(buangKurungan(k.jawatanT6)) }))
      .filter((k): k is { jenis: string; unit: string; jawatan: string } =>
        !!k.unit && !!k.jawatan && !/^AHLI(\s|$)/i.test(k.jawatan))
      .sort((a, b) => SUSUNAN.indexOf(a.jenis) - SUSUNAN.indexOf(b.jenis));

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
    perkhidmatan: unitOf(p.kokurikulum, "Perkhidmatan"),
    jawatan: jawatanOf(p.kokurikulum),
  }));

  const { locale, t } = await getT();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← {t.common.kembali}</Link>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-800">{t.admin.pelajarTitle}</h1>
          <div className="flex shrink-0 gap-2">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- eksport fail (download), bukan navigasi ke page */}
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
