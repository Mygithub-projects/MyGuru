import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { JANTINA, KAUM, AGAMA } from "@/lib/enums";

const schema = z.object({
  jantina: z.enum(JANTINA).nullish(),
  kaum: z.enum(KAUM).nullish(),
  agama: z.enum(AGAMA).nullish(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Input tidak sah", 422);

  const updated = await prisma.pelajar.update({
    where: { id },
    data: {
      jantina: parsed.data.jantina ?? undefined,
      kaum: parsed.data.kaum ?? undefined,
      agama: parsed.data.agama ?? undefined,
    },
  });
  return ok({ id: updated.id }, "Demografi dikemas kini");
}
