import { getSession } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return fail("Tiada sesi", 401);
  return ok({
    userId: session.userId,
    role: session.role,
    subRole: session.subRole ?? null,
    nama: session.nama,
    pelajarId: session.pelajarId ?? null,
    guruId: session.guruId ?? null,
    jawatanGuru: session.jawatanGuru ?? null,
  });
}
