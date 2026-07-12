import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { prosesCadanganJawatan, bolehGuruAksesPelajar } from "@/lib/workflow";

const schema = z.object({
  status: z.enum(["Approved", "Reject"]),
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

  const c = await prisma.cadanganJawatan.findUnique({ where: { id } });
  if (!c) return fail("Cadangan tidak dijumpai", 404);
  if (guru && !(await bolehGuruAksesPelajar(guru, c.pelajarId))) {
    return fail("Pelajar ini di luar unit seliaan anda", 403);
  }

  try {
    const result = await prosesCadanganJawatan({
      id,
      status: parsed.data.status,
      guruId: guru?.id ?? null,
      komen: parsed.data.komen,
    });
    return ok(
      result,
      parsed.data.status === "Approved" ? "Jawatan disahkan & markah dikira" : "Cadangan ditolak"
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat", 400);
  }
}
