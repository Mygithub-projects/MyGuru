// src/app/api/agent/cadangan/[id]/route.ts
// Proses satu cadangan agent (luluskan / tolak). Guru/Admin sahaja, dengan
// semakan skop seliaan. Approve mencetus tindakan hiliran sebenar.

import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { bolehGuruAksesPelajar } from "@/lib/workflow";
import { prisma } from "@/lib/prisma";
import { prosesCadanganAgent, pelajarIdRujukan } from "@/lib/agent/approval";

export const runtime = "nodejs";

const schema = z.object({
  tindakan: z.enum(["Approve", "Reject"]),
  komen: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { session, guru } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Format permintaan tidak sah", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const cadangan = await prisma.cadanganAgent.findUnique({ where: { id } });
  if (!cadangan) return fail("Cadangan tidak dijumpai", 404);

  // Skop: guru hanya boleh proses cadangan bagi pelajar dalam unit seliaannya.
  if (guru) {
    const pelajarId = await pelajarIdRujukan(cadangan);
    if (pelajarId && !(await bolehGuruAksesPelajar(guru, pelajarId))) {
      return fail("Cadangan ini di luar unit seliaan anda", 403);
    }
  }

  try {
    const result = await prosesCadanganAgent({
      id,
      tindakan: parsed.data.tindakan,
      diprosesOleh: session.userId,
      guruId: guru?.id ?? null,
      komen: parsed.data.komen,
    });
    return ok(
      result,
      parsed.data.tindakan === "Approve" ? `Cadangan diluluskan — ${result.hasil}` : "Cadangan ditolak"
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat memproses cadangan", 400);
  }
}
