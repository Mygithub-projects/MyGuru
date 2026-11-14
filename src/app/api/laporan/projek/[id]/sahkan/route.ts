import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { notifyPelajar } from "@/lib/notifikasi";
import { labelPengesah } from "@/lib/pengesah";
import { guruSeluruhSekolah, unitSeliaan, bolehGuruAksesPelajar, kiraSemulaT6 } from "@/lib/workflow";

const schema = z.object({
  status: z.enum(["Approved", "Kuiri"]),
  komen: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru, session } = auth;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const rec = await prisma.laporanProjek.findUnique({
    where: { id },
    include: { projek: { select: { units: true } }, peserta: { select: { pelajarId: true } } },
  });
  if (!rec) return fail("Projek tidak dijumpai", 404);

  // Hanya guru penasihat unit berkenaan boleh sahkan (spec guru §1/§6).
  if (guru && !guruSeluruhSekolah(guru)) {
    const units = await unitSeliaan(guru);
    // Projek pelbagai unit: guru penasihat mana-mana unit terlibat boleh mengesahkan.
    const okUnit =
      (rec.projek?.units ?? []).some((u) => units.includes(u)) ||
      (rec.namaUnit ? units.includes(rec.namaUnit) : await bolehGuruAksesPelajar(guru, rec.setiausahaId));
    if (!okUnit) return fail("Laporan projek ini di luar unit seliaan anda", 403);
  }

  const updated = await prisma.laporanProjek.update({
    where: { id },
    data: {
      statusPengesahan: parsed.data.status,
      komenGuru: parsed.data.komen,
      // Rekod siapa mengesahkan (dipapar pada PDF); dikosongkan jika dikuiri.
      disahkanOleh: parsed.data.status === "Approved" ? labelPengesah(guru, session) : null,
      tarikhSahkan: parsed.data.status === "Approved" ? new Date() : null,
    },
  });
  await kiraSemulaT6(rec.setiausahaId);
  // Markah projek peserta (jawatan + peringkat) — dikira semula sama ada diluluskan atau dikuiri.
  for (const p of rec.peserta) await kiraSemulaT6(p.pelajarId);
  if (parsed.data.status === "Approved") {
    for (const p of rec.peserta) {
      await notifyPelajar(p.pelajarId, {
        tajuk: "Markah projek dikemas kini",
        mesej: `Penyertaan anda dalam projek "${rec.namaProjek}" telah disahkan.`,
        jenis: "lulus",
        pautan: "/pelajar",
      });
    }
  }
  await notifyPelajar(rec.setiausahaId, {
    tajuk: parsed.data.status === "Approved" ? "Laporan projek disahkan" : "Projek dikuiri",
    mesej:
      parsed.data.status === "Approved"
        ? `Projek "${rec.namaProjek}" telah disahkan.`
        : `Projek "${rec.namaProjek}" perlu pembetulan.${parsed.data.komen ? " " + parsed.data.komen : ""}`,
    jenis: parsed.data.status === "Approved" ? "lulus" : "kuiri",
    pautan: "/pelajar/laporan",
  });
  return ok(updated, parsed.data.status === "Approved" ? "Projek disahkan" : "Kuiri dihantar");
}
