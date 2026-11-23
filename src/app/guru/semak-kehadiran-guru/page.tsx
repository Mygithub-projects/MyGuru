import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JAWATAN_SAHKAN_KEHADIRAN_GURU } from "@/lib/enums";
import { HalamanSemakKehadiranGuru } from "@/app/admin/kehadiran-guru/HalamanSemak";

/** Semakan kehadiran guru — HANYA Ketua Unit Koko, KUPP/Pemantau & Penyelaras Kokurikulum. */
export default async function GuruSemakKehadiranGuruPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; jenis?: string }>;
}) {
  const session = await getSession();
  if (!session?.guruId) redirect("/guru");
  const guru = await prisma.guru.findUnique({ where: { id: session.guruId }, select: { id: true, jawatanKoko: true } });
  if (!guru || !JAWATAN_SAHKAN_KEHADIRAN_GURU.includes(guru.jawatanKoko)) redirect("/guru");
  return <HalamanSemakKehadiranGuru searchParams={searchParams} backHref="/guru" bolehSahkan kecualiGuruId={guru.id} />;
}
