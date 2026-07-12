import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";

export async function GET() {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const items = await prisma.tetapanMarkah.findMany({ orderBy: [{ kategori: "asc" }, { nilaiMarkah: "desc" }] });
  return ok(items);
}

const schema = z.object({
  items: z.array(z.object({ id: z.string(), nilaiMarkah: z.number().min(0).max(200) })),
});

export async function PUT(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Input tidak sah", 422);

  for (const it of parsed.data.items) {
    await prisma.tetapanMarkah.update({ where: { id: it.id }, data: { nilaiMarkah: it.nilaiMarkah } });
  }
  return ok(null, "Tetapan formula markah dikemas kini");
}
