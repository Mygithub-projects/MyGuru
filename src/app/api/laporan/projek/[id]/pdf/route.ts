import { getSession } from "@/lib/auth";
import { fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { pdfProjekDisahkan } from "@/lib/laporan-disahkan";
import { guruSeluruhSekolah, unitSeliaan, bolehGuruAksesPelajar } from "@/lib/workflow";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return fail("Tidak dibenarkan", 401);

  const rec = await prisma.laporanProjek.findUnique({
    where: { id },
    include: { setiausaha: { select: { nama: true } }, projek: { select: { units: true } } },
  });
  if (!rec) return fail("Laporan projek tidak dijumpai", 404);
  if (rec.statusPengesahan !== "Approved") return fail("Hanya laporan yang telah disahkan boleh dimuat turun", 403);

  if (session.role === "Pelajar") {
    if (session.pelajarId !== rec.setiausahaId) return fail("Akses ditolak", 403);
  } else if (session.role === "Guru") {
    const guru = session.guruId ? await prisma.guru.findUnique({ where: { id: session.guruId } }) : null;
    if (!guru) return fail("Profil guru tidak dijumpai", 403);
    if (!guruSeluruhSekolah(guru)) {
      const seliaan = await unitSeliaan(guru);
      const okUnit =
        (rec.projek?.units ?? []).some((u) => seliaan.includes(u)) ||
        (rec.namaUnit ? seliaan.includes(rec.namaUnit) : await bolehGuruAksesPelajar(guru, rec.setiausahaId));
      if (!okUnit) return fail("Laporan ini di luar unit seliaan anda", 403);
    }
  }

  // Dokumen disahkan dalam format OPR (OPR asal dicop pengesahan, atau dijana dari rekod).
  const pdf = await pdfProjekDisahkan(rec);

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="LaporanProjek-${id}.pdf"`,
    },
  });
}
