import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole, ok, fail } from "@/lib/api";
import { selfCheckIn } from "@/lib/kehadiran";

const schema = z.object({ token: z.string().min(4) });

export async function POST(request: NextRequest) {
  const auth = await requireRole("Pelajar");
  if ("response" in auth) return auth.response;
  const { session } = auth;
  if (!session.pelajarId) return fail("Profil pelajar tidak dijumpai", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Format permintaan tidak sah", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Token tidak sah", 422);

  try {
    const sesi = await selfCheckIn(parsed.data.token, session.pelajarId);
    return ok(sesi, `Kehadiran direkod untuk ${sesi.namaUnit} (perjumpaan ${sesi.bilPerjumpaan})`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat", 400);
  }
}
