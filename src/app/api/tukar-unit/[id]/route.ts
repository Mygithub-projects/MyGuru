import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { prosesPertukaran, bolehGuruAksesPelajar } from "@/lib/workflow";

const schema = z.object({
  status: z.enum(["Approved", "Reject"]),
  sebab: z.string().max(500).optional(),
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
  try {
    body = await request.json();
  } catch {
    return fail("Format permintaan tidak sah", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const log = await prisma.logPertukaran.findUnique({ where: { id } });
  if (!log) return fail("Permohonan tidak dijumpai", 404);

  // Semakan skop seliaan untuk guru
  if (guru && !(await bolehGuruAksesPelajar(guru, log.pelajarId))) {
    return fail("Pelajar ini di luar unit seliaan anda", 403);
  }

  try {
    const result = await prosesPertukaran({
      logId: id,
      status: parsed.data.status,
      guruId: guru?.id ?? null,
      komen: parsed.data.sebab,
    });
    const msg =
      parsed.data.status === "Approved"
        ? "Pertukaran diluluskan — data T6 dikemas kini"
        : "Permohonan ditolak — pelajar dimaklumkan";
    return ok(result, msg);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat memproses", 400);
  }
}
