import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/locale";
import { senaraiLaporanSU } from "@/lib/laporan-semakan";
import { LaporanSemakan } from "@/components/LaporanSemakan";

export default async function GuruLaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ jenis?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session?.guruId) redirect("/login");
  const guru = await prisma.guru.findUnique({ where: { id: session.guruId } });
  if (!guru) redirect("/login");
  const { t } = await getT();
  const sp = await searchParams;
  const jenis = sp.jenis ?? "";
  const status = sp.status ?? "";
  const rows = await senaraiLaporanSU(guru, { jenis, status });
  return <LaporanSemakan rows={rows} basePath="/guru/laporan" jenis={jenis} status={status} t={t} />;
}
