import Link from "next/link";
import { getTetapanSijil } from "@/lib/tetapan-sijil";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/locale";
import { AWALAN_SIRI } from "@/lib/ecert-program";
import { SijilClient } from "./SijilClient";
import { ProgramClient } from "./ProgramClient";

export default async function SijilPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const tabProgram = tab === "program";
  const { t } = await getT();

  // null = jadual e-Cert Program belum wujud (migrasi manual belum dijalankan).
  const programs = tabProgram
    ? await prisma.programECert
        .findMany({ orderBy: { tarikh: "desc" }, include: { _count: { select: { peserta: true } } } })
        .catch((e) => {
          // P2021 = jadual belum wujud → mod tanpa simpan (dijangka, bukan ralat).
          if ((e as { code?: string }).code !== "P2021") console.error("[admin/sijil] ProgramECert", e);
          return null;
        })
    : [];

  const tabs = [
    { href: "/admin/sijil", label: t.admin.sijilTabs.template, on: !tabProgram },
    { href: "/admin/sijil?tab=program", label: t.admin.sijilTabs.program, on: tabProgram },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.admin.back}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{tabProgram ? t.admin.sijilTabs.program : t.admin.sijilPage.title}</h1>
        <p className="text-sm text-slate-500">{tabProgram ? t.admin.ecertProgram.subtitle : t.admin.sijilPage.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {tabs.map((x) => (
          <Link
            key={x.href}
            href={x.href}
            role="tab"
            aria-selected={x.on}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ring-1 transition ${
              x.on ? "bg-brand text-white ring-brand shadow-sm" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {x.label}
          </Link>
        ))}
      </div>

      {tabProgram ? (
        <ProgramClient
          programs={(programs ?? []).map((p) => ({
            id: p.id,
            namaProgram: p.namaProgram,
            // Tarikh disimpan sebagai tengah malam waktu tempatan — format tempatan, bukan ISO (UTC).
            tarikh: `${p.tarikh.getFullYear()}-${String(p.tarikh.getMonth() + 1).padStart(2, "0")}-${String(p.tarikh.getDate()).padStart(2, "0")}`,
            peringkat: p.peringkat,
            tempat: p.tempat,
            tahunSiri: p.tahunSiri,
            bilPeserta: p._count.peserta,
          }))}
          tetapan={await getTetapanSijil()}
          tahunPilihan={Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 2 + i)}
          awalanSiri={AWALAN_SIRI}
          modSimpan={programs !== null}
          t={t.admin.ecertProgram}
        />
      ) : (
        <SijilClient tetapan={await getTetapanSijil()} t={t.admin.sijilClient} />
      )}
    </div>
  );
}
