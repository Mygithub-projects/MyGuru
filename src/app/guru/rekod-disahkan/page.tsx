import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RekodDisahkanPage } from "@/components/RekodDisahkanPage";

// Rekod Disahkan — guru lihat & batalkan pengesahan yang dibuatnya sendiri
// (Ketua Unit Kokurikulum: semua pengesahan).
export default async function GuruRekodDisahkanPage({ searchParams }: { searchParams: Promise<{ jenis?: string }> }) {
  const session = await getSession();
  if (!session?.guruId) redirect("/login");
  const guru = await prisma.guru.findUnique({ where: { id: session.guruId }, select: { id: true, jawatanKoko: true } });
  if (!guru) redirect("/login");
  const { jenis } = await searchParams;
  return <RekodDisahkanPage pelaku={{ guru, userId: session.userId }} jenis={jenis} basePath="/guru/rekod-disahkan" />;
}
