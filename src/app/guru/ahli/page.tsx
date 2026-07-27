import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSenaraiAhli } from "@/lib/guru";
import { getT } from "@/lib/locale";
import { SenaraiAhliTabs } from "./SenaraiAhliTabs";

export default async function SenaraiAhliPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const guru = session.guruId
    ? await prisma.guru.findUnique({ where: { id: session.guruId } })
    : null;
  if (!guru && session.role !== "Admin") redirect("/login");

  const guruEff =
    guru ??
    ({
      id: session.userId,
      nama: "Pentadbir",
      jawatanKoko: "Penyelaras",
      kelabDiselia: null,
      sukanDiselia: null,
      badanDiselia: null,
    } as NonNullable<typeof guru>);

  const senarai = await getSenaraiAhli(guruEff);
  const jumlahAhli = senarai.reduce((s, u) => s + u.ahli.length, 0);
  const { t } = await getT();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t.guru.membersTitle}</h1>
          <p className="text-sm text-slate-500">
            {senarai.length} {t.guru.unitCount} · {jumlahAhli} {t.guru.memberCount} · {t.guru.membersSub}
          </p>
        </div>
        <Link href="/guru" className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
          ← {t.common.dashboard}
        </Link>
      </div>

      {senarai.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
          {t.guru.noMembers}
        </p>
      ) : (
        <SenaraiAhliTabs
          units={senarai}
          labels={{
            name: t.guru.colName,
            kelas: t.guru.colClass,
            currentPos: t.guru.colCurrentPos,
            mark: t.guru.colMark,
            setPos: t.guru.colSetPos,
            members: t.guru.memberCount,
          }}
          t={{ ...t.guru.senaraiAhliTabs, jawatanAssign: t.guru.jawatanAssign }}
        />
      )}
    </div>
  );
}
