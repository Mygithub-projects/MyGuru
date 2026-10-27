import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession, ok, fail } from "@/lib/api";
import { daftarUnitPelajar } from "@/lib/had-unit";

const schema = z.object({
  Sukan: z.string().max(120).optional(),
  Kelab: z.string().max(120).optional(),
  Uniform: z.string().max(120).optional(),
});

// POST /api/pelajar/[id]/daftar-unit — pendaftaran SP/KP/BU sekali gus,
// terus berkuat kuasa selagi unit belum mencapai had ahli kohort pelajar.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;
  if (session.role === "Guru") return fail("Hanya pelajar boleh mendaftar unit", 403);
  if (session.role === "Pelajar" && session.pelajarId !== id) {
    return fail("Anda hanya boleh mendaftar untuk akaun sendiri", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Format permintaan tidak sah", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  try {
    const hasil = await daftarUnitPelajar(id, parsed.data);
    return ok(hasil, "Pendaftaran berjaya. Unit anda telah direkodkan.", 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat pendaftaran", 409);
  }
}
