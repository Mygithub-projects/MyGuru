import { getSession } from "@/lib/auth";
import { fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/locale";
import { janaButiranPDF } from "@/lib/pdf";
import { dataRumusan } from "@/lib/rumusan";

// GET /api/pelajar/[id]/butiran-diri — PDF Rekod Pentaksiran Kokurikulum (PAJSK),
// susun atur & data sama dengan Slip PAJSK di papan pemuka pelajar.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const muatTurun = new URL(request.url).searchParams.get("download") === "1";
  const session = await getSession();
  if (!session) return fail("Tidak dibenarkan", 401);
  if (session.role === "Pelajar" && session.pelajarId !== id) return fail("Akses ditolak", 403);

  const pelajar = await prisma.pelajar.findUnique({
    where: { id },
    select: {
      nama: true, noIc: true, kelasT6: true, markahPajskT6: true, gredPajskT6: true,
      markahEkstra: true, statusButiran: true,
    },
  });
  if (!pelajar) return fail("Pelajar tidak dijumpai", 404);
  const [rows, locale] = await Promise.all([dataRumusan({ pelajarId: id }), getLocale()]);

  const pdf = await janaButiranPDF({
    locale,
    nama: pelajar.nama,
    noIc: pelajar.noIc,
    kelas: pelajar.kelasT6 ?? "-",
    rows,
    markahT6: pelajar.markahPajskT6,
    gred: pelajar.gredPajskT6,
    markahEkstra: pelajar.markahEkstra,
    disahkan: pelajar.statusButiran === "Approved",
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${muatTurun ? "attachment" : "inline"}; filename="ButiranDiri-${pelajar.noIc}.pdf"`,
    },
  });
}
