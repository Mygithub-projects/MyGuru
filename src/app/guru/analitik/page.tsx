import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { guruSeluruhSekolah, unitSeliaan } from "@/lib/workflow";
import { AnalitikDashboard } from "@/components/AnalitikDashboard";

export default async function GuruAnalitikPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const guru = session.guruId ? await prisma.guru.findUnique({ where: { id: session.guruId } }) : null;
  const seluruh = session.role === "Admin" || (guru ? guruSeluruhSekolah(guru) : false);
  const units = guru ? await unitSeliaan(guru) : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/guru" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← Kembali</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">Analitik Unit Seliaan</h1>
        <p className="text-sm text-slate-500">
          {seluruh ? "Skop: Seluruh Sekolah" : `Skop: ${units.join(", ") || "tiada unit"}`}
        </p>
        <div className="mt-2 flex gap-2">
          <a href="/api/analitik/eksport?format=excel" className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-2">⬇ Eksport Excel</a>
          <a href="/api/analitik/eksport?format=pdf" className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover">⬇ Eksport PDF</a>
        </div>
      </div>
      <AnalitikDashboard units={seluruh ? undefined : units} demografiPenuh={seluruh} />
    </div>
  );
}
