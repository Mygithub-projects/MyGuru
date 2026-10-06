import type { NextRequest } from "next/server";
import { requireRole, ok, fail } from "@/lib/api";
import { formatNoSiri, nomborSiriSeterusnya } from "@/lib/ecert-program";

// No. Siri seterusnya bagi tahun dipilih — untuk pratonton sijil.
export async function GET(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const tahun = Number(request.nextUrl.searchParams.get("tahun"));
  if (!Number.isInteger(tahun) || tahun < 2020 || tahun > 2100) return fail("Tahun tidak sah", 422);
  const n = await nomborSiriSeterusnya(tahun);
  return ok({ nombor: n, noSiri: formatNoSiri(tahun, n) });
}
