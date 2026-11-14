import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjekUrusPage } from "@/components/ProjekUrusPage";

export default async function GuruProjekPage() {
  const session = await getSession();
  if (!session?.guruId) redirect("/login");
  const guru = await prisma.guru.findUnique({ where: { id: session.guruId } });
  if (!guru) redirect("/login");
  return <ProjekUrusPage guru={guru} userId={session.userId} />;
}
