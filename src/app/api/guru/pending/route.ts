import { requireGuruOrAdmin, ok } from "@/lib/api";
import { getGuruDashboard } from "@/lib/guru";
import { guruSeluruhSekolah } from "@/lib/workflow";

// GET /api/guru/pending — senarai item menunggu pengesahan guru (live),
// mengikut skop seliaan. Untuk Admin, skop = seluruh sekolah.
export async function GET() {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;

  // getGuruDashboard memerlukan objek Guru; bina skop-penuh untuk Admin.
  const guruEff =
    guru ??
    ({
      id: "admin",
      nama: "Pentadbir",
      jawatanKoko: "Penyelaras",
      kelabDiselia: null,
      sukanDiselia: null,
      badanDiselia: null,
    } as Parameters<typeof getGuruDashboard>[0]);

  const d = await getGuruDashboard(guruEff);

  const ringkasan = {
    pencapaian: d.pencapaian.length,
    aktivitiLuar: d.aktivitiLuar.length,
    pertukaran: d.pertukaran.length,
    laporanMingguan: d.laporanMingguan.length,
    laporanProjek: d.laporanProjek.length,
    sesiKehadiran: d.sesiKehadiran.length,
    cadanganJawatan: d.cadanganJawatan.length,
  };
  const jumlah = Object.values(ringkasan).reduce((a, b) => a + b, 0);

  return ok(
    {
      skop: guru && !guruSeluruhSekolah(guru) ? "unit-seliaan" : "seluruh-sekolah",
      jumlah,
      ringkasan,
      item: {
        pencapaian: d.pencapaian,
        aktivitiLuar: d.aktivitiLuar,
        pertukaran: d.pertukaran,
        laporanMingguan: d.laporanMingguan,
        laporanProjek: d.laporanProjek,
        sesiKehadiran: d.sesiKehadiran,
        cadanganJawatan: d.cadanganJawatan,
      },
    },
    "OK"
  );
}
