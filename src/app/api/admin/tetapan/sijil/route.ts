import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { getTetapanSijil } from "@/lib/tetapan-sijil";

export async function GET() {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  return ok(await getTetapanSijil());
}

const schema = z.object({
  institusi: z.string().min(2).max(120),
  tajukSijil: z.string().min(2).max(120),
  namaPenandatangan: z.string().max(120),
  jawatanPenandatangan: z.string().max(120),
  teksCop: z.string().max(120),
});

export async function PUT(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  await prisma.tetapanSijil.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });
  return ok(null, "Templat sijil dikemas kini");
}
