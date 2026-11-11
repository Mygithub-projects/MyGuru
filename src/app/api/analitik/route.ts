import type { NextRequest } from "next/server";
import { requireGuruOrAdmin, ok } from "@/lib/api";
import { guruSeluruhSekolah } from "@/lib/workflow";
import {
  normalBahagian,
  skopAnalitikBahagian,
  analitikKehadiran,
  analitikTrendKehadiran,
  analitikProjek,
  analitikLaporan,
  analitikDemografi,
  analitikStatusPilihanT6,
  crosstabJantinaKoko,
} from "@/lib/analitik";

// GET /api/analitik — agregat kohort (live), mengikut skop peranan.
// Admin / guru seluruh sekolah: penuh; guru unit: ditapis ke unit seliaan.
// ?bahagian=Uniform|Kelab|Sukan menapis lagi ke BU/KP/SP.
export async function GET(request: NextRequest) {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;

  const seluruh = !guru || guruSeluruhSekolah(guru);
  const { units, bahagian } = await skopAnalitikBahagian(
    guru?.id ?? null,
    seluruh,
    normalBahagian(request.nextUrl.searchParams.get("bahagian")),
  );

  const [kehadiran, trendKehadiran, statusPilihanT6, projek, laporan, demografi, crosstab] =
    await Promise.all([
      analitikKehadiran(units),
      analitikTrendKehadiran(units),
      analitikStatusPilihanT6(units),
      analitikProjek(units),
      analitikLaporan(units),
      // Demografi & cross-tab kohort-penuh hanya untuk skop seluruh sekolah.
      seluruh ? analitikDemografi() : Promise.resolve(null),
      seluruh ? crosstabJantinaKoko() : Promise.resolve(null),
    ]);

  return ok(
    {
      skop: seluruh ? "seluruh-sekolah" : "unit-seliaan",
      bahagian: bahagian ?? null,
      units: units ?? null,
      kehadiran,
      trendKehadiran,
      statusPilihanT6,
      projek,
      laporan,
      demografi,
      crosstab,
    },
    "OK"
  );
}
