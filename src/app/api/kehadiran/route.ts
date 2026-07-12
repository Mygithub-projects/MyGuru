import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession, ok, fail } from "@/lib/api";
import { tandaKehadiran } from "@/lib/kehadiran";

const schema = z.object({
  sesiId: z.string(),
  tanda: z.array(z.object({ pelajarId: z.string(), hadir: z.boolean() })).min(1),
});

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const boleh =
    session.role === "Admin" ||
    (session.role === "Pelajar" && (session.subRole === "SU" || session.subRole === "NSU"));
  if (!boleh) return fail("Hanya Setiausaha/Naib SU atau Admin boleh menanda kehadiran", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Format permintaan tidak sah", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  try {
    await tandaKehadiran(parsed.data.sesiId, parsed.data.tanda, session.pelajarId ?? undefined);
    return ok(null, "Kehadiran disimpan & markah dikira");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat", 400);
  }
}
