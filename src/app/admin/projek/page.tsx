import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/locale";
import { kohortDipilih } from "@/lib/kohort-pilihan";
import { calonPeserta } from "@/lib/projek";
import { ProjekUrusPage } from "@/components/ProjekUrusPage";
import { ProgramKolej } from "@/components/ProgramKolej";

// Akses /admin dihadkan kepada Admin oleh src/proxy.ts.
// Tab: Projek Unit (projek pelbagai unit + AJK) | Program Kolej (markah penglibatan).
export default async function AdminProjekPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { t } = await getT();
  const tab = (await searchParams).tab === "program" ? "program" : "projek";
  const pk = t.laporan.programKolej;

  const tabs = (
    <div className="flex gap-2">
      {([["projek", pk.tabProjek], ["program", pk.tab]] as const).map(([k, l]) => (
        <Link key={k} href={k === "projek" ? "/admin/projek" : "/admin/projek?tab=program"}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === k ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
          {l}
        </Link>
      ))}
    </div>
  );

  if (tab === "projek") {
    return (
      <div className="space-y-4">
        {tabs}
        <ProjekUrusPage guru={null} userId={session.userId} />
      </div>
    );
  }

  const kohort = await kohortDipilih();
  const [program, pelajar] = await Promise.all([
    prisma.programKolej.findMany({
      where: kohort ? { kohort } : {},
      include: { peserta: { select: { pelajarId: true } } },
      orderBy: [{ tarikh: "desc" }, { createdAt: "desc" }],
    }),
    calonPeserta(kohort),
  ]);

  return (
    <div className="space-y-4">
      {tabs}
      <h1 className="text-xl font-bold text-slate-800">{pk.tab}{kohort ? <span className="ml-2 text-sm font-normal text-slate-500">· {kohort}</span> : null}</h1>
      <ProgramKolej
        program={program.map((p) => ({
          id: p.id,
          nama: p.nama,
          tarikh: p.tarikh?.toISOString() ?? null,
          peringkat: p.peringkat,
          peserta: p.peserta.map((x) => x.pelajarId),
        }))}
        pelajar={pelajar.map((p) => ({ id: p.id, nama: p.nama, kelas: p.kelasT6 }))}
        t={pk}
      />
    </div>
  );
}
