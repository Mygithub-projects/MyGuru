import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { notifyPelajar } from "@/lib/notifikasi";
import { labelPengesah } from "@/lib/pengesah";
import { guruSeluruhSekolah, unitUrus, bolehGuruUrusPelajar } from "@/lib/workflow";

const schema = z.object({
  status: z.enum(["Approved", "Kuiri"]),
  komen: z.string().trim().max(500).optional(),
}).refine((d) => d.status !== "Kuiri" || !!d.komen, { message: "Sila nyatakan sebab kuiri supaya SU/NSU tahu apa yang perlu dibetulkan" });

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

  const rec = await prisma.laporanMingguan.findUnique({ where: { id } });
  if (!rec) return fail("Laporan tidak dijumpai", 404);

  // Hanya guru penasihat unit berkenaan boleh sahkan (spec guru §1/§6).
  if (guru && !guruSeluruhSekolah(guru)) {
    const units = await unitUrus(guru);
    const okUnit = rec.namaUnit
      ? units.includes(rec.namaUnit)
      : await bolehGuruUrusPelajar(guru, rec.setiausahaId);
    if (!okUnit) return fail("Laporan ini di luar unit seliaan anda", 403);
  }

  const updated = await prisma.laporanMingguan.update({
    where: { id },
    data: {
      statusSemakan: parsed.data.status,
      ...(parsed.data.komen !== undefined ? { komenGuru: parsed.data.komen || null } : {}),
      // Rekod siapa mengesahkan (dipapar pada PDF); dikosongkan jika dikuiri.
      disahkanOleh: parsed.data.status === "Approved" ? labelPengesah(guru, session) : null,
      disahkanOlehId: parsed.data.status === "Approved" ? guru?.id ?? null : null,
      tarikhSahkan: parsed.data.status === "Approved" ? new Date() : null,
    },
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
