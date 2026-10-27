import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole, ok, fail } from "@/lib/api";
import { JENIS_DAFTAR, simpanHad } from "@/lib/had-unit";
import { normalKohort } from "@/lib/kohort";

const schema = z.object({
  kohort: z.string(),
  had: z.array(
    z.object({
      jenisKoko: z.enum(JENIS_DAFTAR),
      namaUnit: z.string().min(1).max(120),
      had: z.number().int().min(0).max(1000).nullable(),
    }),
  ),
});

// PUT /api/admin/had-unit — simpan had ahli setiap unit SP/KP/BU bagi satu kohort.
export async function PUT(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Format permintaan tidak sah", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);
  const kohort = normalKohort(parsed.data.kohort);
  if (!kohort) return fail("Kohort tidak sah — gunakan format STPM 2028", 422);

  await simpanHad(kohort, parsed.data.had);
  return ok({ kohort }, `Had ahli unit bagi ${kohort} disimpan.`);
}
