import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fail } from "@/lib/api";
import { janaECertPDF } from "@/lib/pdf";
import { getTetapanSijil } from "@/lib/tetapan-sijil";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; aktivitiId: string }> }
) {
  const { id, aktivitiId } = await params;
  const session = await getSession();
  if (!session) return fail("Tidak dibenarkan", 401);
  // Pelajar hanya untuk diri sendiri; Guru/Admin boleh.
  if (session.role === "Pelajar" && session.pelajarId !== id) return fail("Akses ditolak", 403);

  const aktiviti = await prisma.aktivitiLuar.findUnique({
    where: { id: aktivitiId },
    include: { pelajar: true },
  });
  if (!aktiviti || aktiviti.pelajarId !== id) return fail("Aktiviti tidak dijumpai", 404);
  if (aktiviti.statusPengesahan !== "Approved") {
    return fail("e-Cert hanya tersedia selepas aktiviti disahkan (Approved)", 403);
  }
  if (!aktiviti.noSiriECert) return fail("No. Siri e-Cert belum dijana", 409);

  const tetapan = await getTetapanSijil();
  const pdf = await janaECertPDF({
    nama: aktiviti.pelajar.nama,
    noIc: aktiviti.pelajar.noIc,
    kelas: aktiviti.pelajar.kelasT6 ?? "-",
    namaAktiviti: aktiviti.namaAktiviti,
    peringkat: aktiviti.peringkat,
    markah: aktiviti.markahLuar,
    tarikh: (aktiviti.tarikhJanaECert ?? new Date()).toLocaleDateString("ms-MY"),
    noSiri: aktiviti.noSiriECert,
    ...tetapan,
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="eCert-${aktiviti.noSiriECert.replace(/\//g, "-")}.pdf"`,
    },
  });
}
