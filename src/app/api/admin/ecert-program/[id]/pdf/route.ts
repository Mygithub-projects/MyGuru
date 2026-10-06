import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, fail } from "@/lib/api";
import { janaECertProgramPDF } from "@/lib/pdf";
import { getTetapanSijil } from "@/lib/tetapan-sijil";

// Satu PDF berbilang halaman — satu e-Cert bagi setiap peserta.
// ?peserta=<id> untuk jana sijil seorang peserta sahaja.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const pesertaId = request.nextUrl.searchParams.get("peserta");

  const program = await prisma.programECert.findUnique({
    where: { id },
    include: {
      peserta: {
        where: pesertaId ? { id: pesertaId } : undefined,
        orderBy: { nama: "asc" },
      },
    },
  });
  if (!program) return fail("Program tidak dijumpai", 404);
  if (program.peserta.length === 0) return fail("Tiada peserta dalam program ini", 409);

  const tetapan = await getTetapanSijil();
  const pdf = await janaECertProgramPDF({
    namaProgram: program.namaProgram,
    peringkat: program.peringkat,
    tarikh: program.tarikh.toLocaleDateString("ms-MY"),
    tempat: program.tempat,
    peserta: program.peserta,
    ...tetapan,
    // Penandatangan khusus program mengatasi Templat e-Cert.
    namaPenandatangan: program.namaPenandatangan ?? tetapan.namaPenandatangan,
    jawatanPenandatangan: program.jawatanPenandatangan ?? tetapan.jawatanPenandatangan,
  });

  const fail_ = program.namaProgram.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "program";
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="eCert-${fail_}.pdf"`,
    },
  });
}
