import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole, ok, fail } from "@/lib/api";
import { aktifkanSemulaKohort, ciptaKohort, tamatkanKohort, ubahTarikhMula } from "@/lib/kohort-urus";

const tarikh = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarikh tidak sah");

// POST /api/admin/kohort — daftar kohort baharu (cth pengambilan bulan ke-8).
export async function POST(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const parsed = z.object({ nama: z.string(), tarikhMula: tarikh }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);
  try {
    const k = await ciptaKohort(parsed.data.nama, new Date(parsed.data.tarikhMula));
    return ok(k, `Kohort ${k.nama} didaftarkan.`, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat", 409);
  }
}

const tindakan = z.discriminatedUnion("tindakan", [
  z.object({ tindakan: z.literal("tarikh"), nama: z.string(), tarikhMula: tarikh }),
  z.object({ tindakan: z.literal("tamat"), nama: z.string() }),
  z.object({ tindakan: z.literal("aktif"), nama: z.string() }),
]);

// PATCH /api/admin/kohort — ubah tarikh mula, tamatkan (arkib) atau aktifkan semula.
export async function PATCH(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const parsed = tindakan.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);
  const d = parsed.data;
  try {
    if (d.tindakan === "tarikh") {
      await ubahTarikhMula(d.nama, new Date(d.tarikhMula));
      return ok({ nama: d.nama }, `Tarikh mula ${d.nama} dikemas kini.`);
    }
    if (d.tindakan === "tamat") {
      const n = await tamatkanKohort(d.nama);
      return ok({ nama: d.nama, n }, `Kohort ${d.nama} ditamatkan & diarkib — ${n} pelajar dinyahaktif.`);
    }
    const n = await aktifkanSemulaKohort(d.nama);
    return ok({ nama: d.nama, n }, `Kohort ${d.nama} diaktifkan semula — ${n} pelajar.`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat", 400);
  }
}
