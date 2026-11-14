// Halaman urus Projek pelbagai unit — dikongsi oleh /guru/projek & /admin/projek.
import type { Guru } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/locale";
import { kohortDipilih } from "@/lib/kohort-pilihan";
import { guruSeluruhSekolah, unitSeliaan } from "@/lib/workflow";
import { calonPeserta } from "@/lib/projek";
import { senaraiUnit } from "@/lib/unit-list";
import { ProjekUrus } from "./ProjekUrus";

export async function ProjekUrusPage({ guru, userId }: { guru: Guru | null; userId: string }) {
  const { t } = await getT();
  const kohort = await kohortDipilih();
  // Guru unit: projek yang melibatkan unit seliaannya, atau yang dia cipta.
  const seliaan = guru && !guruSeluruhSekolah(guru) ? await unitSeliaan(guru) : null;

  const [projek, pelajar, unit] = await Promise.all([
    prisma.projek.findMany({
      where: {
        ...(kohort ? { kohort } : {}),
        ...(seliaan ? { OR: [{ units: { hasSome: seliaan } }, { dibuatOlehId: userId }] } : {}),
      },
      include: {
        tag: { include: { pelajar: { select: { id: true, nama: true, kelasT6: true } } }, orderBy: { createdAt: "asc" } },
        laporan: { select: { statusPengesahan: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    calonPeserta(kohort),
    senaraiUnit(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{t.laporan.projekUrus.title}</h1>
        <p className="text-sm text-slate-500">{t.laporan.projekUrus.sub}{kohort ? ` · ${kohort}` : ""}</p>
      </div>
      <ProjekUrus
        projek={projek.map((p) => ({
          id: p.id,
          nama: p.nama,
          units: p.units,
          dibuatOleh: p.dibuatOleh,
          laporan: p.laporan.map((l) => l.statusPengesahan),
          tag: p.tag.map((x) => ({ pelajarId: x.pelajar.id, nama: x.pelajar.nama, kelas: x.pelajar.kelasT6, peranan: x.peranan })),
        }))}
        pelajar={pelajar.map((p) => ({ id: p.id, nama: p.nama, kelas: p.kelasT6 }))}
        unit={unit}
        seliaan={seliaan}
        t={t.laporan.projekUrus}
      />
    </div>
  );
}
