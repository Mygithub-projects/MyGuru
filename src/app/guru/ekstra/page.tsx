import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JAWATAN_SAHKAN_EKSTRA } from "@/lib/enums";
import { EkstraSemakanPage } from "@/components/EkstraSemakanPage";

// Semakan Ekstra Kurikulum — HANYA Ketua Unit Kokurikulum.
export default async function GuruEkstraPage() {
  const session = await getSession();
  if (!session?.guruId) redirect("/login");
  const guru = await prisma.guru.findUnique({ where: { id: session.guruId }, select: { jawatanKoko: true } });
  if (!guru || !JAWATAN_SAHKAN_EKSTRA.includes(guru.jawatanKoko)) redirect("/guru");
  return <EkstraSemakanPage />;
}
