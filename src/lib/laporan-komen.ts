// Guru/Admin tulis atau ubah komen pada laporan SU/NSU tanpa mengubah status
// (boleh sebelum atau selepas disahkan; komen dipapar pada PDF laporan).
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { notifyPelajar } from "@/lib/notifikasi";
import { guruSeluruhSekolah, unitUrus, bolehGuruUrusPelajar } from "@/lib/workflow";

const schema = z.object({ komen: z.string().max(500) });

export async function kemaskiniKomenLaporan(request: NextRequest, jenis: "mingguan" | "projek", id: string) {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);
  const komen = parsed.data.komen.trim() || null;

  const rec =
    jenis === "mingguan"
      ? await prisma.laporanMingguan.findUnique({ where: { id }, select: { namaUnit: true, setiausahaId: true, statusSemakan: true } })
          .then((r) => r && { ...r, tajuk: "laporan mingguan", status: r.statusSemakan, unitProjek: [] as string[] })
      : await prisma.laporanProjek.findUnique({
          where: { id },
          select: { namaUnit: true, setiausahaId: true, statusPengesahan: true, namaProjek: true, projek: { select: { units: true } } },
        }).then((r) => r && { ...r, tajuk: `projek "${r.namaProjek}"`, status: r.statusPengesahan, unitProjek: r.projek?.units ?? [] });
  if (!rec) return fail("Laporan tidak dijumpai", 404);
  if (rec.status === "Draft") return fail("Laporan draf belum dihantar", 400);

  // Skop sama seperti sahkan: guru penasihat unit berkenaan sahaja.
  if (guru && !guruSeluruhSekolah(guru)) {
    const units = await unitUrus(guru);
    const okUnit =
      rec.unitProjek.some((u) => units.includes(u)) ||
      (rec.namaUnit ? units.includes(rec.namaUnit) : await bolehGuruUrusPelajar(guru, rec.setiausahaId));
    if (!okUnit) return fail("Laporan ini di luar unit seliaan anda", 403);
  }

  if (jenis === "mingguan") await prisma.laporanMingguan.update({ where: { id }, data: { komenGuru: komen } });
  else await prisma.laporanProjek.update({ where: { id }, data: { komenGuru: komen } });

  if (komen) {
    await notifyPelajar(rec.setiausahaId, {
      tajuk: "Komen guru pada laporan",
      mesej: `Guru telah memberi komen pada ${rec.tajuk}: ${komen}`,
      pautan: "/pelajar/laporan",
    });
  }
  return ok({ komen }, "Komen disimpan");
}
