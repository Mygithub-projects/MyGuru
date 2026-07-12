import { prisma } from "@/lib/prisma";
import { requireSession, ok } from "@/lib/api";

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const senarai = await prisma.notifikasi.findMany({
    where: { userId: auth.session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const belumDibaca = senarai.filter((n) => !n.dibaca).length;
  return ok({ senarai, belumDibaca });
}

// Tandai semua sebagai dibaca
export async function PATCH() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  await prisma.notifikasi.updateMany({
    where: { userId: auth.session.userId, dibaca: false },
    data: { dibaca: true },
  });
  return ok(null, "Semua notifikasi ditandai dibaca");
}
