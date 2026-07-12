import Link from "next/link";
import { ImportClient } from "./ImportClient";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← Kembali</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">Import Data (CSV/Excel)</h1>
        <p className="text-sm text-slate-500">
          Muat naik fail PAJSK (pelajar) atau borang pendaftaran Guru. No. IC dibaca sebagai teks
          (digit penuh dikekalkan). Rekod sedia ada dikemas kini (upsert).
        </p>
      </div>
      <ImportClient />
    </div>
  );
}
