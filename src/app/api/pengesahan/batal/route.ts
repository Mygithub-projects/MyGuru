import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { JENIS_BATAL, batalPengesahan } from "@/lib/batal-pengesahan";

const schema = z.object({
  jenis: z.enum(JENIS_BATAL),
  id: z.string().min(1),
  sebab: z.string().trim().min(1, "Nyatakan sebab pembatalan").max(500),
});

// POST /api/pengesahan/batal — kembalikan rekod disahkan kepada "Pending".
// Dibenarkan: guru yang mengesahkan, Ketua Unit Kokurikulum, Admin.
export async function POST(request: NextRequest) {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format permintaan tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  try {
    const mesej = await batalPengesahan(
      { guru: auth.guru, userId: auth.session.userId },
      parsed.data.jenis, parsed.data.id, parsed.data.sebab,
    );
    return ok({ id: parsed.data.id }, mesej);
  } catch (e) {
    const m = e instanceof Error ? e.message : "Ralat memproses";
    return fail(m, m.startsWith("Hanya") ? 403 : 400);
  }
}
