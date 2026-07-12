import Link from "next/link";
import { TambahPelajarForm } from "./TambahPelajarForm";

export default function TambahPelajarPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← Kembali ke Dashboard</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">Tambah Pelajar Baharu</h1>
        <p className="text-sm text-slate-500">
          Daftarkan pelajar T6 baharu secara individu. Sistem akan mencipta akaun log masuk
          (No. IC) secara automatik. Untuk kemasukan pukal, gunakan{" "}
          <Link href="/admin/import" className="text-brand-dark underline">Import Data</Link>.
        </p>
      </div>
      <TambahPelajarForm />
    </div>
  );
}
