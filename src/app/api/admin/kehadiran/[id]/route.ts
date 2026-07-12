import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";

// Senarai kehadiran ahli bagi satu sesi perjumpaan.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;

  const sesi = await prisma.sesiKehadiran.findUnique({
    where: { id },
    include: {
      kehadiran: {
        include: { pelajar: { select: { nama: true, kelasT6: true } } },
        orderBy: { pelajar: { nama: "asc" } },
      },
    },
  });
  if (!sesi) return fail("Sesi tidak dijumpai", 404);

  return ok({
    namaUnit: sesi.namaUnit,
    jenisKoko: sesi.jenisKoko,
    bilPerjumpaan: sesi.bilPerjumpaan,
    tarikh: sesi.tarikh,
    disahkan: sesi.disahkan,
    ahli: sesi.kehadiran.map((k) => ({
      nama: k.pelajar.nama,
      kelas: k.pelajar.kelasT6,
      hadir: k.statusHadir,
    })),
  });
}
