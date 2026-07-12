import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { sahkanAktivitiLuar, bolehGuruAksesPelajar } from "@/lib/workflow";

const schema = z.object({
  status: z.enum(["Approved", "Kuiri"]),
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
  try {
    body = await request.json();
  } catch {
    return fail("Format permintaan tidak sah", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const rec = await prisma.aktivitiLuar.findUnique({ where: { id } });
  if (!rec) return fail("Aktiviti luar tidak dijumpai", 404);
  if (guru && !(await bolehGuruAksesPelajar(guru, rec.pelajarId))) {
    return fail("Pelajar ini di luar unit seliaan anda", 403);
  }

  try {
    const result = await sahkanAktivitiLuar({
      aktivitiId: id,
      status: parsed.data.status,
      komen: parsed.data.komen,
    });
    return ok(
      result,
      parsed.data.status === "Approved"
        ? `Disahkan — markah ${result.markahLuar} ditambah, e-Cert diaktifkan (${result.noSiriECert})`
        : "Kuiri dihantar"
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat memproses", 400);
  }
}
