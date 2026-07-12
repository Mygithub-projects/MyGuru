import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ahliUnit } from "@/lib/kehadiran";
import { KehadiranPanel } from "./KehadiranPanel";

export default async function KehadiranPage() {
  const session = await getSession();
  if (!session?.pelajarId) redirect("/login");

  const isSU = session.subRole === "SU" || session.subRole === "NSU";
  if (!isSU) {
    return (
      <div className="space-y-4">
        <Link href="/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← Kembali</Link>
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          Modul kehadiran hanya untuk Setiausaha (SU) / Naib Setiausaha (NSU). Hubungi guru
          penasihat jika anda sepatutnya mempunyai akses ini.
        </div>
      </div>
    );
  }

  // Unit yang dimiliki SU ini
  const koko = await prisma.kokurikulum.findMany({ where: { pelajarId: session.pelajarId } });
  const units = await Promise.all(
    koko
      .filter((k) => k.namaUnitT6)
      .map(async (k) => ({
        jenisKoko: k.jenisKoko,
        namaUnit: k.namaUnitT6!,
        ahli: await ahliUnit(k.namaUnitT6!),
      }))
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← Kembali ke Dashboard</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">Kehadiran Ahli</h1>
        <p className="text-sm text-slate-500">
          Buka sesi perjumpaan, tanda kehadiran ahli secara senarai atau paparkan QR untuk
          ahli imbas sendiri.
        </p>
      </div>
      <KehadiranPanel units={units} />
    </div>
  );
}
