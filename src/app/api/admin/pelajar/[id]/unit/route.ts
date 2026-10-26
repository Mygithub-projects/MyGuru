// Kemas kini penempatan unit pelajar (satu bahagian) — Admin SAHAJA.
// Guru tidak boleh menukar penempatan; mereka hanya mengurus ahli unit sendiri.
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { JENIS_KOKO } from "@/lib/enums";
import { senaraiUnit } from "@/lib/unit-list";
import { tetapkanUnitOlehAdmin } from "@/lib/workflow";

const schema = z.object({
  jenisKoko: z.enum(JENIS_KOKO),
  unitBaru: z.string().trim().min(1).max(120).nullable(),
  sebab: z.string().trim().max(300).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);
  const d = parsed.data;

  const pelajar = await prisma.pelajar.findUnique({ where: { id }, select: { id: true } });
  if (!pelajar) return fail("Pelajar tidak dijumpai", 404);

  // Hanya unit dalam senarai rasmi bahagian berkenaan.
  if (d.unitBaru && !(await senaraiUnit())[d.jenisKoko].includes(d.unitBaru)) {
    return fail(`Unit "${d.unitBaru}" tiada dalam senarai rasmi ${d.jenisKoko}`, 422);
  }

  try {
    const hasil = await tetapkanUnitOlehAdmin({ pelajarId: id, ...d });
    return ok(hasil, "Penempatan unit dikemas kini");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat mengemas kini unit", 400);
  }
}
