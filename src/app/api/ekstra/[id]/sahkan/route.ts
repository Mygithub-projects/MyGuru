import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { sahkanPencapaian } from "@/lib/workflow";
import { ANUGERAH_KHAS, JAWATAN_SAHKAN_EKSTRA } from "@/lib/enums";

const schema = z.object({
  status: z.enum(["Approved", "Kuiri"]),
  perkara: z.string().max(200).optional(),
  komen: z.string().max(500).optional(),
});

// PATCH /api/ekstra/[id]/sahkan — HANYA Ketua Unit Kokurikulum (atau Admin).
// Lulus: pilih perkara Anugerah Khas → markah = skor perkara itu; markah ekstra
// pelajar dikira semula (MAX jawatan Unit Perkhidmatan / anugerah, had 10).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;
  if (guru && !JAWATAN_SAHKAN_EKSTRA.includes(guru.jawatanKoko)) {
    return fail("Ekstra Kurikulum hanya boleh disahkan oleh Ketua Unit Kokurikulum", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Format permintaan tidak sah", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);
  const { status, perkara, komen } = parsed.data;

  const rec = await prisma.pencapaian.findUnique({ where: { id } });
  if (!rec || rec.kategori !== "ekstra") return fail("Rekod Ekstra Kurikulum tidak dijumpai", 404);

  let markah = 0;
  if (status === "Approved") {
    const pilihan = ANUGERAH_KHAS.find((a) => a.perkara === perkara);
    if (!pilihan) return fail("Pilih perkara Anugerah Khas untuk menetapkan markah", 422);
    markah = pilihan.skor;
  } else if (!komen?.trim()) {
    return fail("Nyatakan sebab kuiri", 422);
  }

  await prisma.pencapaian.update({
    where: { id },
    data: { perkaraEkstra: status === "Approved" ? perkara : null },
  });
  try {
    const result = await sahkanPencapaian({ pencapaianId: id, status, markah, komen, pengesahId: guru?.id ?? null });
    return ok(result, status === "Approved" ? `Disahkan — ${markah} markah ekstra` : "Kuiri dihantar kepada pelajar");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat memproses", 400);
  }
}
