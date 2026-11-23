import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { unitBolehSahkan } from "@/lib/workflow";
import { sahkanAktivitiUnit } from "@/lib/aktiviti-unit";

const schema = z.object({
  status: z.enum(["Approved", "Kuiri"]),
  komen: z.string().max(500).optional(),
});

// PATCH: HANYA Ketua GP / Penolong Ketua GP unit SU boleh mengesahkan.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;
  if (!guru) return fail("Hanya Ketua GP / Penolong Ketua GP unit boleh mengesahkan", 403);

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format permintaan tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const a = await prisma.aktivitiUnit.findUnique({ where: { id }, select: { namaUnit: true } });
  if (!a) return fail("Aktiviti tidak dijumpai", 404);
  if (!(await unitBolehSahkan(guru)).includes(a.namaUnit)) {
    return fail("Hanya Ketua GP / Penolong Ketua GP unit ini boleh mengesahkan", 403);
  }

  try {
    const r = await sahkanAktivitiUnit({ aktivitiId: id, guruId: guru.id, ...parsed.data });
    return ok(r, parsed.data.status === "Approved" ? `Disahkan — markah ${r.peserta} peserta dikira` : "Kuiri dihantar kepada SU/NSU");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat memproses", 400);
  }
}
