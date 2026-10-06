import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const program = await prisma.programECert.findUnique({
    where: { id },
    include: { peserta: { orderBy: { nama: "asc" } } },
  });
  if (!program) return fail("Program tidak dijumpai", 404);
  return ok(program);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const rec = await prisma.programECert.findUnique({ where: { id } });
  if (!rec) return fail("Program tidak dijumpai", 404);
  await prisma.programECert.delete({ where: { id } });
  return ok(null, "Program dipadam");
}
