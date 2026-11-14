import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { kohortDipilih } from "@/lib/kohort-pilihan";
import { schemaProgram } from "@/lib/program-kolej";

// POST: Admin cipta Program Kolej (kohort dipilih di header).
export async function POST(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schemaProgram.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);
  const { nama, tarikh, peringkat } = parsed.data;
  const t = tarikh ? new Date(tarikh) : null;
  if (t && isNaN(t.getTime())) return fail("Tarikh tidak sah", 422);

  const rec = await prisma.programKolej.create({
    data: { nama, peringkat, tarikh: t, kohort: (await kohortDipilih()) ?? "", dibuatOleh: auth.session.nama },
  });
  return ok(rec, "Program dicipta", 201);
}
