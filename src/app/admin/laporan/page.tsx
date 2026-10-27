import { getT } from "@/lib/locale";
import { senaraiLaporanSU } from "@/lib/laporan-semakan";
import { LaporanSemakan } from "@/components/LaporanSemakan";

// Akses /admin dihadkan kepada Admin oleh src/proxy.ts.
export default async function AdminLaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ jenis?: string; status?: string }>;
}) {
  const { t } = await getT();
  const sp = await searchParams;
  const jenis = sp.jenis ?? "";
  const status = sp.status ?? "";
  const rows = await senaraiLaporanSU(null, { jenis, status });
  return <LaporanSemakan rows={rows} basePath="/admin/laporan" jenis={jenis} status={status} t={t} />;
}
