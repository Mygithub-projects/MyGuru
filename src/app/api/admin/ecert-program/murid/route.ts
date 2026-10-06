import type { NextRequest } from "next/server";
import { requireRole, ok, fail } from "@/lib/api";
import { cariMuridT6, moeTersedia } from "@/lib/moe-murid";

// Carian murid T6 dari private.vw_murid (MOE) untuk dipilih sebagai peserta program.
export async function GET(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  if (!moeTersedia()) return fail("Sambungan data murid MOE belum dikonfigurasi (MOE_DATABASE_URL)", 503);

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const sekolah = request.nextUrl.searchParams.get("sekolah") ?? "";
  if (q.trim().length < 3 && sekolah.trim().length < 3) {
    return fail("Masukkan sekurang-kurangnya 3 aksara", 422);
  }
  try {
    return ok(await cariMuridT6(q, sekolah, 20));
  } catch (e) {
    console.error("[ecert-program/murid]", e);
    return fail("Gagal mencapai data murid MOE", 502);
  }
}
