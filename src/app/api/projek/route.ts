import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { guruSeluruhSekolah, unitSeliaan } from "@/lib/workflow";
import { kohortDipilih } from "@/lib/kohort-pilihan";

const schema = z.object({
  nama: z.string().trim().min(1, "Nama projek diperlukan").max(200),
  units: z.array(z.string().trim().min(1).max(200)).min(1, "Pilih sekurang-kurangnya satu unit").max(40),
});

// POST: guru penasihat / Admin cipta projek (boleh merentas pelbagai unit).
// Guru biasa mesti memasukkan sekurang-kurangnya satu unit seliaannya.
export async function POST(request: NextRequest) {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru, session } = auth;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);
  const units = [...new Set(parsed.data.units)];

  if (guru && !guruSeluruhSekolah(guru)) {
    const seliaan = await unitSeliaan(guru);
    if (!units.some((u) => seliaan.includes(u)))
      return fail("Projek mesti melibatkan sekurang-kurangnya satu unit seliaan anda", 403);
  }

  const kohort = (await kohortDipilih()) ?? "";
  const rec = await prisma.projek.create({
    data: { nama: parsed.data.nama, units, kohort, dibuatOlehId: session.userId, dibuatOleh: session.nama },
  });
  return ok(rec, "Projek dicipta", 201);
}
