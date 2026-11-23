import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { semakKehadiranGuru } from "@/lib/kehadiran-guru";
import { prisma } from "@/lib/prisma";
import { JAWATAN_SAHKAN_KEHADIRAN_GURU } from "@/lib/enums";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  status: z.enum(["Approved", "Rejected"]),
  komen: z.string().max(500).optional().nullable(),
});

/** HANYA Ketua Unit Koko, KUPP/Pemantau & Penyelaras sahkan / tolak kehadiran guru (satu atau pukal). */
export async function PATCH(request: NextRequest) {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;
  if (!guru || !JAWATAN_SAHKAN_KEHADIRAN_GURU.includes(guru.jawatanKoko)) {
    return fail("Hanya Ketua Unit Kokurikulum, KUPP dan Penyelaras Kokurikulum boleh mengesahkan kehadiran guru", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Format permintaan tidak sah", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);
  if (parsed.data.status === "Rejected" && !parsed.data.komen?.trim()) return fail("Sila nyatakan sebab penolakan", 422);
  // Tidak boleh mengesahkan kehadiran sendiri.
  const sendiri = await prisma.kehadiranGuru.count({ where: { id: { in: parsed.data.ids }, guruId: guru.id } });
  if (sendiri > 0) return fail("Anda tidak boleh mengesahkan kehadiran anda sendiri", 403);

  const r = await semakKehadiranGuru({ ...parsed.data, adminUserId: auth.session.userId });
  return ok(r, parsed.data.status === "Approved" ? "Kehadiran guru disahkan" : "Kehadiran guru ditolak");
}
