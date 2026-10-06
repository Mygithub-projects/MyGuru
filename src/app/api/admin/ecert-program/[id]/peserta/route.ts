import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { tambahPeserta } from "@/lib/ecert-program";

const tambahSchema = z.object({
  noKp: z.array(z.string().min(6).max(20)).min(1).max(500),
  peranan: z.string().trim().min(2).max(60).default("Peserta"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = tambahSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  try {
    const r = await tambahPeserta(id, parsed.data.noKp, parsed.data.peranan);
    return ok(r, `${r.ditambah} peserta ditambah`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat menambah peserta", 400);
  }
}

const padamSchema = z.object({ pesertaId: z.array(z.string()).min(1).max(500) });

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = padamSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const r = await prisma.pesertaProgram.deleteMany({
    where: { programId: id, id: { in: parsed.data.pesertaId } },
  });
  return ok({ dipadam: r.count }, `${r.count} peserta dibuang`);
}
