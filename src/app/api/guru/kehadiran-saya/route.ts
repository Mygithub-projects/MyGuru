import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { isiKehadiranGuru } from "@/lib/kehadiran-guru";

const schema = z.object({
  sesiId: z.string().min(1),
  statusHadir: z.boolean(),
  catatan: z.string().max(500).optional().nullable(),
});

/** Guru isi kehadiran sendiri untuk satu perjumpaan unit seliaan. */
export async function POST(request: NextRequest) {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  if (!auth.guru) return fail("Hanya guru boleh mengisi kehadiran guru", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Format permintaan tidak sah", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  try {
    const rekod = await isiKehadiranGuru({ guruId: auth.guru.id, ...parsed.data });
    return ok(rekod, "Kehadiran dihantar untuk semakan Admin");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat", 409);
  }
}
