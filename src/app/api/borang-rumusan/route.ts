import type { NextRequest } from "next/server";
import { requireGuruOrAdmin, fail } from "@/lib/api";
import { guruSeluruhSekolah, unitSeliaan } from "@/lib/workflow";
import { eksportBorangRumusan } from "@/lib/rumusan";

/**
 * Borang Rumusan Markah bagi SATU unit (Excel). Guru penasihat hanya untuk
 * unit seliaan sendiri; Admin & guru seluruh sekolah untuk mana-mana unit.
 */
export async function GET(request: NextRequest) {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;

  const unit = request.nextUrl.searchParams.get("unit")?.trim();
  if (!unit) return fail("Parameter unit diperlukan", 422);
  if (guru && !guruSeluruhSekolah(guru) && !(await unitSeliaan(guru)).includes(unit)) {
    return fail("Unit ini di luar seliaan anda", 403);
  }

  const xlsx = await eksportBorangRumusan({ units: [unit] });
  const namaFail = `borang-rumusan-${unit.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase()}.xlsx`;
  return new Response(new Uint8Array(xlsx), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${namaFail}"`,
    },
  });
}
