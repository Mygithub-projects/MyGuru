import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GuruClient } from "./GuruClient";

export default async function GuruAdminPage() {
  const guruRaw = await prisma.guru.findMany({
    orderBy: { nama: "asc" },
    select: {
      id: true, nama: true, email: true, jawatanKoko: true, statusAktif: true,
      penasihatKelab: {
        select: { namaUnit: true, jenisKoko: true, peranan: true },
        orderBy: { namaUnit: "asc" },
      },
    },
  });
  const guru = guruRaw.map((g) => ({
    id: g.id,
    nama: g.nama,
    email: g.email,
    jawatanKoko: g.jawatanKoko,
    statusAktif: g.statusAktif,
    penasihatKelab: g.penasihatKelab,
  }));
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← Kembali</Link>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-800">Urus Guru & Guru Penasihat</h1>
          <Link href="/admin/guru/tambah" className="shrink-0 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">➕ Tambah Guru</Link>
        </div>
        <p className="text-sm text-slate-500">
          Tetapkan jawatan kokurikulum dan unit seliaan (Kelab/Sukan/Badan Beruniform) setiap guru.
          Hanya unit dengan guru penasihat boleh dipohon oleh pelajar.
        </p>
      </div>
      <GuruClient guru={guru} />
    </div>
  );
}
