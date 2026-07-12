import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

const CONTENT: Record<string, { tajuk: string; seksyen: { h: string; isi: string[] }[]; balik: string }> = {
  Pelajar: {
    tajuk: "Bantuan — Pelajar",
    balik: "/pelajar",
    seksyen: [
      { h: "Dashboard", isi: ["Lihat markah PAJSK T6, gred, pecahan komponen (Kehadiran, Jawatan, Penglibatan, Pencapaian, Projek), dan carta markah."] },
      { h: "Pencapaian & Aktiviti", isi: ["Isi pencapaian/aktiviti luar + muat naik eviden.", "Aktiviti luar perlu surat & sijil untuk menjana e-Cert selepas guru sahkan."] },
      { h: "Pertukaran Unit", isi: ["Mohon tukar unit; unit dikemas kini selepas guru lulus."] },
      { h: "e-Cert & Butiran Diri", isi: ["Jana e-Cert PDF untuk aktiviti yang diluluskan.", "Cetak Butiran Diri PDF dari dashboard."] },
      { h: "SU/NSU", isi: ["Menu Kehadiran (sesi + QR) dan Laporan (mingguan/projek) jika anda Setiausaha."] },
    ],
  },
  Guru: {
    tajuk: "Bantuan — Guru",
    balik: "/guru",
    seksyen: [
      { h: "Semakan", isi: ["Dashboard memaparkan item Pending dalam skop seliaan anda.", "Lulus/Tolak pertukaran; Sahkan/Kuiri pencapaian, aktiviti luar, laporan & sesi kehadiran."] },
      { h: "Markah", isi: ["Pengesahan mengira semula markah PAJSK T6 pelajar secara automatik."] },
      { h: "Analitik", isi: ["Lihat & eksport analitik kehadiran, projek, laporan (dan demografi jika skop seluruh sekolah)."] },
    ],
  },
  Admin: {
    tajuk: "Bantuan — Pentadbir",
    balik: "/admin",
    seksyen: [
      { h: "Import Data", isi: ["Muat naik Excel PAJSK/Guru; No. IC disimpan sebagai teks; rekod di-upsert."] },
      { h: "Tetapan", isi: ["Konfigur formula markah & templat e-Cert (penandatangan, tajuk, cop)."] },
      { h: "Demografi & Analitik", isi: ["Lengkapkan demografi pelajar; lihat & eksport analitik seluruh kohort."] },
    ],
  },
};

export default async function BantuanPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const c = CONTENT[session.role] ?? CONTENT.Pelajar;

  return (
    <div className="app-shell min-h-full flex-1">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <Link href={c.balik} className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← Kembali</Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">{c.tajuk}</h1>
          <p className="text-sm text-slate-500">Panduan ringkas penggunaan sistem KoKurikulum.</p>
        </div>
        {c.seksyen.map((s) => (
          <section key={s.h} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-dark">{s.h}</h2>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
              {s.isi.map((i, idx) => <li key={idx}>{i}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
