import { getSession } from "@/lib/auth";
import { fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { janaLaporanPDF } from "@/lib/pdf";
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
    include: { setiausaha: { select: { nama: true } } },
  });
  if (!rec) return fail("Laporan projek tidak dijumpai", 404);
  if (rec.statusPengesahan !== "Approved") return fail("Hanya laporan yang telah disahkan boleh dimuat turun", 403);

  if (session.role === "Pelajar") {
    if (session.pelajarId !== rec.setiausahaId) return fail("Akses ditolak", 403);
  } else if (session.role === "Guru") {
    const guru = session.guruId ? await prisma.guru.findUnique({ where: { id: session.guruId } }) : null;
    if (!guru) return fail("Profil guru tidak dijumpai", 403);
    if (!guruSeluruhSekolah(guru)) {
      const okUnit = rec.namaUnit
        ? (await unitSeliaan(guru)).includes(rec.namaUnit)
        : await bolehGuruAksesPelajar(guru, rec.setiausahaId);
      if (!okUnit) return fail("Laporan ini di luar unit seliaan anda", 403);
    }
  }

  const pdf = await janaLaporanPDF({
    jenis: "Projek",
    tajuk: rec.namaProjek,
    namaUnit: rec.namaUnit,
    jenisKoko: rec.jenisKoko,
    tarikh: null,
    setiausaha: rec.setiausaha.nama,
    status: rec.statusPengesahan,
    baris: [
      { label: "Kewangan", nilai: rec.kewangan ?? "-" },
      { label: "Kekuatan", nilai: rec.kekuatan ?? "-" },
      { label: "Kelemahan / Penambahbaikan", nilai: rec.kelemahan ?? "-" },
      { label: "Lampiran", nilai: [rec.failKertasKerja ? "Kertas kerja" : null, rec.failLaporanImpak ? "Laporan impak" : null].filter(Boolean).join(", ") || "-" },
      { label: "Komen Guru", nilai: rec.komenGuru ?? "-" },
    ],
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="LaporanProjek-${id}.pdf"`,
    },
  });
}
