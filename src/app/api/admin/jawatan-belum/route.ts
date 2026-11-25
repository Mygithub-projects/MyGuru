import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole, ok, fail } from "@/lib/api";
import { hantarPeringatanJawatan } from "@/lib/jawatan-belum";

// POST /api/admin/jawatan-belum — maklumkan GKP & PGKP unit (semua atau unit dipilih)
// tentang ahli yang jawatan belum ditetapkan / butiran belum disahkan.
export async function POST(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const parsed = z
    .object({ namaUnit: z.array(z.string()).optional() })
    .safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Input tidak sah", 422);

  const r = await hantarPeringatanJawatan(parsed.data.namaUnit ?? null);
  if (r.bilGuru === 0) return fail("Tiada guru untuk dimaklumkan (unit tiada GKP/PGKP atau guru belum ada akaun).", 404, r);
  return ok(
    r,
    `Peringatan dihantar kepada ${r.bilGuru} guru bagi ${r.bilUnit} unit.` +
      (r.unitTanpaGuru ? ` ${r.unitTanpaGuru} unit tiada guru penasihat berdaftar.` : ""),
  );
}
