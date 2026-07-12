import Link from "next/link";
import { TambahGuruForm } from "./TambahGuruForm";

export default function TambahGuruPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/guru" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← Kembali ke Urus Guru</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">Tambah Guru Baharu</h1>
        <p className="text-sm text-slate-500">
          Daftarkan guru/guru penasihat baharu beserta jawatan kokurikulum dan unit seliaan.
          Sistem akan mencipta akaun log masuk untuk guru ini secara automatik.
        </p>
      </div>
      <TambahGuruForm />
    </div>
  );
}
