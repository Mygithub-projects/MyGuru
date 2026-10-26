import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/locale";
import { senaraiUnit } from "@/lib/unit-list";
import { JENIS_KOKO } from "@/lib/enums";
import { UnitAdminForm } from "./UnitAdminForm";

// Kemas kini penempatan unit pelajar — Admin sahaja (route di bawah /admin
// dilindungi proxy.ts; API /api/admin/pelajar/[id]/unit menyemak peranan Admin).
export default async function UnitPelajarAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [pelajar, senarai, { t, locale }] = await Promise.all([
    prisma.pelajar.findUnique({
      where: { id },
      select: {
        id: true, nama: true, noIc: true, kelasT6: true,
        kokurikulum: { select: { jenisKoko: true, namaUnitT6: true, jawatanT6: true, statusPertukaran: true } },
        pertukaran: {
          orderBy: { tarikhMohon: "desc" },
          take: 10,
          select: { id: true, jenisKoko: true, unitLama: true, unitBaru: true, status: true, sebab: true, tarikhMohon: true },
        },
      },
    }),
    senaraiUnit(),
    getT(),
  ]);
  if (!pelajar) notFound();
  const L = (ms: string, en: string) => (locale === "en" ? en : ms);
  const label: Record<string, string> = {
    Kelab: t.common.kelab, Sukan: t.common.sukan, Uniform: t.common.uniform, Perkhidmatan: t.common.perkhidmatan,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/pelajar/${pelajar.id}`} className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← {t.common.kembali}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{L("Kemas Kini Penempatan Unit", "Update Unit Placement")}</h1>
        <p className="text-sm text-slate-500">{pelajar.nama} · {pelajar.kelasT6 ?? "-"} · {pelajar.noIc}</p>
        <p className="mt-2 max-w-3xl rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          {L(
            "Hanya Admin boleh menukar penempatan. Gunakan ini bila pelajar berada dalam unit yang salah (guru unit tersebut tidak boleh mengesahkan jawatannya). Jawatan di unit baharu ditetapkan semula kepada Ahli Aktif, markah dikira semula, dan pelajar serta guru unit baharu dimaklumkan.",
            "Only Admin can change placements. Use this when a student is in the wrong unit (that unit's teacher cannot verify the position). The position in the new unit resets to Ahli Aktif, marks are recalculated, and the student and the new unit's teachers are notified.",
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {JENIS_KOKO.map((jenis) => {
          const k = pelajar.kokurikulum.find((x) => x.jenisKoko === jenis);
          return (
            <UnitAdminForm
              key={jenis}
              pelajarId={pelajar.id}
              jenisKoko={jenis}
              label={label[jenis]}
              unitSemasa={k?.namaUnitT6 ?? null}
              jawatanSemasa={k?.jawatanT6 ?? null}
              pending={k?.statusPertukaran === "Pending"}
              pilihan={senarai[jenis]}
              locale={locale}
            />
          );
        })}
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{L("Sejarah Pertukaran", "Transfer History")}</h2>
        {pelajar.pertukaran.length === 0 ? (
          <p className="text-sm text-slate-400">{L("Tiada rekod.", "No records.")}</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {pelajar.pertukaran.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-1.5 last:border-0">
                <span className="text-xs text-slate-400">{new Date(l.tarikhMohon).toLocaleDateString("ms-MY")}</span>
                <span className="font-semibold text-slate-600">{label[l.jenisKoko] ?? l.jenisKoko}</span>
                <span className="text-slate-700">{l.unitLama ?? "—"} → {l.unitBaru}</span>
                <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${l.status === "Approved" ? "bg-emerald-50 text-emerald-700" : l.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{l.status}</span>
                {l.sebab && <span className="text-xs text-slate-500">· {l.sebab}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
