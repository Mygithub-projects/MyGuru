import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { notifyPelajar } from "@/lib/notifikasi";
import { guruSeluruhSekolah, unitSeliaan, bolehGuruAksesPelajar } from "@/lib/workflow";

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
  const { guru } = auth;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const rec = await prisma.laporanMingguan.findUnique({ where: { id } });
  if (!rec) return fail("Laporan tidak dijumpai", 404);

  // Hanya guru penasihat unit berkenaan boleh sahkan (spec guru §1/§6).
  if (guru && !guruSeluruhSekolah(guru)) {
    const units = await unitSeliaan(guru);
    const okUnit = rec.namaUnit
      ? units.includes(rec.namaUnit)
      : await bolehGuruAksesPelajar(guru, rec.setiausahaId);
    if (!okUnit) return fail("Laporan ini di luar unit seliaan anda", 403);
  }

  const updated = await prisma.laporanMingguan.update({
    where: { id },
    data: { statusSemakan: parsed.data.status, komenGuru: parsed.data.komen },
  });
  await notifyPelajar(rec.setiausahaId, {
    tajuk: parsed.data.status === "Approved" ? "Laporan mingguan disahkan" : "Laporan dikuiri",
    mesej:
      parsed.data.status === "Approved"
        ? `Laporan "${rec.aktiviti}" telah disahkan.`
        : `Laporan "${rec.aktiviti}" perlu pembetulan.${parsed.data.komen ? " " + parsed.data.komen : ""}`,
    jenis: parsed.data.status === "Approved" ? "lulus" : "kuiri",
    pautan: "/pelajar/laporan",
  });
  return ok(updated, parsed.data.status === "Approved" ? "Laporan disahkan" : "Kuiri dihantar");
}
