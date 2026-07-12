import { requireGuruOrAdmin, ok } from "@/lib/api";
import { guruSeluruhSekolah, unitSeliaan } from "@/lib/workflow";
import {
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
export async function GET() {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;

  const seluruh = !guru || guruSeluruhSekolah(guru);
  const units = seluruh ? undefined : await unitSeliaan(guru!);

  const [kehadiran, trendKehadiran, statusPilihanT6, projek, laporan, demografi, crosstab] =
    await Promise.all([
      analitikKehadiran(units),
      analitikTrendKehadiran(units),
      analitikStatusPilihanT6(units),
      analitikProjek(),
      analitikLaporan(),
      // Demografi & cross-tab kohort-penuh hanya untuk skop seluruh sekolah.
      seluruh ? analitikDemografi() : Promise.resolve(null),
      seluruh ? crosstabJantinaKoko() : Promise.resolve(null),
    ]);

  return ok(
    {
      skop: seluruh ? "seluruh-sekolah" : "unit-seliaan",
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
