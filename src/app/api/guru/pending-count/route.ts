import { requireGuruOrAdmin, ok } from "@/lib/api";
import { countPendingGuru } from "@/lib/guru";

export async function GET() {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  // guru = rekod Guru (skop unit) atau null untuk Admin (seluruh sekolah)
  const count = await countPendingGuru(auth.guru);
  return ok({ count });
}
