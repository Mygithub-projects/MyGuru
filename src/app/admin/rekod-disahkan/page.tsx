import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RekodDisahkanPage } from "@/components/RekodDisahkanPage";

// Akses /admin dihadkan kepada Admin oleh src/proxy.ts. Admin boleh batalkan semua pengesahan.
export default async function AdminRekodDisahkanPage({ searchParams }: { searchParams: Promise<{ jenis?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { jenis } = await searchParams;
  return <RekodDisahkanPage pelaku={{ guru: null, userId: session.userId }} jenis={jenis} basePath="/admin/rekod-disahkan" />;
}
