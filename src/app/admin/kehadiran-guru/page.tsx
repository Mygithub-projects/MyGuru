import { HalamanSemakKehadiranGuru } from "./HalamanSemak";

export default async function AdminKehadiranGuruPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; jenis?: string }>;
}) {
  return <HalamanSemakKehadiranGuru searchParams={searchParams} backHref="/admin" bolehSahkan={false} />;
}
