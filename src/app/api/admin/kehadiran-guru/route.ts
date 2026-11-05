import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole, ok, fail } from "@/lib/api";
import { semakKehadiranGuru } from "@/lib/kehadiran-guru";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  status: z.enum(["Approved", "Rejected"]),
  komen: z.string().max(500).optional().nullable(),
});

/** Admin sahkan / tolak rekod kehadiran guru (satu atau pukal). */
export async function PATCH(request: NextRequest) {
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
  if (parsed.data.status === "Rejected" && !parsed.data.komen?.trim()) return fail("Sila nyatakan sebab penolakan", 422);

  const r = await semakKehadiranGuru({ ...parsed.data, adminUserId: auth.session.userId });
  return ok(r, parsed.data.status === "Approved" ? "Kehadiran guru disahkan" : "Kehadiran guru ditolak");
}
